"use client"
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from "next-auth/react";

// Types
import {
  Message, 
  ChatHistory, 
  UploadedDocument,
  SelectedDocument
} from "@/types/chat";

import {
  UsageStats
} from "@/types/usage"
// Components
import {
  DocumentModal, 
  Sidebar,
  Header,
  MessageBubble,
  LoadingIndicator,
  UsageModel,
  NotLogin,
  EnhancedFileUploader 
} from "@/components/Chat";
import Errors from "@/components/Status";

// Hooks and utilities
import useApiCall from "@/hooks/hooks";
import { COLORS } from "@/constants";

export default function ChatPlayground() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const { data: session, status } = useSession();

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Core chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentChatTitle, setCurrentChatTitle] = useState<string>('New Chat');

  // UI state
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const [errors, setErrors] = useState<string | null>(null);

  // Document state
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<SelectedDocument | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);

  // Usage state
  const [usage, setUsage] = useState<UsageStats | null>(null);

  // Initialize API hook after all state
  const { apiCall } = useApiCall({ setErrors });


  // Utility functions
  const setSearchParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`?${params.toString()}`);
  }, [searchParams, router]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Validation functions
  const isMessageLimitsExceeded = useCallback(() => {
    if (usage?.messages?.canSend) {
      return false;
    }
    setErrors("Message limits exceeded, upgrade for more.");
    return true;
  }, [usage?.messages?.canSend]);

  const isUploadLimitsExceeded = useCallback(() => {
    if (usage?.documents?.canUpload) {
      return false;
    }
    setErrors("Upload limits exceeded, upgrade for more.");
    return true;
  }, [usage?.documents?.canUpload]);

  // API functions
  const fetchUsage = useCallback(async () => {
    try {
      const response = await fetch('/api/usage');
      const data = await response.json();
      setUsage(data);
    } catch (error) {
      console.error('Error fetching usage:', error);
      setErrors("Error fetching usage");
    }
  }, []);

  const fetchChats = useCallback(async () => {
    try {
      const data = await apiCall('/api/chat/c');
      if (id) {
        const pageTitle = data.find((item: ChatHistory) => item.id === id)?.title;
        if (pageTitle) {
          setCurrentChatTitle(pageTitle);
          document.title = `${pageTitle} - Chat Playground`;
        }
      }
      setChatHistory(data);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
      setErrors("Failed to fetch chats");
    }
  }, [apiCall, id]);

  const fetchConversation = useCallback(async () => {
    if (!id) return;
    
    try {
      const data = await apiCall(`/api/chat/message?chatId=${id}`);
      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
      setErrors("Failed to fetch conversation");
    }
  }, [apiCall, id]);

  const fetchDocuments = useCallback(async (): Promise<UploadedDocument[]> => {
    try {
      const response = await apiCall('/api/documents');
      return response.documents || [];
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setErrors("Error fetching documents");
      return [];
    }
  }, [apiCall]);

  const uploadDocument = useCallback(async (file: File): Promise<UploadedDocument> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiCall('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response) {
      throw new Error('Upload failed');
    }

    return {
      id: response.id,
      name: response.name || file.name,
      type: response.type || file.type,
      uploadedAt: response.uploadedAt || new Date().toISOString(),
      url: response.url,
      size: response.size
    };
  }, [apiCall]);

  const getAIResponse = useCallback(async (query: string, chatId: string) => {
    try {
      const requestBody = {
        query,
        chatId,
        documentId: selectedDocument?.id || null
      };

      const data = await apiCall('/api/chat/response', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const aiMessage: Message = {
        id: data?.id || Date.now().toString(),
        text: data?.text || "ERROR getting the response",
        isUser: false,
        chatId: data?.chatId || chatId,
        createdAt: data?.createdAt || new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "I apologize, but I encountered an error. Please try again.",
        isUser: false,
        chatId,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, selectedDocument?.id]);

  const createNewChat = useCallback(async () => {
    if (isMessageLimitsExceeded()) return;

    try {
      setIsLoading(true);
      const requestBody = {
        text: inputText,
        ...(selectedDocument && { documentId: selectedDocument.id })
      };

      const data = await apiCall('/api/chat/c', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const newMessage: Message = {
        id: data?.id || Date.now().toString(),
        text: inputText,
        isUser: true,
        chatId: data?.chatId || Date.now().toString(),
        createdAt: data?.createdAt || new Date().toISOString(),
      };

      setSearchParam("id", newMessage.chatId);
      setSelectedChat(newMessage.chatId);
      setMessages(prev => [...prev, newMessage]);
      setCurrentChatTitle(inputText.length > 30 ? inputText.substring(0, 30) + '...' : inputText);
      setSelectedFiles([]);
      setInputText('');

      await getAIResponse(inputText, newMessage.chatId);
      await fetchChats();
    } catch (error) {
      console.error('Failed to create new chat:', error);
      setErrors("Failed to create new chat");
      setIsLoading(false);
    }
  }, [inputText, selectedDocument, isMessageLimitsExceeded, apiCall, setSearchParam, getAIResponse, fetchChats]);

  const addMessageToExistingChat = useCallback(async () => {
    if (!selectedChat || isMessageLimitsExceeded()) return;

    try {
      setIsLoading(true);
      const requestBody = {
        text: inputText,
        chatId: selectedChat,
        ...(selectedDocument && { documentId: selectedDocument.id })
      };

      const data = await apiCall('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const newMessage: Message = {
        id: data?.id || Date.now().toString(),
        text: inputText,
        isUser: true,
        chatId: data?.chatId || selectedChat,
        createdAt: data?.createdAt || new Date().toISOString(),
        ...(selectedFiles.length > 0 && { files: selectedFiles })
      };

      setMessages(prev => [...prev, newMessage]);
      setSelectedFiles([]);
      setInputText('');

      await getAIResponse(newMessage.text, newMessage.chatId);
    } catch (error) {
      console.error('Failed to add message:', error);
      setErrors("Failed to add message");
      setIsLoading(false);
    }
  }, [selectedChat, inputText, selectedDocument, selectedFiles, isMessageLimitsExceeded, apiCall, getAIResponse]);

  // Event handlers
  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() && selectedFiles.length === 0 && !selectedDocument) return;
    
    if (selectedChat) {
      await addMessageToExistingChat();
    } else {
      await createNewChat();
    }
  }, [inputText, selectedFiles, selectedDocument, selectedChat, addMessageToExistingChat, createNewChat]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploadLimitsExceeded()) return;

    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingDocument(true);
    try {
      await uploadDocument(files[0]);
      const allDocuments = await fetchDocuments();
      setUploadedDocuments(allDocuments);
      setShowDocumentModal(true);
    } catch (error) {
      console.error('Failed to upload documents:', error);
    } finally {
      setIsUploadingDocument(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isUploadLimitsExceeded, uploadDocument, fetchDocuments]);

  const handleUploadDocument = useCallback(() => {
    setShowFileMenu(false);
    fileInputRef.current?.click();
  }, []);

  const handleChooseExisting = useCallback(async () => {
    setShowFileMenu(false);
    setIsLoadingDocuments(true);
    
    try {
      const documents = await fetchDocuments();
      setUploadedDocuments(documents);
      setShowDocumentModal(true);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, [fetchDocuments]);

  const handleDocumentSelect = useCallback((document: UploadedDocument) => {
    setSelectedDocument({
      id: document.id,
      name: document.name,
      type: document.type,
    });
    setShowDocumentModal(false);
  }, []);

  const handleRemoveDocument = useCallback(() => {
    setSelectedDocument(null);
  }, []);

  const handleChatSelect = useCallback((chatId: string, title: string) => {
    window.location.href = `/playground/chat/home?id=${chatId}`;
    setIsMobileMenuOpen(false);
  }, []);

  const handleNewChat = useCallback(() => {
    window.location.href = '/playground/chat/home';
    setIsMobileMenuOpen(false);
  }, []);

  // Effects
  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  useEffect(() => {
    if (usageOpen) {
      fetchUsage();
    }
  }, [usageOpen, fetchUsage]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [inputText]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    const initializeChat = async () => {
      if (id) {
        setSelectedChat(id);
        await fetchConversation();
        const chat = chatHistory.find(c => c.id === id);
        if (chat) {
          setCurrentChatTitle(chat.title);
          document.title = `${chat.title} - Chat Playground`;
        }
      } else {
        document.title = 'New Chat - Chat Playground';
        setCurrentChatTitle('New Chat');
      }
    };
    
    initializeChat();
  }, [id, fetchConversation, chatHistory]);

  useEffect(() => {
    if (currentChatTitle && currentChatTitle !== 'New Chat') {
      document.title = `${currentChatTitle} - Chat Playground`;
    }
  }, [currentChatTitle]);
  // Loading check - moved after all hooks
  if (status === "loading") return <p>Loading...</p>;
  if (!session) return <NotLogin />;

  return (
    <div className={`flex h-screen ${COLORS.surface} overflow-hidden`}>
      <Sidebar
        showChatHistory={showChatHistory}
        setUsageOpen={setUsageOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        chatHistory={chatHistory}
        selectedChat={selectedChat}
        onToggleHistory={() => setShowChatHistory(!showChatHistory)}
        onNewChat={handleNewChat}
        onChatSelect={handleChatSelect}
        usage={usage}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          currentChatTitle={currentChatTitle}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-600">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            {isLoading && <LoadingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className={`${COLORS.surface} p-6 ${COLORS.border} border-t hide-scrollbar`}>
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <EnhancedFileUploader
                handleFileChange={handleFileChange}
                selectedFiles={selectedFiles}
                disabled={!usage?.documents?.canUpload}
                selectedDocument={selectedDocument}
                showFileMenu={showFileMenu}
                onToggleFileMenu={() => setShowFileMenu(!showFileMenu)}
                onUploadDocument={handleUploadDocument}
                onChooseExisting={handleChooseExisting}
                onRemoveFile={(index) => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                onRemoveDocument={handleRemoveDocument}
                fileInputRef={fileInputRef}
              />

              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading || isUploadingDocument}
                className={`hide-scrollbar w-full pl-16 pr-16 py-4 ${COLORS.surfaceDark} ${COLORS.border} border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${COLORS.text} placeholder-slate-500 min-h-[56px] max-h-[200px] text-base leading-6 disabled:opacity-50 transition-colors backdrop-blur-sm`}
                rows={1}
              />

              <div className="absolute right-4 bottom-4">
                <button
                  onClick={handleSendMessage}
                  disabled={(!inputText.trim() && selectedFiles.length === 0 && !selectedDocument) || isLoading || isUploadingDocument}
                  className={`flex items-center justify-center w-10 h-10 ${COLORS.accent} text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                >
                  {isUploadingDocument ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DocumentModal
        isOpen={showDocumentModal}
        documents={uploadedDocuments}
        onClose={() => setShowDocumentModal(false)}
        onSelectDocument={handleDocumentSelect}
        isLoading={isLoadingDocuments}
      />
      
      <UsageModel
        isOpen={usageOpen}
        usage={usage}
        onClose={() => setUsageOpen(false)}
      />
      
      {errors && <Errors message={errors} setErrors={setErrors} />}
    </div>
  );
}