"use client";

import { pixelify_sans } from "@/app/fonts";
import { useEffect, useRef, useState } from "react";
import { IoSend } from "react-icons/io5";
import { Loader2, RadioTowerIcon, Mic, MicOff } from "lucide-react";
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

// Define types for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal?: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechGrammar {
  src: string;
  weight: number;
}

interface SpeechGrammarList {
  readonly length: number;
  item(index: number): SpeechGrammar;
  [index: number]: SpeechGrammar;
  addFromURI(src: string, weight?: number): void;
  addFromString(string: string, weight?: number): void;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: Event) => void;
  onend: (event: Event) => void;
}

// Declare global types for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

const characterColors: { [key: string]: string } = {
  Jaden: "text-emerald-600",
  Harper: "text-purple-600",
  Qwen: "text-amber-600",
  Monad: "text-rose-600",
  Pearl: "text-orange-600",
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

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(
    null
  );

  // Audio references for sending and receiving messages
  const sendMessageAudioRef = useRef(new Audio("/message-sent.mp3"));
  const receiveMessageAudioRef = useRef(new Audio("/message-recieved.mp3"));
  const voiceStartAudioRef = useRef(new Audio("/message-sent.mp3"));
  const voiceEndAudioRef = useRef(new Audio("/message-sent.mp3"));

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionAPI =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognitionAPI) {
        const recognitionInstance = new SpeechRecognitionAPI();

        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = "en-US";

        recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = "";

          for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;

            if (result.isFinal) {
              finalTranscript += transcript;
            } else {
              setMessage((prev) => transcript);
            }
          }

          if (finalTranscript) {
            setMessage(finalTranscript);
          }
        };

        recognitionInstance.onend = () => {
          if (isRecording) {
            recognitionInstance.start();
          }
        };

        setRecognition(recognitionInstance);
      }
    }
  }, []);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      setLoading(true);
      onSendMessage(message.trim());

      sendMessageAudioRef.current
        .play()
        .catch((error) => console.log("Send tone error:", error));
      setMessage("");
    }
  };

  const toggleRecording = () => {
    if (!recognition) return;

    if (isRecording) {
      // Stop recording
      recognition.stop();
      voiceEndAudioRef.current
        .play()
        .catch((error) => console.log("Voice end tone error:", error));

      // Send the message if there's content
      if (message.trim()) {
        setLoading(true);
        onSendMessage(message.trim());
        sendMessageAudioRef.current
          .play()
          .catch((error) => console.log("Send tone error:", error));
        setMessage("");
      }
    } else {
      // Start recording
      recognition.start();
      voiceStartAudioRef.current
        .play()
        .catch((error) => console.log("Voice start tone error:", error));
    }

    setIsRecording(!isRecording);
  };

  // Auto-activate voice mode when chatMode is VOICE
  useEffect(() => {
    if (chatMode === "VOICE" && recognition && !isRecording && !disabled) {
      toggleRecording();
    }
  }, [chatMode, recognition, disabled]);

  const isVoice = chatMode === "VOICE";

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
            <h2 className="font-semibold tracking-tight text-2xl text-orange-600 flex items-center gap-2">
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
                <span className="font-semibold text-sm text-orange-600">
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
          {isRecording && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-green-600">
                  Voice
                </span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-400 break-words">
                  Listening...
                </p>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-150"></div>
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
              disabled={disabled}
              placeholder={isRecording ? "Listening..." : "Just ask..."}
              className="flex-1 px-4 py-2 rounded-lg bg-transparent border border-navy-600/20 text-gray-400 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-navy-300"
            />
            {chatMode === "VOICE" ? (
              <button
                type="button"
                onClick={toggleRecording}
                disabled={disabled || !recognition}
                className={`p-2 rounded-lg ${
                  isRecording
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                } text-white focus:outline-none focus:ring-2 focus:ring-navy-300 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            ) : (
              <button
                type="submit"
                disabled={disabled || !message.trim() || isVoice}
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
