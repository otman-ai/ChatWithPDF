"use client";
import React from "react";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { ExternalLink } from "lucide-react";
import { ButtonProps, ProfileButtonProps } from "@/types/button";

export function GoogleSign() {
  return (
    <button
      className="cursor-pointer bg-blue-600 px-4 py-2 text-white font-semibold rounded-lg"
      onClick={() =>
        signIn("google", {
          callbackUrl: "/",
        })
      }
    >
      Google Sign in
    </button>
  );
}

export function ProfileButton({
  showChatHistory,
  usage,
  setUsageOpen,
}: ProfileButtonProps) {
  const { data: session } = useSession();

  if (session) {
    return (
      <div
        className="p-2 hover:bg-gray-800 rounded-lg text-sm w-full cursor-pointer"
        onClick={() => setUsageOpen(true)}
      >
        <div className="flex justify-between space-x-3">
          <div className="flex justify-start space-x-3">
            <img
              src={session.user?.image ?? undefined}
              className="rounded-full w-7 h-7 object-cover flex justify-start items-center"
            />
            {showChatHistory && (
              <div className="justify-ce">
                <p className="text-white text-start">{session.user?.name}</p>
                <p className="text-gray-400 text-start">{usage?.plan}</p>
              </div>
            )}
          </div>

          {showChatHistory && (
            <button
              title="Sign out"
              onClick={() => signOut()}
              className="px-3 rounded-lg cursor-pointer hover:bg-gray-700"
            >
              <ExternalLink className="w-4 h-4" color="gray" />
            </button>
          )}
        </div>
      </div>
    );
  }
}

export const SecondaryButton: React.FC<ButtonProps> = ({
  href,
  childern,
  title,
}) => {
  return (
    <Link
      href={href}
      className="group border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-blue-600 hover:text-blue-600 transition-all duration-300 flex items-center justify-center"
    >
      {childern}
      {title}
    </Link>
  );
};

export const DefaultButton: React.FC<ButtonProps> = ({ href, title }) => {
  return (
    <div className="text-center mt-12">
      <a
        href={href}
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
      >
        {title}
      </a>
    </div>
  );
};
const PrimaryButton: React.FC<ButtonProps> = ({ href, childern, title }) => {
  return (
    <Link
      href={href}
      className="group border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-blue-600 hover:text-blue-600 transition-all duration-300 flex items-center justify-center"
    >
      {childern}
      {title}
    </Link>
  );
};
export default PrimaryButton;
