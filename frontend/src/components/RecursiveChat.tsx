"use client";

import React, { useState, useEffect, useRef } from "react";
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

interface VoiceSettings {
  [key: string]: SpeechSynthesisVoice | null;
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
  
  // Audio and Voice states
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [gainNode, setGainNode] = useState<GainNode | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [agentVoices, setAgentVoices] = useState<VoiceSettings>({});
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  // Initialize audio context
  useEffect(() => {
    const ctx = new (window.AudioContext)();
    const gn = ctx.createGain();
    setAudioContext(ctx);
    setGainNode(gn);
    
    return () => {
      ctx.close();
    };
  }, []);

  // Load background music
  useEffect(() => {
    if (audioContext && gainNode) {
      const audioElement = new Audio('/bgm.mp3');
      audioElement.loop = true;
      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(gainNode).connect(audioContext.destination);
      audioElementRef.current = audioElement;
      audioElement.play().catch(error => console.log('Audio play failed:', error));
    }
  }, [audioContext, gainNode]);

  // Handle volume changes
  useEffect(() => {
    if (gainNode) {
      gainNode.gain.value = isBgmMuted ? 0 : bgmVolume / 100;
    }
  }, [bgmVolume, isBgmMuted, gainNode]);

  // Initialize speech synthesis
  useEffect(() => {
    synthesisRef.current = window.speechSynthesis;
    
    const loadVoices = () => {
      const availableVoices = synthesisRef.current?.getVoices() || [];
      setVoices(availableVoices);
      
      // Assign voices to agents (4 male, 1 female)
      const maleVoices = availableVoices.filter(v => v.name.includes('Male'));
      const femaleVoices = availableVoices.filter(v => v.name.includes('Female'));
      
      setAgentVoices({
        agent1: maleVoices[0] || null,
        agent2: maleVoices[1] || null,
        agent3: maleVoices[2] || null,
        agent4: maleVoices[3] || null,
        agent5: femaleVoices[0] || null,
      });
    };

    setTimeout(loadVoices, 500);
    synthesisRef.current.onvoiceschanged = loadVoices;
  }, []);

  // Handle fund requests
  useEffect(() => {
    const recentFundRequests = notifications
      ?.map((notification) => {
        let data;
        try {
          data = JSON.parse(notification.message);
        } catch (error) {
          data = {
            eventName: "custom",
            createdAt: notification.timestamp,
            metadata: {},
            characterId: notification.characterName,
            message: notification.message,
          };
        }
        return {
          ...data,
          timestamp: new Date(data.createdAt),
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

  // Speak new notifications
  useEffect(() => {
    if (chatMode !== "VOICE") return;

    notifications.forEach(notification => {
      const data = JSON.parse(notification.message);
      const agentId = `agent${data.characterId}`; // Adjust based on your agent IDs
      const message = formatMessage(data);
      speakMessage(agentId, message);
    });
  }, [notifications, chatMode]);

  const formatMessage = (data: any): string => {
    switch (data.eventName) {
      case "wallet_created":
        return `${data.characterId}'s wallet was created`;
      case "funds_requested":
        return `${data.characterId} requested ${formatEther(
          data.metadata.requestedAmount
        )} S`;
      case "custom":
        return data.message;
      default:
        return `System event: ${data.eventName}`;
    }
  };

  const speakMessage = (agentId: string, text: string) => {
    if (isSfxMuted || !synthesisRef.current) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = agentVoices[agentId];
    
    if (voice) {
      utterance.voice = voice;
      utterance.volume = sfxVolume / 100;
      synthesisRef.current.speak(utterance);
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
            <button>
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
                        .slider-track[data-orientation="horizontal"] {
                          background-color: #f97316 !important;
                        }
                        .slider-thumb {
                          background-color: white !important;
                          border: 2px solid #f97316 !important;
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