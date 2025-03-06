/* eslint-disable @next/next/no-img-element */
"use client";

import { pixelify_sans } from "@/app/fonts";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useCharacterSelect } from "@/contexts/CharacterSelectContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import SkillSelect from "./SkillSelect";

type Category = {
  character: number;
  skills: string[];
  model: string;
  prompt: string;
};

// Define character presets
const CHARACTER_PRESETS = [
  {
    id: 0,
    name: "Qwen",
    role: "Software Engineer",
    skills: ["solidity", "nextjs", "rainbowkit"],
    prompt:
      "I am Qwen, a software engineer specializing in DeFi protocols, NFT marketplaces and frontend development.",
  },
  {
    id: 1,
    name: "Jaden",
    role: "Market Analyst",
    skills: ["twitter, defiant"],
    prompt:
      "I am Jaden, a technical analyst with expertise in market trends and product development strategies.",
  },
  {
    id: 2,
    name: "Monad",
    role: "Growth Expert",
    skills: ["twitter", "grok"],
    prompt:
      "I am Monad, an AI and social media specialist tracking Web3 trends.",
  },
  {
    id: 3,
    name: "Risha",
    role: "Product Manager",
    skills: ["notion", "vercel"],
    prompt:
      "I am Risha, a product manager breaking down ideas into practical MVPs with scalable features.",
  },
  {
    id: 4,
    name: "Pearl",
    role: "Interface Designer",
    skills: ["canva", "notion"],
    prompt:
      "I am Pearl, an interface designer creating intuitive and visually appealing user experiences.",
  },
];

function StyleSelector({
  title,
  current,
  onPrevious,
  onNext,
  isLoading = false,
}: {
  title: string;
  current: number;
  onPrevious: () => void;
  onNext: () => void;
  isLoading?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span
          className={`${pixelify_sans.className} text-gray-300 font-bold text-lg`}
        >
          {title}
        </span>
        <div className="flex items-center gap-4 text-gray-400">
          <button
            onClick={onPrevious}
            className="p-2 rounded-full text-gray-400"
            disabled={isLoading}
          >
            <ChevronLeft />
          </button>
          <span className="text-gray-400">
            {current + 1}/{CHARACTER_PRESETS.length}
          </span>
          <button
            onClick={onNext}
            className="p-2 rounded-full text-gray-400"
            disabled={isLoading}
          >
            <ChevronRight />
          </button>
        </div>
      </div>
      <div className="relative w-full h-[200px] bg-black rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="w-full h-full flex flex-col gap-2 items-center justify-center">
            <Skeleton className="w-24 h-24 rounded-full" />
            <Skeleton className="w-20 h-6 rounded-md mt-2" />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black">
            <img
              src={`/${CHARACTER_PRESETS[current].name.toLowerCase()}.jpeg`}
              alt={CHARACTER_PRESETS[current].name}
              className="object-cover rounded-full w-24 h-24"
            />
            <span
              className={`${pixelify_sans.className} mt-2 text-lg text-gray-300 font-bold text-center`}
            >
              {CHARACTER_PRESETS[current].name}
            </span>
            <span
              className={`${pixelify_sans.className} text-base text-blue-600 font-medium text-center`}
            >
              {CHARACTER_PRESETS[current].role}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function CharacterSelect() {
  const { isOpen, setIsOpen } = useCharacterSelect();
  const [selected, setSelected] = useState<Category>({
    character: 0,
    skills: CHARACTER_PRESETS[0].skills,
    model: "claude-3.5-sonnet",
    prompt: CHARACTER_PRESETS[0].prompt,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Simulate loading when character changes
  const handleCharacterChange = async (newCharacterIndex: number) => {
    setIsLoading(true);
    setSelected((prev) => ({
      ...prev,
      character: newCharacterIndex,
      prompt: CHARACTER_PRESETS[newCharacterIndex].prompt,
    }));

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    setSelected((prev) => ({
      ...prev,
      skills: CHARACTER_PRESETS[newCharacterIndex].skills,
    }));
    setIsLoading(false);
  };

  const handlePrevious = () => {
    const newIndex =
      selected.character === 0
        ? CHARACTER_PRESETS.length - 1
        : selected.character - 1;
    handleCharacterChange(newIndex);
  };

  const handleNext = () => {
    const newIndex =
      selected.character === CHARACTER_PRESETS.length - 1
        ? 0
        : selected.character + 1;
    handleCharacterChange(newIndex);
  };

  const handleSkillsChange = (skills: string[]) => {
    setSelected((prev) => ({ ...prev, skills }));
  };

  const handleModelChange = (model: string) => {
    setSelected((prev) => ({ ...prev, model }));
  };

  const handlePromptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelected((prev) => ({ ...prev, prompt: event.target.value }));
  };

  const handleCreate = () => {
    console.log("Creating character with:", selected);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="left"
        className={`${pixelify_sans.className}w-[400px] sm:w-[540px] overflow-y-auto bg-gray-950 [&>button]:text-gray-400 scrollbar-hide`}
      >
        <SheetHeader>
          <SheetTitle className={` text-gray-300`}>
            Create Your Character
          </SheetTitle>
          <p className="text-sm text-gray-400">
            Select your character and customize their attributes.
          </p>
        </SheetHeader>

        <div className="space-y-8 py-6">
          <StyleSelector
            title="Character Selection"
            current={selected.character}
            onPrevious={handlePrevious}
            onNext={handleNext}
            isLoading={isLoading}
          />

          {/* Model Selection */}
          <div>
            <span
              className={`${pixelify_sans.className} text-gray-300 font-bold text-lg block mb-2`}
            >
              Model
            </span>
            <Select value={selected.model} onValueChange={handleModelChange}>
              <SelectTrigger className="text-gray-400">
                <SelectValue
                  placeholder="Select a model"
                  className="text-gray-400"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="claude-3.5-sonnet" className="text-gray-400">
                  Claude 3.5 Sonnet
                </SelectItem>
                <SelectItem value="gpt-4" className="text-gray-400">
                  GPT-4
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Character Prompt */}
          <div>
            <span
              className={`${pixelify_sans.className} text-gray-300 font-bold text-lg block mb-2`}
            >
              Character Prompt
            </span>
            <Input
              value={selected.prompt}
              onChange={handlePromptChange}
              placeholder="Enter character prompt"
              className="w-full text-gray-400 placeholder:text-gray-500"
            />
          </div>

          {/* Skills Selection */}
          <div>
            <span
              className={`${pixelify_sans.className} text-gray-300 font-bold text-lg block mb-2`}
            >
              Skills
            </span>
            <p className="text-sm text-gray-400 mb-4">
              These are {CHARACTER_PRESETS[selected.character].name}&apos;s
              specialized skills
            </p>
            {isLoading ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-24" />
                </div>
                <Skeleton className="h-[100px] w-full" />
              </div>
            ) : (
              <SkillSelect
                onSkillsChange={handleSkillsChange}
                initialSkills={selected.skills}
              />
            )}
          </div>
        </div>

        <SheetFooter>
          <button
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            onClick={handleCreate}
            disabled={isLoading}
          >
            Select Character
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default CharacterSelect;
