"use client"
import { Send, Plus, X, FileText, Image, ExternalLink, MessageSquare, History, Menu, Upload, FolderOpen } from 'lucide-react';
import { AuthButton, GoogleSign } from "@/components/Buttons";
import { useState } from 'react';

import {
  Message, 
  ChatHistory, 
  SidebarHeaderProps, 
  HeaderProps, 
  ChatHistoryListProps,
  MessageBubbleProps,
  LoadingIndicatorProps,
  FileUploaderProps,
  UploadedDocument,
  DocumentModalProps,
  SelectedDocument,
  MarkdownRendererProps,
  SidebarProps } from "@/types/chat"
import {
  UsageModelProps
} from "@/types/usage";
import {COLORS} from "@/constants";
// Install: npm install react-markdown remark-gfm rehype-highlight

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css' // or any other theme


export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Custom component overrides
          h1: ({node, ...props}) => <h1 className="text-3xl font-bold mb-4" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-2xl font-semibold mb-3" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-xl font-medium mb-2" {...props} />,
          p: ({node, ...props}) => <p className="mb-3 leading-relaxed text-lg" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-3" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal ml-6 mb-3" {...props} />,
          li: ({node, ...props}) => <li className="mb-1" {...props} />,
          blockquote: ({node, ...props}) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic" {...props} />
          ),
          code: ({node, ...props}) =>
            node ? (
              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props} />
            ) : (
              <code className="block bg-gray-900 text-white p-4 rounded overflow-x-auto" {...props} />
            ),
          pre: ({node, ...props}) => <pre className="mb-4" {...props} />,
          a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
          table: ({node, ...props}) => (
            <table className="border-collapse border border-gray-300 my-4" {...props} />
          ),
          th: ({node, ...props}) => (
            <th className="border border-gray-300 px-4 py-2 font-semibold" {...props} />
          ),
          td: ({node, ...props}) => (
            <td className="border border-gray-300 px-4 py-2" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

// Usage example for AI responses
export function AIResponseRenderer({message}:MessageBubbleProps) {


  return (
    <div className="max-w-4xl mx-auto p-6">
      <MarkdownRenderer content={message.text} className="prose prose-lg" />
    </div>
  )
}
// Document Modal Component
export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  documents,
  onClose,
  onSelectDocument,
  isLoading
}) => {
  if (!isOpen) return null;

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="w-5 h-5" />;
    }
    return <FileText className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`${COLORS.surface} rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col`}>
        {/* Modal Header */}
        <div className={`p-6 ${COLORS.border} border-b flex items-center justify-between`}>
          <h2 className={`text-xl font-semibold ${COLORS.text}`}>
            Choose Document
          </h2>
          <button
            onClick={onClose}
            className={`${COLORS.textSecondary}  hover:${COLORS.text} transition-colors`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className={COLORS.textSecondary}>Loading documents...</span>
              </div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className={`w-16 h-16 ${COLORS.textMuted} mx-auto mb-4`} />
              <p className={`${COLORS.textSecondary} text-lg mb-2`}>No documents found</p>
              <p className={`${COLORS.textMuted} text-sm`}>Upload some documents to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => onSelectDocument(doc)}
                  className={`
                    p-4 rounded-lg cursor-pointer transition-all duration-200
                    ${COLORS.surfaceDark} hover:${COLORS.accentSecondary}
                    border ${COLORS.border} hover:border-blue-300
                  `}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`${COLORS.accent} p-2 rounded-lg`}>
                      {getFileIcon(doc.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium ${COLORS.text} truncate mb-1`}>
                        {doc.name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className={COLORS.textMuted}>
                          {formatFileSize(doc.size)}
                        </span>
                        <span className={COLORS.textMuted}>
                          {formatDate(doc.uploadedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const NotLogin = ()=>{
   return (

      <div className={`${COLORS.surface} w-full h-full justify-center items -center flex flex-col`}>
        <div className="flex justify-center">
        <GoogleSign/>	
    
	</div>

    </div>
)
}

// Usage Modal Component
export const UsageModel: React.FC<UsageModelProps> = ({
  isOpen,
  usage,
  onClose,
}) => {
  if (!isOpen) return null;
  const [isLoading, setIsLoading] = useState(false);

  const getSessionPortal = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'GET',
      })
      const {url} = await response.json()
      if(url){
        window.location.href = url;
      }
    }catch (error){
      console.error("Error creating portal session");
      setIsLoading(false)
    }
  }
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`${COLORS.surface} rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col`}>
        {/* Modal Header */}
        <div className={`p-6 ${COLORS.border} border-b flex items-center justify-between`}>
          <h2 className={`text-xl font-semibold ${COLORS.text}`}>
            Usage Stats
          </h2>
          <button
            onClick={onClose}
            className={`${COLORS.textSecondary}  hover:${COLORS.text} transition-colors`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
      {/* Current Usage Stats */}
      {usage && (
        <div className={`b-12 ${COLORS.surface} rounded-2xl p-6 space-y-2 text-white`}>
          <span className={`font-medium  ${COLORS.text}`}>Current Plan :</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            usage.isPremium || usage.isStarter
              ? 'text-blue-500' 
              : 'text-gray-200'
          }`}>
            {usage?.plan[0] + usage?.plan?.toLowerCase()?.slice(1)}
          </span>
          {usage.plan !== "FREE" && 
          <span 
          className={`${usage.subscriptionStatus === "ACTIVE" ?'text-green-600 bg-green-100':'text-orange-600 bg-orange-100'} 
          text-xs p-1 rounded-lg text-center font-medium m-1`}>{usage.subscriptionStatus?.toLowerCase()}</span>
        }
          <div className="pt-2">
                     
          <h3 className={`${COLORS.text} font-medium`}>Usage overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Documents Usage */}
            <div className=" rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${COLORS.textSecondary}`}>PDF Documents</span>
                <span className={`text-sm font-medium ${COLORS.textSecondary}`}>
                  {usage.documents.current}
                  {usage.documents.max === -1 ? ' / ∞' : ` / ${usage.documents.max}`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    usage.documents.canUpload ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ 
                    width: usage.documents.max === -1 
                      ? '100%' 
                      : `${Math.min((usage.documents.current / usage.documents.max) * 100, 100)}%` 
                  }}
                />
              </div>
              {!usage.documents.canUpload && (
                <p className="text-xs text-red-600 mt-1">Limit reached</p>
              )}
            </div>

            {/* Messages Usage */}
            <div className="rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${COLORS.textSecondary}`}>Messages This Month</span>
                <span className={`text-sm font-medium ${COLORS.textSecondary}`}>
                  {usage.messages.current}
                  {usage.messages.max === -1 ? ' / ∞' : ` / ${usage.messages.max}`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    usage.messages.canSend ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ 
                    width: usage.messages.max === -1 
                      ? '100%' 
                      : `${Math.min((usage.messages.current / usage.messages.max) * 100, 100)}%` 
                  }}
                />
              </div>
              {!usage.messages.canSend && (
                <p className="text-xs text-red-600 mt-1">Monthly limit reached</p>
              )}
            </div>
            <div className="w-full h-fit">
                          {usage.plan == "FREE" && 
            <a href="/pricing" target='_blank' 
            className="px-5 py-3 text-blue-600 underline-blue-600 font-basic text-center">
              Upgrade for unlimited credits
            </a>}
            {usage?.plan !== "FREE" && 
              <button 
  className="px-5 py-3 text-blue-600 underline-blue-600 font-basic text-center"
  disabled={isLoading}  // Fix typo from 'disbaled'
  onClick={() => getSessionPortal()}>
  {isLoading ? 'Loading...' : 'Manage My subscription'}
</button>}
            </div>

          </div>
          </div>

        </div>
      )}
      </div>
    </div>
  );
};



// Selected Document Display Component
export const SelectedDocumentDisplay: React.FC<{
  document: SelectedDocument;
  onRemove: () => void;
}> = ({ document, onRemove }) => {
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="mb-4">
      <div className={`inline-flex items-center space-x-3 ${COLORS.accent} text-white rounded-lg px-4 py-2`}>
        {getFileIcon(document.type)}
        <span className="text-sm font-medium truncate max-w-48">
          {document.name}
        </span>
        <button
          onClick={onRemove}
          className="hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  showChatHistory,
  isMobileMenuOpen,
  onToggleHistory,
  onNewChat
}) => (
  <div className={`p-4 ${COLORS.border} border-b flex items-center justify-between`}>
    <button
      onClick={onToggleHistory}
      className={`flex items-center justify-center w-10 h-10 ${COLORS.accentSecondary} ${COLORS.textSecondary} rounded-lg transition-colors`}
    >
      <Menu className="w-5 h-5" />
    </button>
    
    {(showChatHistory || isMobileMenuOpen) && (
      <button
        onClick={onNewChat}
        className={`flex items-center space-x-2 px-4 py-2 ${COLORS.accent} text-white rounded-lg transition-colors font-medium`}
      >
        <Plus className="w-4 h-4" />
      </button>
    )}
  </div>
);

export const ChatHistoryList: React.FC<ChatHistoryListProps> = ({
  chatHistory,
  selectedChat,
  showChatHistory,
  isMobileMenuOpen,
  onChatSelect
}) => {
  if (!showChatHistory && !isMobileMenuOpen) return null;

  return (
    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-600">
      <div className="space-y-1">
        {chatHistory.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onChatSelect(chat.id, chat.title)}
            className={`
              w-full cursor-pointer text-left p-3 rounded-lg transition-all duration-200 group
              ${selectedChat === chat.id 
                ? `${COLORS.surfaceDark} ${COLORS.text}` 
                : `${COLORS.textSecondary} hover:${COLORS.surfaceDark} hover:${COLORS.text}`
              }
            `}
          >
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-60" />
              <span className="text-sm font-medium truncate">
                {chat.title}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  showChatHistory,
  isMobileMenuOpen,
  chatHistory,
  selectedChat,
  onToggleHistory,
  onNewChat,
  setUsageOpen,
  onChatSelect,
  onCloseMobile,
  usage
}) => (
  <>
    {/* Sidebar */}
    <div className={`
      ${showChatHistory || isMobileMenuOpen ? 'w-80' : 'w-16'} 
      ${isMobileMenuOpen ? 'fixed inset-y-0 left-0 z-50' : 'relative'} 
      ${COLORS.surface} ${COLORS.border} border-r backdrop-blur-xl
      transition-all duration-300 flex-shrink-0 flex flex-col
      lg:relative lg:z-auto
    `}>
      <SidebarHeader 
        showChatHistory={showChatHistory}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleHistory={() => {
          onToggleHistory();
          onCloseMobile();
        }}
        onNewChat={onNewChat}
      />

      <ChatHistoryList
        chatHistory={chatHistory}
        selectedChat={selectedChat}
        showChatHistory={showChatHistory}
        isMobileMenuOpen={isMobileMenuOpen}
        onChatSelect={onChatSelect}
      />

      <div className={`p-4 ${COLORS.border} border-t`}>
        <AuthButton 
            usage={usage}
           showChatHistory={showChatHistory || isMobileMenuOpen} 
           setUsageOpen={setUsageOpen} />
      </div>
    </div>
  </>
);

export const Header: React.FC<HeaderProps> = ({ currentChatTitle, onOpenMobileMenu }) => (
  <div className={`${COLORS.surface} ${COLORS.border} border-b px-6 py-4 flex items-center justify-between`}>
    <div className="flex items-center space-x-4">
      <h1 className={`text-xl font-semibold ${COLORS.text} truncate`}>
        {currentChatTitle}
      </h1>
    </div>
    
    <button
      onClick={() => window.location.href = '/projects'}
      className={`flex items-center space-x-2 px-4 py-2 ${COLORS.accentSecondary} ${COLORS.textSecondary} rounded-lg transition-colors font-medium`}
    >
      <span className="hidden sm:inline">Exit to Projects</span>
      <ExternalLink className="w-4 h-4" />
    </button>
  </div>
);

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  // const { content } = matter(message);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl rounded-2xl px-5 py-4 ${
          message.isUser
            ? `${COLORS.primary} text-white backdrop-blur-sm`
            : `${COLORS.text}`
        }`}
      >
        {message.files && message.files.length > 0 && (
          <div className="mb-3 space-y-2">
            {message.files.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 text-sm opacity-80"
              >
                {getFileIcon(file)}
                <span className="truncate">{file.name}</span>
              </div>
            ))}
          </div>
        )}
        {message.isUser ? <p className="text-lg text-white">{message.text}</p>:<AIResponseRenderer message={message}/>}
      </div>
    </div>
  );
};

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = () => (
  <div className="flex justify-start">
    <div className={`${COLORS.surfaceDark} ${COLORS.text} ${COLORS.border} border rounded-2xl px-5 py-4 backdrop-blur-sm`}>
      <div className="flex items-center space-x-3">
        <div className="flex space-x-1">
          <div className={`w-2 h-2 bg-slate-400 rounded-full animate-bounce`}></div>
          <div className={`w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100`}></div>
          <div className={`w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200`}></div>
        </div>
        <span className={`text-sm ${COLORS.textMuted}`}>Processing...</span>
      </div>
    </div>
  </div>
);

// Enhanced File Uploader Component
export const EnhancedFileUploader: React.FC<{
  selectedFiles: File[];
  disabled: boolean;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  selectedDocument: SelectedDocument | null;
  showFileMenu: boolean;
  onToggleFileMenu: () => void;
  onUploadDocument: () => void;
  onChooseExisting: () => void;
  onRemoveFile: (index: number) => void;
  onRemoveDocument: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}> = ({
  selectedFiles,
  disabled,
  handleFileChange,
  selectedDocument,
  showFileMenu,
  onToggleFileMenu,
  onUploadDocument,
  onChooseExisting,
  onRemoveFile,
  onRemoveDocument,
  fileInputRef
}) => {
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  return (
    <>
      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className={`flex items-center space-x-2 ${COLORS.surfaceDark} rounded-lg px-3 py-2`}
            >
              {getFileIcon(file)}
              <span className={`text-sm ${COLORS.text} truncate max-w-32`}>
                {file.name}
              </span>
              <button
                onClick={() => onRemoveFile(index)}
                className={`${COLORS.textMuted} cursor-pointer hover:text-red-500 transition-colors`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Selected Document */}
      {selectedDocument && (
        <SelectedDocumentDisplay
          document={selectedDocument}
          onRemove={onRemoveDocument}
        />
      )}

      {/* File Upload Button */}
      <div className="absolute left-4 bottom-4 z-10">
        <button
          onClick={onToggleFileMenu}
          className={`cursor-pointer flex items-center justify-center w-10 h-10 ${COLORS.accentSecondary} ${COLORS.textSecondary} rounded-lg transition-colors`}
        >
          <Plus className="w-4 h-4" />
        </button>
        
        {showFileMenu && (
          <div className={`absolute bottom-12 left-0 ${COLORS.surface} rounded-lg shadow-lg ${COLORS.border} border p-2 min-w-48 z-20 backdrop-blur-xl`}>
            <button
            disabled={disabled}
              onClick={onUploadDocument}
              className={`flex cursor-pointer items-center space-x-3 w-full text-left px-4 py-3 text-sm ${COLORS.text} hover:${COLORS.accentSecondary} rounded-md transition-colors`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
            <button
              onClick={onChooseExisting}
              className={`flex cursor-pointer items-center space-x-3 w-full text-left px-4 py-3 text-sm ${COLORS.text} hover:${COLORS.accentSecondary} rounded-md transition-colors`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>Choose from Existing</span>
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        
        accept=".pdf,.doc,.docx,.txt,image/*"
        className="hidden"
      />
    </>
  );
};
