/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useCharacterSelect } from "@/contexts/CharacterSelectContext";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Character } from "./Character";
import CharacterSelect from "./CharacterSelect";
import Chat from "./Chat";
import { God } from "./God";
import NotificationBoard from "./NotificationBoard";
import AgentProfiles from "./AgentProfiles";
import GameControlPanel from "./RecursiveChat";

// Interface for player state
interface PlayerState {
  x: number;
  y: number;
  direction: "up" | "down" | "left" | "right";
  isMoving: boolean;
  message: string | null;
  messageTimeoutId?: NodeJS.Timeout;
  ai?: {
    action: "moving" | "paused";
    actionEndTime: number;
  };
}

const Game = ({
  userId,
  walletAddress,
}: {
  userId: string;
  walletAddress: string;
}) => {
  // Refs
  const sessionId = useRef<string>(crypto.randomUUID()).current;
  // State variables
  const [isInitialized, setIsInitialized] = useState(false);
  const [playerStates, setPlayerStates] = useState<PlayerState[]>([]);
  const [chatMode, setChatMode] = useState<"STANDARD" | "RECURSIVE" | "VOICE">(
    "RECURSIVE"
  );
  const [notifications, setNotifications] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<
    {
      id: string;
      message: string;
      timestamp: Date;
      characterName: string;
      address?: `0x${string}`;
    }[]
  >([]);

  // Store Character instances in a ref to ensure they are only created once
  const charactersRef = useRef<Character[] | null>(null);

  // Add godRef to store the God instance
  const godRef = useRef<God | null>(null);

  const { isOpen } = useCharacterSelect();

  // Stable function references using useCallback
  const handleCharacterMessage = useCallback(
    (index: number, messageChunk: string) => {
      setPlayerStates((prevStates) => {
        const newStates = [...prevStates];
        const currentState = newStates[index];

        // If there's an existing timeout, clear it since we're still receiving chunks
        if (currentState?.messageTimeoutId) {
          clearTimeout(currentState.messageTimeoutId);
        }

        // Set the message in player state (for speech bubble)
        const timeoutId = setTimeout(() => {
          setPlayerStates((states) => {
            const clearedStates = [...states];
            if (clearedStates[index]) {
              clearedStates[index] = {
                ...clearedStates[index],
                message: null,
                messageTimeoutId: undefined,
              };
            }
            return clearedStates;
          });
        }, 8000);

        newStates[index] = {
          ...currentState,
          message: messageChunk,
          messageTimeoutId: timeoutId,
        };

        return newStates;
      });

      // Only add non-empty messages to chat history
      if (messageChunk.trim()) {
        const characterName =
          charactersRef.current?.[index]?.name || `Character ${index}`;
        setChatMessages((prev) =>
          [
            ...prev,
            {
              id: crypto.randomUUID(),
              message: messageChunk,
              timestamp: new Date(),
              characterName: characterName,
              address: charactersRef.current?.[index]?.address || undefined,
            },
          ].slice(-50)
        );
      }
    },
    []
  );

  const handleCharacterError = useCallback((index: number, error: string) => {
    setPlayerStates((prevStates) => {
      const newStates = [...prevStates];
      newStates[index] = {
        ...newStates[index],
        message: error,
      };
      return newStates;
    });

    // Clear the error message after 5 seconds
    setTimeout(() => {
      setPlayerStates((prevStates) => {
        const newStates = [...prevStates];
        if (newStates[index]) {
          newStates[index] = {
            ...newStates[index],
            message: null,
          };
        }
        return newStates;
      });
    }, 5000);
  }, []);

  const handleGodMessage = useCallback((message: string) => {
    let parsed;
    try {
      parsed = JSON.parse(message);
    } catch (error) {
      parsed = null;
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      Object.keys(parsed).length === 1 &&
      parsed.messageId
    ) {
      console.log("Ignored message with only messageId:", message);
      return;
    }

    // Otherwise, add the God message to notifications
    setNotifications((prev) =>
      [
        {
          id: crypto.randomUUID(),
          message: message,
          timestamp: new Date(),
          characterName: "You",
          chatMode: chatMode,
          metadata: null,
        },
        ...prev,
      ].slice(0, 50)
    );

    console.log(message);
  }, []);

  const handleGodError = useCallback((error: string) => {
    console.error("God error:", error);
  }, []);

  // Store functions in refs to have stable references
  const handleCharacterMessageRef = useRef(handleCharacterMessage);
  const handleCharacterErrorRef = useRef(handleCharacterError);
  const handleGodMessageRef = useRef(handleGodMessage);
  const handleGodErrorRef = useRef(handleGodError);

  // Update refs to point to the latest versions
  useEffect(() => {
    handleCharacterMessageRef.current = handleCharacterMessage;
    handleGodMessageRef.current = handleGodMessage;
    handleGodErrorRef.current = handleGodError;
    handleCharacterErrorRef.current = handleCharacterError;
  }, [
    handleCharacterMessage,
    handleGodMessage,
    handleGodError,
    handleCharacterError,
  ]);

  // Initialize characters and load the map
  useEffect(() => {
    let mounted = true;

    const initializeGame = async () => {
      if (!mounted) return;
      if (!charactersRef.current) {
        console.debug("Initializing characters...");
        charactersRef.current = [
          new Character(
            0,
            "Jaden",
            "/jaden.jpeg",
            () => {},
            (index, message) => {
              handleCharacterMessageRef.current(index, message);
            },
            (index, error) => {
              handleCharacterErrorRef.current(index, error);
            },
            sessionId,
            userId
          ),
          new Character(
            1,
            "Risha",
            "/risha.jpeg",
            () => {},
            (index, message) => {
              handleCharacterMessageRef.current(index, message);
            },
            (index, error) => {
              handleCharacterErrorRef.current(index, error);
            },
            sessionId,
            userId
          ),
          new Character(
            2,
            "Qwen",
            "/qwen.jpeg",
            () => {},
            (index, message) => {
              handleCharacterMessageRef.current(index, message);
            },
            (index, error) => {
              handleCharacterErrorRef.current(index, error);
            },
            sessionId,
            userId
          ),
          new Character(
            3,
            "Monad",
            "/monad.jpeg",
            () => {},
            (index, message) => {
              handleCharacterMessageRef.current(index, message);
            },
            (index, error) => {
              handleCharacterErrorRef.current(index, error);
            },
            sessionId,
            userId
          ),
          new Character(
            4,
            "Pearl",
            "/pearl.jpeg",
            () => {},
            (index, message) => {
              handleCharacterMessageRef.current(index, message);
            },
            (index, error) => {
              handleCharacterErrorRef.current(index, error);
            },
            sessionId,
            userId
          ),
        ];

        if (!mounted) return;
        godRef.current = new God(
          (message) => {
            console.log(`God received message: ${JSON.stringify(message)}`);
            handleGodMessageRef.current(message);
          },
          (error) => {
            console.error(`God error: ${JSON.stringify(error)}`);
            handleGodErrorRef.current(error);
          },
          sessionId,
          userId,
          walletAddress,
          chatMode
        );
      }

      setIsInitialized(true);
    };

    initializeGame().catch((error) => {
      console.error("Error during game initialization:", error);
    });

    return () => {
      mounted = false;
      if (charactersRef.current) {
        charactersRef.current.forEach((character) => character.destroy());
      }
      if (godRef.current) {
        godRef.current.closeWebSocket();
      }
    };
  }, []);
  // Empty dependency array ensures this runs only once

  useEffect(() => {
    if (godRef.current) {
      godRef.current.setChatMode(chatMode);
    }
  }, [chatMode]);

  // Function to send a message to all characters
  const handleGlobalMessage = (message: string) => {
    if (message.trim()) {
      setChatMessages((prev) =>
        [
          ...prev,
          {
            id: crypto.randomUUID(),
            message: message,
            timestamp: new Date(),
            chatMode: chatMode,
            characterName: "You",
          },
        ].slice(-50)
      );

      if (chatMode === "RECURSIVE") {
        setNotifications((prev) =>
          [
            {
              id: crypto.randomUUID(),
              message: message,
              timestamp: new Date(),
              characterName: "You",
              chatMode: chatMode,
              metadata: null,
            },
            ...prev,
          ].slice(0, 50)
        );
      }

      // Send message through God
      if (godRef.current) {
        godRef.current.sendMessage(message);
        return;
      } else {
        console.error("God instance not initialized");
      }
    }
  };

  return (
    <div className="relative flex flex-col md:flex-row gap-4 px-16 h-[calc(100vh-5rem)] max-h-[calc(100vh-5rem)]">
      {isOpen && <CharacterSelect />}

      {/* Left Column - AI agents */}
      <div className="flex flex-col gap-4 h-full">
        <AgentProfiles />
      </div>

      {/* Center Column - RecursiveChat and Chat */}
      <div className="hidden md:flex md:flex-col w-full h-full gap-2">
        <div className="h-auto">
          <GameControlPanel
            notifications={notifications}
            chatMode={chatMode}
            setChatMode={setChatMode}
            messages={chatMessages}
          />
        </div>
        <div className="flex-1 overflow-hidden rounded-lg">
          <Chat
            chatMode={chatMode}
            messages={chatMessages}
            onSendMessage={handleGlobalMessage}
            disabled={!isInitialized}
            notifications={notifications}
          />
        </div>
      </div>

      {/* Mobile Chat and Notifications */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 flex gap-2">
        <Chat
          chatMode={chatMode}
          messages={chatMessages}
          onSendMessage={handleGlobalMessage}
          disabled={!isInitialized}
          notifications={notifications}
        />
        <NotificationBoard notifications={notifications} />
      </div>
    </div>
  );
};

export default Game;
