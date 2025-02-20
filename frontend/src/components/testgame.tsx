"use client";

import { useCharacterSelect } from "@/contexts/CharacterSelectContext";
import {
  AI_MOVE_DURATION_MAX,
  AI_MOVE_DURATION_MIN,
  AI_MOVE_SPEED,
  AI_PAUSE_DURATION_MAX,
  AI_PAUSE_DURATION_MIN,
  ANIMATION_FRAMES,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEBUG_CHARACTER_SELECT_BOXES,
  DEBUG_WALKABLE_AREAS,
  DIRECTIONS,
  FRAME_DURATION,
  MAP_OFFSET_X,
  MAP_OFFSET_Y,
  PLAYER_MOVE_SPEED,
  SCALE_FACTOR,
  SPRITE_SIZE,
  WALKABLE_AREAS,
} from "@/utils/properties";
import React, { useCallback, useEffect, useRef, useState } from "react";
import AgentDetails from "./AgentDetails";
import { Character } from "./Character";
import CharacterSelect from "./CharacterSelect";
import Chat from "./Chat";
import { God } from "./God";
import NotificationBoard from "./NotificationBoard";
import RecursiveChat from "./RecursiveChat";

// Function to get a random integer between min and max
function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

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

// Helper function to check if two bounds overlap
function isOverlapping(
  bounds1: { x: number; y: number; width: number; height: number },
  bounds2: { x: number; y: number; width: number; height: number }
): boolean {
  const center1 = {
    x: bounds1.x + bounds1.width / 2,
    y: bounds1.y + bounds1.height / 2,
  };

  const center2 = {
    x: bounds2.x + bounds2.width / 2,
    y: bounds2.y + bounds2.height / 2,
  };

  // Calculate distance between centers
  const dx = Math.abs(center1.x - center2.x);
  const dy = Math.abs(center1.y - center2.y);

  // Calculate minimum distance required between centers
  const minDistanceX = (bounds1.width + bounds2.width) / 2;
  const minDistanceY = (bounds1.height + bounds2.height) / 2;

  return dx < minDistanceX && dy < minDistanceY;
}

// Function to check if a character would collide with others at the given position
function checkCharacterCollision(
  playerStates: PlayerState[],
  characterIndex: number,
  newX: number,
  newY: number
): boolean {
  // Increase collision box to 95% of character size (up from 90%)
  const width = SPRITE_SIZE * SCALE_FACTOR * 0.95;
  const height = SPRITE_SIZE * SCALE_FACTOR * 0.95;

  const newBounds = {
    x: newX * SCALE_FACTOR + MAP_OFFSET_X,
    y: newY * SCALE_FACTOR + MAP_OFFSET_Y,
    width,
    height,
  };

  return playerStates.some((state, index) => {
    if (index === characterIndex) return false;
    if (!state) return false;

    const otherBounds = {
      x: state.x * SCALE_FACTOR + MAP_OFFSET_X,
      y: state.y * SCALE_FACTOR + MAP_OFFSET_Y,
      width,
      height,
    };

    // Increase buffer zone from 5 to 8 pixels
    const buffer = 8;
    const expandedBounds = {
      x: otherBounds.x - buffer,
      y: otherBounds.y - buffer,
      width: otherBounds.width + buffer * 2,
      height: otherBounds.height + buffer * 2,
    };

    return isOverlapping(newBounds, expandedBounds);
  });
}

// Update the isWithinCanvasBounds function
function isWithinCanvasBounds(x: number, y: number): boolean {
  const scaledX = x * SCALE_FACTOR + MAP_OFFSET_X;
  const scaledY = y * SCALE_FACTOR + MAP_OFFSET_Y;
  const characterSize = SPRITE_SIZE * SCALE_FACTOR;
  const buffer = 50; // 50px buffer from edges

  return (
    scaledX >= buffer &&
    scaledX + characterSize <= CANVAS_WIDTH - buffer &&
    scaledY >= buffer &&
    scaledY + characterSize <= CANVAS_HEIGHT - buffer
  );
}

const Game = ({
  userId,
  walletAddress,
}: {
  userId: string;
  walletAddress: string;
}) => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapRef = useRef<HTMLImageElement | null>(null);
  const lastRenderTimeRef = useRef<number>(0);
  const sessionId = useRef<string>(crypto.randomUUID()).current;
  // State variables
  const [isInitialized, setIsInitialized] = useState(false);
  const [playerStates, setPlayerStates] = useState<PlayerState[]>([]);
  const [controlledCharacterIndex, setControlledCharacterIndex] = useState<
    number | null
  >(null);
  const [isInputActive, setIsInputActive] = useState<boolean>(false);
  const [animationFrame, setAnimationFrame] = useState<number>(0);
  const [isHoveredIndex, setIsHoveredIndex] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [chatMode, setChatMode] = useState<"STANDARD" | "RECURSIVE">(
    "STANDARD"
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
    // Only add God messages to notifications
    setNotifications((prev) =>
      [
        {
          id: crypto.randomUUID(),
          message: message,
          timestamp: new Date(),
          metadata: null,
        },
        ...prev,
      ].slice(0, 50)
    );
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

  useEffect(() => {
    if (godRef.current) {
      godRef.current.setChatMode(chatMode);
    }
  }, [chatMode]);

  // Input key down handler for chat
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();

      if (inputValue.trim()) {
        // Add user message to notifications
        setNotifications((prev) =>
          [
            {
              id: crypto.randomUUID(),
              message: inputValue,
              timestamp: new Date(),
              characterName: "You",
              chatMode: chatMode,
              metadata: null,
            },
            ...prev,
          ].slice(0, 50)
        );

        // Send message through God
        if (godRef.current) {
          godRef.current.sendMessage(inputValue);
        } else {
          console.error("God instance not initialized");
        }
      }

      // Reset input field
      setInputValue("");
      setIsInputActive(false);
    }
  };

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

      // Send message through God
      if (godRef.current) {
        godRef.current.sendMessage(message);
      } else {
        console.error("God instance not initialized");
      }
    }
  };

  // Return statement with conditional rendering
  return (
    <div className="relative flex flex-col md:flex-row gap-4 px-24 h-[calc(100vh-5rem)] max-h-[calc(100vh-7rem)]">
      {/* Render CharacterSelect when isOpen is true */}
      {isOpen && <CharacterSelect />}

      {/* Left Column - RecursiveChat and Chat */}
      <div className="hidden md:flex md:flex-col w-1/3 h-full gap-4">
        {/* <div className="h-auto">
                    <RecursiveChat chatMode={chatMode} setChatMode={setChatMode} />
                </div> */}
        <div className="flex-1 overflow-hidden rounded-lg">
          <Chat
            messages={chatMessages}
            onSendMessage={handleGlobalMessage}
            disabled={!isInitialized}
          />
        </div>
      </div>

      {/* Mobile Chat and Notifications */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 flex gap-2">
        <Chat
          messages={chatMessages}
          onSendMessage={handleGlobalMessage}
          disabled={!isInitialized}
        />
        <NotificationBoard notifications={notifications} />
      </div>
    </div>
  );
};

export default Game;
