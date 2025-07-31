import React from "react";
import { UsageStats } from "./usage";

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  createdAt: string;
  chatId: string;
  files?: File[];
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
  uploadedAt: string;
  url: string;
  size: number;
}

export interface DocumentModalProps {
  isOpen: boolean;
  documents: UploadedDocument[];
  onClose: () => void;
  onSelectDocument: (document: UploadedDocument) => void;
  isLoading: boolean;

}


export interface SelectedDocument {
  id: string;
  name: string;
  type: string;
}

export interface MarkdownRendererProps {
  content: string
  className?: string
}