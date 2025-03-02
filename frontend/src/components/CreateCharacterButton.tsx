"use client";
import { pixelify_sans } from "@/app/fonts";
import { Button } from "@/components/ui/button";
import { useCharacterSelect } from "@/contexts/CharacterSelectContext";
import React, { forwardRef } from "react";

interface AgentProfile {
    id: string;
    name: string;
    role: string;
    image: string;
    description: string;
  }

  
interface CreateCharacterButtonProps {
  selectedAgent: AgentProfile | null;
}

const CreateCharacterButton = forwardRef<HTMLButtonElement, CreateCharacterButtonProps>(
  ({ selectedAgent }, ref) => {
    const { setIsOpen } = useCharacterSelect();

    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(true);
    };

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        variant="default"
        className={`${pixelify_sans.className} relative z-50 transition-colors hover:bg-primary/90`}
      >
        Create Character
      </Button>
    );
  }
);

CreateCharacterButton.displayName = "CreateCharacterButton";

export default CreateCharacterButton;
