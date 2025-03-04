"use client";

import React, { useState, useEffect } from "react";
import {
  Volume2,
  VolumeX,
  Music,
  Radio,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { pixelify_sans } from "@/app/fonts";
import { formatEther } from "viem";
import { useSendTransaction } from "wagmi";
import { cn } from "@/lib/utils";

interface GameControlPanelProps {
  chatMode: "STANDARD" | "RECURSIVE" | "VOICE";
  setChatMode: (mode: "STANDARD" | "RECURSIVE" | "VOICE") => void;
  notifications: any[];
}

const GameControlPanel = ({
  chatMode,
  setChatMode,
  notifications,
}: GameControlPanelProps) => {
  const [bgmVolume, setBgmVolume] = useState(50);
  const [sfxVolume, setSfxVolume] = useState(70);
  const [isBgmMuted, setIsBgmMuted] = useState(false);
  const [isSfxMuted, setIsSfxMuted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { sendTransaction } = useSendTransaction();

  useEffect(() => {
    const recentFundRequests = notifications
      ?.map((notification) => {
        const data = JSON.parse(notification.message);
        return {
          eventName: data.eventName,
          timestamp: new Date(data.createdAt),
          metadata: data.metadata,
        };
      })
      .filter(
        (event) =>
          event.eventName === "funds_requested" &&
          new Date().getTime() - event.timestamp.getTime() < 15000
      );

    if (recentFundRequests && recentFundRequests.length > 0) {
      const request = recentFundRequests[0];
      sendTransaction({
        to: request.metadata.toAddress,
        value: request.metadata.requestedAmount,
      });
    }
  }, [notifications, sendTransaction]);

  const formatMessage = (data: any): string => {
    switch (data.eventName) {
      case "wallet_created":
        return `${data.characterId}'s wallet was created`;
      case "funds_requested":
        return `${data.characterId} requested ${formatEther(
          data.metadata.requestedAmount
        )} S`;
      default:
        return `System event: ${data.eventName}`;
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`${pixelify_sans.className} flex gap-4 w-full`}>
      <div className="flex-1">
        <Card className="bg-gray-950 border border-gray-400 mb-4 transition-all duration-300">
          <CardHeader
            className="flex flex-row items-center justify-between pb-2 cursor-pointer"
            onClick={toggleCollapse}
          >
            <div className="space-y-1 ">
              <CardTitle className="text-gray-200">App Controls</CardTitle>
              <CardDescription className="text-gray-400">
                Manage chat mode and audio settings
              </CardDescription>
            </div>
            <button className="">
              {isCollapsed ? (
                <ChevronDown size={20} />
              ) : (
                <ChevronUp size={20} />
              )}
            </button>
          </CardHeader>

          <div
            className={cn(
              "overflow-hidden transition-all duration-300",
              isCollapsed ? "max-h-0 opacity-0" : "max-h-96 opacity-100"
            )}
          >
            <CardContent className="space-y-6 pt-2">
              {/* Chat Mode Controls */}
              <div className="space-y-2 text-gray-300">
                <p className="font-semibold text-sm text-gray-300">Chat Mode</p>
                <Select value={chatMode} onValueChange={setChatMode}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select chat mode" />
                  </SelectTrigger>
                  <SelectContent className="flex items-center justify-start">
                    <SelectItem value="STANDARD">
                      Standard Mode
                      <span className="block text-xs text-muted-foreground">
                        Direct communication between you and the agents
                      </span>
                    </SelectItem>
                    <SelectItem value="RECURSIVE">
                      Operator Mode
                      <span className="block text-xs text-muted-foreground">
                        Agents discuss with each other without a human in the
                        loop
                      </span>
                    </SelectItem>
                    <SelectItem value="VOICE">
                      <div className="relative">
                        {/* Experimental Badge */}
                        <span className="absolute bottom-4 right-28 mr-2 bg-blue-600 text-white text-[10px] font-semibold px-2 rounded-full">
                          beta
                        </span>
                        <div className="flex flex-col">
                          <span>Voice Mode</span>
                          <span className="block text-xs text-muted-foreground">
                            Control and interact with agents with voice
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Audio Controls */}
              <div className="space-y-4 text-gray-300">
                <p className="font-semibold text-sm">Audio Settings</p>

                {/* Background Music Controls */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsBgmMuted(!isBgmMuted);
                    }}
                    className="p-2 hover:bg-accent rounded-full"
                  >
                    {isBgmMuted ? <VolumeX size={20} /> : <Music size={20} />}
                  </button>
                  <div className="flex-1">
                    <p className="text-sm mb-1">Background Music</p>
                    <div className="w-full">
                      {/* Using a div to style the slider */}
                      <div className="w-full">
                        <Slider
                          value={[bgmVolume]}
                          onValueChange={([value]) => setBgmVolume(value)}
                          max={100}
                          step={1}
                          disabled={isBgmMuted}
                          className="data-[disabled]:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Voice SFX Controls */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSfxMuted(!isSfxMuted);
                    }}
                    className="p-2 hover:bg-accent rounded-full"
                  >
                    {isSfxMuted ? <VolumeX size={20} /> : <Radio size={20} />}
                  </button>
                  <div className="flex-1">
                    <p className="text-sm mb-1">Agent Voices</p>
                    <div className="w-full">
                      <Slider
                        value={[sfxVolume]}
                        onValueChange={([value]) => setSfxVolume(value)}
                        max={100}
                        step={1}
                        disabled={isSfxMuted}
                        className="data-[disabled]:opacity-50"
                      />
                      <style jsx global>{`
                        /* Target the track and fill it with orange */
                        .slider-track[data-orientation="horizontal"] {
                          background-color: #f97316 !important; /* Tailwind orange-500 */
                        }

                        /* Target the thumb and make it orange */
                        .slider-thumb {
                          background-color: white !important;
                          border: 2px solid #f97316 !important; /* Tailwind orange-500 */
                        }
                      `}</style>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GameControlPanel;
