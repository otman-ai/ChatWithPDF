import { UsageStats } from "./usage";
import { ReactNode } from "react";

export interface ButtonProps {
  href: string;
  childern?: ReactNode,
  title: string
}
export interface ProfileButtonProps {
  showChatHistory?: boolean;
  usage: UsageStats | null;
  setUsageOpen: (open: boolean) => void;
}