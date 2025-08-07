"use client";
import {
  DocumentModal,
  Sidebar,
  Header,
  MessageBubble,
  UsageModel,
  EnhancedFileUploader,
} from "@/components/Chat";
import { UploadedDocument, ChatHistory } from "@/types/chat";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Paperclip, X } from "lucide-react";
import { Message } from "@/types/chat";
import { COLORS } from "@/constants";
import { useChat } from "@/app/contexts/ChatContext";
import useApiCall from "@/hooks/hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useUser } from "@/app/contexts/UserContext";
import Errors from "@/components/Status";
import LoadingAnim from "./LoadingAnim";

export default function ChatPlayground_() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const { data: session, status } = useSession();

  const {
    currentChatTitle,
    setIsMobileMenuOpen,
    setErrors,
    setSelectedChat,
    selectedChat,
    chatHistory,
    setCurrentChatTitle,
    selectedDocument,
    setSelectedDocument,
    setShowDocumentModal,
    showDocumentModal,
    fileInputRef,
    selectedFiles,
    setSelectedFiles,
    setChatHistory,
    usageOpen,
    setUsageOpen,
    errors,
  } = useChat();

  const { usage } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<
    UploadedDocument[]
  >([]);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isInputLoading, setIsInputLoading] = useState(false);
  const { user } = useUser();

  const { apiCall } = useApiCall({ setErrors });

  const isMessageLimitsExceeded = useCallback(() => {
    if (usage?.messages?.canSend) {
      return false;
    }
    setErrors("Message limits exceeded, upgrade for more.");
    return true;
  }, [usage?.messages?.canSend]);

  const setSearchParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      router.push(`?${params.toString()}`);
    },
    [searchParams, router]
  );

  const handleDocumentSelect = useCallback((document: UploadedDocument) => {
    setSelectedDocument({
      id: document.id,
      name: document.name,
      type: document.type,
    });
    setShowDocumentModal(false);
  }, []);

  const isUploadLimitsExceeded = useCallback(() => {
    if (usage?.documents?.canUpload) {
      return false;
    }
    setErrors("Upload limits exceeded, upgrade for more.");
    return true;
  }, [usage?.documents?.canUpload]);

  const fetchConversation = useCallback(async () => {
    if (!id) return;

    try {
      const data = await apiCall(`/api/chat/message?chatId=${id}`);
      setMessages(data);
    } catch (error) {
      console.error("Failed to fetch conversation:", error);
      setErrors("Failed to fetch conversation");
    }
  }, [apiCall, id]);

  const uploadDocument = useCallback(
    async (file: File): Promise<UploadedDocument> => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiCall("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response) {
        throw new Error("Upload failed");
      }

      return {
        id: response.id,
        name: response.name || file.name,
        type: response.type || file.type,
        uploadAt: response.uploadAt || new Date().toISOString(),
        url: response.url,
        size: response.size,
      };
    },
    [apiCall]
  );

  const fetchDocuments = useCallback(async (): Promise<UploadedDocument[]> => {
    try {
      const response = await apiCall("/api/documents");
      return response.documents || [];
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      setErrors("Error fetching documents");
      return [];
    }
  }, [apiCall]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        console.error("Failed to upload documents:", error);
      } finally {
        setIsUploadingDocument(false);
        if (fileInputRef?.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [isUploadLimitsExceeded, uploadDocument, fetchDocuments]
  );

  const handleUploadDocument = useCallback(() => {
    setShowFileMenu(false);
    fileInputRef?.current?.click();
  }, []);

  const handleChooseExisting = useCallback(async () => {
    setShowDocumentModal(true);
    setShowFileMenu(false);
    setIsLoadingDocuments(true);

    try {
      const documents = await fetchDocuments();
      setUploadedDocuments(documents);
      setShowDocumentModal(true);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, [fetchDocuments]);

  const getAIResponse = useCallback(
    async (query: string, chatId: string) => {
      const streamingMessageId = Date.now().toString();

      // Helper function to simulate word-by-word streaming
      const streamWordsSequentially = async (
        fullText: string,
        messageId: string,
        delay: number = 20
      ) => {
        const words = fullText.split(/(\s+)/); // Split by whitespace but keep separators
        let displayedText = "";

        for (let i = 0; i < words.length; i++) {
          displayedText += words[i];

          // Update message with current text
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? {
                    ...msg,
                    text: displayedText,
                    isStreaming: i < words.length - 1,
                  }
                : msg
            )
          );

          // Auto-scroll during streaming
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 10);

          // Add delay between words (skip delay for whitespace)
          if (words[i].trim() && i < words.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      };

      try {
        const requestBody = {
          query,
          chatId,
          documentId: selectedDocument?.id || null,
        };

        // Create streaming message placeholder
        const streamingMessage: Message = {
          id: streamingMessageId,
          text: "",
          isUser: false,
          chatId,
          createdAt: new Date().toISOString(),
          isStreaming: true,
        };

        setMessages((prev) => [...prev, streamingMessage]);
        setIsInputLoading(true);

        const response = await fetch("/api/chat/response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");

        if (contentType?.includes("text/plain") && response.body) {
          // Handle streaming response - collect all chunks first
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let fullText = "";
          let receivedChunks: string[] = [];

          // First, collect all chunks as they arrive
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            receivedChunks.push(chunk);
            fullText += chunk;
          }

          // Now stream word-by-word from the complete text
          await streamWordsSequentially(fullText, streamingMessageId, 60); // 50ms delay between words
        } else {
          // Handle regular JSON response
          const data = await response.json();
          const responseText = data?.text || "ERROR getting the response";

          // Even for JSON responses, stream word-by-word
          const tempMessage: Message = {
            id: streamingMessageId,
            text: "",
            isUser: false,
            chatId: data?.chatId || chatId,
            createdAt: data?.createdAt || new Date().toISOString(),
            isStreaming: true,
          };

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamingMessageId ? tempMessage : msg
            )
          );

          await streamWordsSequentially(responseText, streamingMessageId, 60);
        }
      } catch (error) {
        console.error("Failed to get AI response:", error);

        const errorMessage: Message = {
          id: Date.now().toString(),
          text: "I apologize, but I encountered an error. Please try again.",
          isUser: false,
          chatId,
          createdAt: new Date().toISOString(),
          isStreaming: false,
        };

        setMessages((prev) => [
          ...prev.filter((msg) => msg.id !== streamingMessageId),
          errorMessage,
        ]);
      } finally {
        setIsInputLoading(false);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    },
    [selectedDocument?.id]
  );

  const fetchChats = useCallback(async () => {
    try {
      const data = await apiCall("/api/chat/c");
      if (id) {
        const pageTitle = data.find(
          (item: ChatHistory) => item.id === id
        )?.title;
        if (pageTitle) {
          setCurrentChatTitle(pageTitle);
          document.title = `${pageTitle} - Chat Playground`;
        }
      }
      setChatHistory(data);
    } catch (error) {
      console.error("Failed to fetch chats:", error);
      setErrors("Failed to fetch chats");
    }
  }, [apiCall, id]);

  const addMessageToChat = useCallback(async () => {
    if (isMessageLimitsExceeded()) return;

    try {
      setIsInputLoading(true);
      const requestBody = {
        text: inputText,
        chatId: selectedChat || undefined,
        ...(selectedDocument && { documentId: selectedDocument.id }),
      };

      const data = await apiCall("/api/chat/message", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      const newMessage: Message = {
        id: data?.id || Date.now().toString(),
        text: inputText,
        isUser: true,
        chatId: data?.chatId || selectedChat,
        createdAt: data?.createdAt || new Date().toISOString(),
        ...(selectedFiles.length > 0 && { files: selectedFiles }),
      };

      setMessages((prev) => [...prev, newMessage]);

      setSelectedFiles([]);
      setInputText("");
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      await getAIResponse(newMessage.text, newMessage.chatId);
      if (!selectedChat) {
        // wait for the response to finish then add the search param
        setTimeout(() => {
          setSearchParam("id", newMessage.chatId);
        }, 300);
      }
    } catch (error) {
      console.error("Failed to add message:", error);
      setErrors("Failed to add message");
      setIsInputLoading(false);
    }
  }, [
    selectedChat,
    inputText,
    selectedDocument,
    selectedFiles,
    isMessageLimitsExceeded,
    apiCall,
    getAIResponse,
  ]);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() && selectedFiles.length === 0 && !selectedDocument)
      return;
    await addMessageToChat();
  }, [
    inputText,
    selectedFiles,
    selectedDocument,
    selectedChat,
    addMessageToChat,
  ]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  // Remove selected document
  const removeSelectedDocument = useCallback(() => {
    setSelectedDocument(null);
  }, [setSelectedDocument]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [inputText]);

  useEffect(() => {
    const initializeChat = async () => {
      if (id) {
        setSelectedChat(id);
        await fetchConversation();
        const chat = chatHistory.find((c) => c.id === id);
        if (chat) {
          setCurrentChatTitle(chat.title);
          document.title = `${chat.title} - Chat Playground`;
        }
      } else {
        document.title = "New Chat - Chat Playground";
        setCurrentChatTitle("New Chat");
      }
    };

    initializeChat();
  }, [id, fetchConversation, chatHistory]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  if (status === "loading") return <LoadingAnim />;

  if (!session) return (window.location.href = "/signup");

  return (
    <div className={`flex h-screen ${COLORS.surface} overflow-hidden`}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentChatTitle={currentChatTitle}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* Messages Container - Fixed for mobile */}
        <div className="flex-1 w-full overflow-y-auto scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-600">
          <div className="px-3 sm:px-6 py-3">
            <div className="max-w-4xl mx-auto space-y-3">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Input Container - Mobile Optimized */}
        <div className={`${COLORS.surface} ${COLORS.border} border-t`}>
          {/* Selected Document Display - Mobile Friendly */}
          {selectedDocument && (
            <div className="px-3 sm:px-6 pt-3">
              <div className="max-w-4xl mx-auto">
                <div
                  className={`flex items-center justify-between p-3 ${COLORS.surfaceDark} ${COLORS.border} border rounded-lg mb-3`}
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <Paperclip className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span className={`text-sm ${COLORS.text} truncate`}>
                      {selectedDocument.name}
                    </span>
                  </div>
                  <button
                    onClick={removeSelectedDocument}
                    className="p-1 hover:bg-red-500/20 rounded-full transition-colors flex-shrink-0 ml-2"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 sm:p-6">
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {/* Mobile File Upload Button */}
                <button
                  disabled={isInputLoading || isUploadingDocument}
                  onClick={() => handleChooseExisting()}
                  className={`absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 ${COLORS.accent} hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg`}
                >
                  <Paperclip className="w-4 h-4 text-white" />
                </button>

                {/* Textarea - Mobile Optimized */}
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isInputLoading || isUploadingDocument}
                  className={`hide-scrollbar w-full pl-12 sm:pl-16 pr-12 sm:pr-16 py-3 sm:py-4 ${COLORS.surfaceDark} ${COLORS.border} border rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${COLORS.text} placeholder-slate-500 min-h-[48px] sm:min-h-[56px] max-h-[150px] sm:max-h-[200px] text-sm sm:text-base leading-5 sm:leading-6 disabled:opacity-50 transition-colors backdrop-blur-sm`}
                  rows={1}
                />

                {/* Send Button - Mobile Optimized */}
                <div className="absolute right-2 sm:right-4 bottom-2 sm:bottom-4">
                  <button
                    onClick={handleSendMessage}
                    disabled={
                      (!inputText.trim() &&
                        selectedFiles.length === 0 &&
                        !selectedDocument) ||
                      isInputLoading ||
                      isUploadingDocument
                    }
                    className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 ${COLORS.accent} text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                  >
                    {isUploadingDocument || isInputLoading ? (
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DocumentModal
        isOpen={showDocumentModal}
        documents={uploadedDocuments}
        isUploading={isUploadingDocument}
        onClose={() => setShowDocumentModal(false)}
        onUploadDocument={handleUploadDocument}
        onSelectDocument={handleDocumentSelect}
        uploadDisabled={!usage?.documents?.canUpload}
        isLoading={isLoadingDocuments}
      />
      <UsageModel
        isOpen={usageOpen}
        usage={usage}
        onClose={() => setUsageOpen(false)}
      />

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept=".pdf"
        className="hidden"
      />

      {/* Error Messages */}
      {errors && <Errors message={errors} setErrors={setErrors} />}
    </div>
  );
}
