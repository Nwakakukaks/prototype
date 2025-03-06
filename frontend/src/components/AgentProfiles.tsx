/* eslint-disable @next/next/no-img-element */
// AgentProfiles.tsx
import React, { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import CreateCharacterButton from "./CreateCharacterButton";
import { pixelify_sans } from "@/app/fonts";
import Image from "next/image";

interface AgentProfile {
  id: string;
  name: string;
  role: string;
  image: string;
  description: string;
}

const agents: AgentProfile[] = [
  {
    id: "risha",
    name: "Risha",
    role: "Product Manager",
    image:
      "https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J31u5aHoiET2fntwWIyQsrmGjJ6oZROuD7HXek",
    description:
      "Turns dapp ideas into practical MVPs.",
  },
  {
    id: "jaden",
    name: "Jaden",
    role: "Market Analyst",
    image:
      "https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J32jiWqfPGQfn9Ea3WU6qAloxJhMLYrZS5sNpv",
    description:
      "Tracks trends and analyzes data to deliver strategic insights.",
  },
  {
    id: "pearl",
    name: "Pearl",
    role: "Interface Designer",
    image:
      "https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J3QF1u1vMB4oh9KpZbJwuajRl6c2XWTSfEVm85",
    description:
      "Crafts intuitive interfaces for a seamless user experience.",
  },
  {
    id: "qwen",
    name: "Qwen",
    role: "Software Engineer",
    image:
      "https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J35IhhsnKJiQOmPLbwU0Y7WR9qa2zjN6CVrdko",
    description:
      "Develops secure smart contracts and smooth frontend for on-chain interactions.",
  },
  {
    id: "monad",
    name: "Monad",
    role: "Growth Expert",
    image:
      "https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J3P5fcXz1GN2J3xEzatPAmWyqpgcFKwuUrY9jn",
    description:
      "Drives early adoption with innovative marketing and community engagement.",
  },
];

const AgentProfileCard: React.FC<{
  agent: AgentProfile;
  onClick: (agent: AgentProfile) => void;
}> = ({ agent, onClick }) => ( 
  <Card
    className="flex-none relative w-96 border border-gray-400 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-gray-950"
    onClick={() => onClick(agent)}
  >
    <CardContent className="p-4 flex items-center gap-4">
      <div className="relative w-24 h-24">
        {/* <div className="absolute inset-0 rounded-full bg-blue-100"></div> */}
        <img
          src={agent.image}
          alt={agent.name}
          className="absolute inset-0 w-full h-full rounded-full object-cover "
        />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-lg text-gray-100">{agent.name}</h3>
        <p className="text-blue-600 text-sm font-medium mb-1">{agent.role}</p>
        <p className="text-gray-400 text-sm line-clamp-2">
          {agent.description}
        </p>
      </div>
    </CardContent>
  </Card>
);

const AgentProfiles: React.FC = () => {
  const characterButtonRef = useRef<HTMLButtonElement>(null);
  const [selectedAgent, setSelectedAgent] = React.useState<AgentProfile | null>(
    null
  );

  const handleAgentClick = (agent: AgentProfile) => {
    setSelectedAgent(agent);
    // Trigger the character button click
    if (characterButtonRef.current) {
      characterButtonRef.current.click();
    }
  };

  return (
    <div
      className={`h-full flex flex-col items-center gap-4 overflow-y-auto scrollbar-hide ${pixelify_sans.className}`}
    >
      <div className="hidden">
        <CreateCharacterButton
          ref={characterButtonRef}
          selectedAgent={selectedAgent}
        />
      </div>
      {agents.map((agent) => (
        <AgentProfileCard
          key={agent.id}
          agent={agent}
          onClick={handleAgentClick}
        />
      ))}
    </div>
  );
};

export default AgentProfiles;
