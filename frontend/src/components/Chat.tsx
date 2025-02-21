"use client";

import { pixelify_sans } from "@/app/fonts";
import { Name } from "@coinbase/onchainkit/identity";
import { useEffect, useRef, useState } from "react";
import { IoSend } from "react-icons/io5";
import { Loader2 } from "lucide-react";
import { base } from "wagmi/chains";
import { CustomConnectButton } from "./ConnectButton";

interface ChatMessage {
  id: string;
  message: string;
  timestamp: Date;
  address?: `0x${string}`;
  characterName: string;
}

interface ChatProps {
  messages: ChatMessage[];
  chatMode: "STANDARD" | "RECURSIVE";
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const characterColors: { [key: string]: string } = {
  Eric: "text-emerald-600",
  Harper: "text-purple-600",
  Rishi: "text-amber-600",
  Yasmin: "text-rose-600",
  You: "text-blue-600",
};

const Chat = ({
  messages,
  onSendMessage,
  disabled = false,
  chatMode,
}: ChatProps) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState("");

  // Loading state for showing reasoning with a spinner
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Reasoning..");
  const [recursiveCount, setRecursiveCount] = useState(0);

  // Smooth scroll to bottom whenever messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
    // When a new message arrives, remove the loader (if active)
    if (loading) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setLoading(false);
      // In recursive mode increase the count until 10
      if (recursiveCount < 10) {
        setRecursiveCount((prev) => prev + 1);
        setLoading(true);
        setLoadingText("reasoning...");
        startLoadingTimer();
      }
    }
  }, [messages, loading, chatMode]);

  // Clean up the timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const startLoadingTimer = () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      // If still loading after 8 secs, change text and stop the loader
      setLoadingText("Seems no more action to take.. standing by..");
      setLoading(false);
    }, 8000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");

      // In RECURSIVE mode, only show the loader if the recursion limit has not been hit.
      if (chatMode === "RECURSIVE") {
        if (recursiveCount < 10) {
          setRecursiveCount((prev) => prev + 1);
          setLoading(true);
          setLoadingText("reasoning...");
          startLoadingTimer();
        }
      } else {
        // STANDARD mode: always show the loader until a new message comes.
        setLoading(true);
        setLoadingText("reasoning...");
        startLoadingTimer();
      }
    }
  };

  return (
    <div
      className={` ${pixelify_sans.className}
            transition-all duration-300 flex-1 md:flex-none
            md:w-full h-full max-h-screen md:relative
            ${
              isExpanded
                ? "fixed inset-0 z-50 bg-card/95"
                : "relative bg-card/80 backdrop-blur-sm rounded-lg h-14 md:h-full"
            }
        `}
    >
      <div className="flex flex-col h-full">
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
                        p-4 border-b border-gray-200 cursor-pointer
                        flex items-center gap-3
                        md:cursor-default h-14 shrink-0
                    `}
        >
          <div className="flex-1 flex items-center justify-between">
            <h2 className="font-semibold tracking-tight text-2xl text-blue-900 flex items-center gap-2">
              Chat
            </h2>

            <CustomConnectButton />
          </div>
        </div>
        <div
          ref={chatContainerRef}
          className={`
                        overflow-y-auto p-4 space-y-4 flex-1
                        transition-all duration-300
                        ${
                          isExpanded
                            ? "h-[calc(100vh-8rem)]"
                            : "h-0 md:h-[calc(100%-8rem)]"
                        }
                        ${!isExpanded && "md:opacity-100 opacity-0"}
                    `}
        >
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`font-semibold text-sm ${
                    characterColors[msg.characterName] || "text-gray-600"
                  }`}
                >
                  {msg.characterName}{" "}
                  {msg.address && <Name address={msg.address} chain={base} />}
                </span>
                <span className="text-xs text-gray-500">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-gray-700 break-words">{msg.message}</p>
            </div>
          ))}

          {/* Loader message when in loading state */}
          {loading && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-orange-600">
                  System
                </span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-700 break-words">
                  {loadingText}
                </p>
                <Loader2 className="animate-spin" size={20} />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={disabled}
              placeholder="Just ask..."
              className="flex-1 px-4 py-2 rounded-lg bg-transparent 
                                    border border-navy-600/20 text-black placeholder-navy-400
                                    focus:outline-none focus:ring-2 focus:ring-navy-300"
            />
            <button
              type="submit"
              disabled={disabled || !message.trim()}
              className="p-2 rounded-lg bg-primary text-white
                                    hover:bg-primary/90 focus:outline-none 
                                    focus:ring-2 focus:ring-navy-300
                                    disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IoSend size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
