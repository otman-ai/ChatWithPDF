export interface UsageStats {
  plan: 'FREE' | 'PREMIUM' | 'STARTE';
  isPremium: boolean;
  isStarter: boolean
  documents: {
    current: number;
    max: number;
    canUpload: boolean;
  };
  messages: {
    current: number;
    max: number;
    canSend: boolean;
  };
  subscriptionStatus?: string
}
export interface UsageModelProps {
  isOpen: boolean;
  usage: {
    plan: string;
    isPremium: boolean;
    isStarter: boolean;
    subscriptionStatus?: string;
    documents: {
      current: number;
      max: number;
      canUpload: boolean;
    };
    messages: {
      current: number;
      max: number;
      canSend: boolean;
    };
  } | null;
  onClose: () => void;
}