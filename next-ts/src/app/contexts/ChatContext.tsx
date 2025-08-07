"use client"
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import {
  ChatContextType,
  SelectedDocument,
  UploadedDocument,
  ChatHistory,
} from "@/types/chat";

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const [errors, setErrors] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [currentChatTitle, setCurrentChatTitle] = useState<string>("New Chat");
  const [selectedDocument, setSelectedDocument] =
    useState<SelectedDocument | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
  const onToggleHistory = () => setShowChatHistory(!showChatHistory);
  const handleNewChat = useCallback(() => {
    window.location.href = "/";
    setIsMobileMenuOpen(false);
  }, []);
  const handleChatSelect = useCallback((chatId: string, title: string) => {
    window.location.href = `/?id=${chatId}`;
    setIsMobileMenuOpen(false);
  }, []);
  return (
    <ChatContext.Provider
      value={{
        showChatHistory,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        showFileMenu,
        setShowFileMenu,
        usageOpen,
        setUsageOpen,
        setShowChatHistory,
        errors,
        setErrors,
        handleNewChat,
        chatHistory,
        selectedChat,
        setSelectedChat,
        onChatSelect: handleChatSelect,
        currentChatTitle,
        setCurrentChatTitle,
        handleRemoveDocument,
        handleDocumentSelect,
        setSelectedDocument,
        selectedDocument,
        setShowDocumentModal,
        showDocumentModal,
        fileInputRef,
        selectedFiles,
        setSelectedFiles,
        setChatHistory,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
}
