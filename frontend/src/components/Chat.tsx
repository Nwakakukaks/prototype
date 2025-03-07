/* eslint-disable react-hooks/exhaustive-deps */

"use client";

import { pixelify_sans } from "@/app/fonts";
import { useEffect, useRef, useState } from "react";
import { IoSend } from "react-icons/io5";
import { Loader2, Mic, MicOff } from "lucide-react";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { CustomConnectButton } from "./ConnectButton";
import LiveView from "./LiveView";

interface ChatMessage {
  id: string;
  message: string;
  timestamp: Date;
  address?: string;
  characterName: string;
}

interface ChatProps {
  messages: ChatMessage[];
  chatMode: "STANDARD" | "RECURSIVE" | "VOICE";
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  notifications: any[];
}

const characterColors: { [key: string]: string } = {
  Jaden: "text-emerald-600",
  Harper: "text-purple-600",
  Qwen: "text-amber-600",
  Monad: "text-rose-600",
  Pearl: "text-blue-600",
  Risha: "text-yellow-600",
  You: "text-blue-600",
};

const Chat = ({
  messages,
  onSendMessage,
  disabled = false,
  chatMode,
  notifications,
}: ChatProps) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Reasoning...");
  const [animateRadio, setAnimateRadio] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const isVoiceMode = chatMode === "VOICE";

  // Audio references for sending and receiving messages
  const sendMessageAudioRef = useRef(new Audio("/message-sent.mp3"));
  const receiveMessageAudioRef = useRef(new Audio("/message-recieved.mp3"));
  const voiceStartAudioRef = useRef(new Audio("/message-sent.mp3"));
  const voiceEndAudioRef = useRef(new Audio("/message-sent.mp3"));

  // Speech recognition setup using react-speech-recognition
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition();

  // Update message when transcript changes
  useEffect(() => {
    if (transcript) {
      setMessage(transcript);
    }
  }, [transcript]);

  // Start/stop listening based on chat mode and disabled status
  useEffect(() => {
    if (isVoiceMode && !disabled) {
      if (!listening && browserSupportsSpeechRecognition) {
        try {
          startListening();
        } catch (error) {
          console.error("Error starting recognition:", error);
          setRecognitionError("Failed to start recognition");
        }
      }
    } else if (listening) {
      try {
        stopListening(false);
      } catch (error) {
        console.error("Error stopping recognition:", error);
      }
    }
  }, [isVoiceMode, disabled, browserSupportsSpeechRecognition]);

  // Play receive tone when messages change (if the last message isn't from "You")
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
    setAnimateRadio(true);
    const timer = setTimeout(() => setAnimateRadio(false), 3000);

    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.characterName !== "You") {
        receiveMessageAudioRef.current
          .play()
          .catch((error) => console.log("Receive tone error:", error));
      }
    }

    return () => clearTimeout(timer);
  }, [messages]);

  // Reset loading state after a timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, [messages]);

  // Clean up speech recognition on component unmount
  useEffect(() => {
    return () => {
      if (listening) {
        SpeechRecognition.stopListening();
      }
    };
  }, [listening]);

  const startListening = () => {
    try {
      voiceStartAudioRef.current
        .play()
        .catch((error) => console.log("Voice start tone error:", error));
      
      SpeechRecognition.startListening({ 
        continuous: true,
        language: 'en-US'
      });
      
      setRecognitionError(null);
      console.log("Started recording");
    } catch (error) {
      console.error("Error in startListening:", error);
      setRecognitionError("Failed to start microphone");
    }
  };

  const stopListening = (sendCurrentMessage = false) => {
    try {
      SpeechRecognition.stopListening();
      
      voiceEndAudioRef.current
        .play()
        .catch((error) => console.log("Voice end tone error:", error));

      // If requested, send the current message
      if (sendCurrentMessage && message.trim()) {
        setLoading(true);
        onSendMessage(message.trim());
        sendMessageAudioRef.current
          .play()
          .catch((error) => console.log("Send tone error:", error));
        setMessage("");
        resetTranscript();
      }
      
      console.log("Stopped recording");
    } catch (error) {
      console.error("Error stopping recognition:", error);
    }
  };

  const toggleListening = () => {
    if (listening) {
      stopListening(true);
    } else {
      startListening();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      setLoading(true);
      onSendMessage(message.trim());

      sendMessageAudioRef.current
        .play()
        .catch((error) => console.log("Send tone error:", error));
      setMessage("");
      resetTranscript();
    }
  };

  // Render unsupported browser message if speech recognition isn't available
  if (isVoiceMode && !browserSupportsSpeechRecognition) {
    return (
      <div className="p-4 text-red-500 bg-red-100 rounded-lg">
        Your browser doesn&apos;t support speech recognition. Please try a different browser like Chrome.
      </div>
    );
  }

  // Render microphone permission error if microphone isn't available
  if (isVoiceMode && !isMicrophoneAvailable) {
    return (
      <div className="p-4 text-yellow-700 bg-yellow-100 rounded-lg">
        Microphone access is required for voice mode. Please check your browser permissions.
      </div>
    );
  }

  return (
    <div
      className={`${
        pixelify_sans.className
      } transition-all duration-300 flex-1 md:flex-none md:w-full h-full max-h-screen md:relative ${
        isExpanded
          ? "fixed inset-0 z-50 bg-gray-950"
          : "relative bg-gray-950 backdrop-blur-sm rounded-lg h-14 md:h-full"
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200 cursor-pointer flex items-center gap-3 md:cursor-default h-14 shrink-0">
          <div className="flex-1 flex items-center justify-between">
            <h2 className="font-semibold tracking-tight text-2xl text-blue-600 flex items-center gap-2">
              Chat History
            </h2>
            <CustomConnectButton />
          </div>
        </div>
        <div
          ref={chatContainerRef}
          className={`overflow-y-auto scrollbar-hide p-4 space-y-4 flex-1 transition-all duration-300 ${
            isExpanded ? "h-[calc(100vh-8rem)]" : "h-0 md:h-[calc(100%-8rem)]"
          } ${!isExpanded && "md:opacity-100 opacity-0"}`}
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
                </span>
                <span className="text-xs text-gray-500">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-gray-300 break-words">{msg.message}</p>
            </div>
          ))}

          {/* Loader message when in loading state */}
          {loading && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-blue-600">
                  System
                </span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-400 break-words">
                  {loadingText}
                </p>
                <Loader2 className="animate-spin text-gray-200" size={20} />
              </div>
            </div>
          )}

          {/* Voice recording indicator */}
          {listening && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-green-600">
                  Voice
                </span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-400 break-words">
                  {recognitionError
                    ? `Error: ${recognitionError}. Please try again.`
                    : `Listening...${message ? `: "${message}"` : ""}`}
                </p>
                <div className="flex space-x-1">
                  {recognitionError ? (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-75"></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-150"></div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
          <div className="flex gap-2 items-center ">
            <LiveView
              animateRadio={animateRadio}
              notifications={notifications}
            />
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={disabled || (isVoiceMode && listening)}
              placeholder={listening ? "Listening..." : "Just ask..."}
              className="flex-1 px-4 py-2 rounded-lg bg-transparent border border-navy-600/20 text-gray-400 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-300"
            />
            {chatMode === "VOICE" ? (
              <button
                type="button"
                onClick={toggleListening}
                disabled={disabled || !browserSupportsSpeechRecognition}
                className={`p-2 rounded-lg ${
                  listening
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                } text-white focus:outline-none focus:ring-2 focus:ring-navy-300 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {listening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            ) : (
              <button
                type="submit"
                disabled={disabled || !message.trim()}
                className="p-2 rounded-lg bg-primary text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-navy-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IoSend size={20} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;