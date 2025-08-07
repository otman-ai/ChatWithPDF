import { Suspense } from "react";
import ChatPlayground from "@/components/ChatPlayground";
import LoadingAnim from "@/components/LoadingAnim";
import { UserProvider } from "@/app/contexts/UserContext";
import { ChatProvider } from "@/app/contexts/ChatContext";
import { COLORS } from "@/constants";
export default function Page() {

  return (
    <div className={`fixed inset-0 z-50 ${COLORS.surface}`}>
      <UserProvider>
        <ChatProvider>
          <Suspense fallback={<LoadingAnim />}>
            <ChatPlayground />
          </Suspense>
      </ChatProvider>
      </UserProvider>
    </div>
  );
}
