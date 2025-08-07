import React from "react";
import { UsageStats } from "./usage";
export interface ChatContextType {
  showChatHistory: boolean;
  isMobileMenuOpen: boolean;
  showFileMenu: boolean;
  usageOpen: boolean;
  errors: string | null;
  setShowChatHistory: React.Dispatch<React.SetStateAction<boolean>>;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setShowFileMenu: React.Dispatch<React.SetStateAction<boolean>>;
  setUsageOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setErrors: React.Dispatch<React.SetStateAction<string | null>>;
  handleNewChat: () => void;
  chatHistory: ChatHistory[];
  selectedChat: string | null;
  setSelectedChat: React.Dispatch<React.SetStateAction<string | null>>;
  onChatSelect: (chatId: string, title: string) => void;
  currentChatTitle: string ;
  setCurrentChatTitle: React.Dispatch<React.SetStateAction<string>>;
  selectedDocument: SelectedDocument | null;
  setSelectedDocument: React.Dispatch<React.SetStateAction<SelectedDocument | null>>

  handleRemoveDocument: () => void;
  handleDocumentSelect: (document: UploadedDocument) => void;
  setShowDocumentModal: React.Dispatch<React.SetStateAction<boolean>>;
  showDocumentModal: boolean;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
  setSelectedFiles:  React.Dispatch<React.SetStateAction<File[]>>;
  selectedFiles: File[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatHistory[]>>;

}
export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  createdAt: string;
  chatId: string;
  files?: File[];
  type?: string;
  isStreaming?: boolean;

}

export interface ChatHistory {
  id: string;
  title: string;
  updatedAt: string;
}

export interface SidebarHeaderProps {
  showChatHistory: boolean;
  isMobileMenuOpen: boolean;
  onToggleHistory: () => void;
  onNewChat: () => void;
}

export interface HeaderProps {
  currentChatTitle: string;
  onOpenMobileMenu: () => void;
  children?: React.ReactNode;
}
export interface ChatHistoryListProps {
  chatHistory: ChatHistory[];
  selectedChat: string | null;
  showChatHistory: boolean;
  isMobileMenuOpen: boolean;
  onChatSelect: (chatId: string, title: string) => void;
}
export interface SidebarProps {
  showChatHistory: boolean;
  isMobileMenuOpen: boolean;
  chatHistory: ChatHistory[];
  selectedChat: string | null;
  onToggleHistory: () => void;
  onNewChat: () => void;
  setUsageOpen: React.Dispatch<React.SetStateAction<boolean>>;
  usage: UsageStats | null;
  onChatSelect: (chatId: string, title: string) => void;
  onCloseMobile: () => void;
}

export interface MessageBubbleProps {
  message: Message;
}
export interface LoadingIndicatorProps {}

export interface FileUploaderProps {
  selectedFiles: File[];
  showFileMenu: boolean;
  onToggleFileMenu: () => void;
  onFileSelect: (type: 'image' | 'document') => void;
  onRemoveFile: (index: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export interface UploadedDocument {
  id: string;
  type: string;
  name: string;
  uploadAt: string;
  url: string;
  size: number;
}

export interface DocumentModalProps {
  isOpen: boolean;
  documents: UploadedDocument[];
  onClose: () => void;
  isUploading: boolean;
  onSelectDocument: (document: UploadedDocument) => void;
  isLoading: boolean;
  onUploadDocument:()=> void;
  uploadDisabled: boolean;

}


export interface SelectedDocument {
  id: string;
  name: string;
  type: string;
}

export interface MarkdownRendererProps {
  message: Message;
  className?: string
}