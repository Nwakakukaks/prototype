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
      "Risha takes the user’s idea and transforms it into a practical MVP by breaking it down into essential features that are both scalable and aligned with user expectations.",
  },
  {
    id: "jaden",
    name: "Jaden",
    role: "Market Analyst",
    image:
      "https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J32jiWqfPGQfn9Ea3WU6qAloxJhMLYrZS5sNpv",
    description:
      "Jaden monitors ecosystem trends and analyzes market data to provide strategic insights, ensuring product development stays ahead of market demands.",
  },
  {
    id: "pearl",
    name: "Pearl",
    role: "Interface Designer",
    image:
      "https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J3QF1u1vMB4oh9KpZbJwuajRl6c2XWTSfEVm85",
    description:
      "Pearl designs intuitive and visually appealing user interfaces, ensuring that the product is accessible, engaging, and delivers a seamless user experience.",
  },
  {
    id: "qwen",
    name: "Qwen",
    role: "Software Engineer",
    image:
      "https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J35IhhsnKJiQOmPLbwU0Y7WR9qa2zjN6CVrdko",
    description:
      "Qwen brings the MVP to life by integrating it with the Sonic blockchain, developing secure smart contracts, and building the frontend for a seamless on-chain experience.",
  },
  {
    id: "monad",
    name: "Monad",
    role: "Growth Expert",
    image:
      "https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J3P5fcXz1GN2J3xEzatPAmWyqpgcFKwuUrY9jn",
    description:
      "Monad crafts innovative marketing strategies and community engagement campaigns, driving early product adoption and generating buzz across social channels.",
  },
];

const AgentProfileCard: React.FC<{
  agent: AgentProfile;
  onClick: (agent: AgentProfile) => void;
}> = ({ agent, onClick }) => (
  <Card
    className="flex-none relative w-96 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-card/80"
    onClick={() => onClick(agent)}
  >
    <CardContent className="p-4 flex items-center gap-4">
      <div className="relative w-24 h-24">
        {/* <div className="absolute inset-0 rounded-full bg-orange-100"></div> */}
        <img
          src={agent.image}
          alt={agent.name}
    
          className="absolute inset-0 w-full h-full rounded-full object-cover "
        />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-lg text-gray-800">{agent.name}</h3>
        <p className="text-orange-600 text-sm font-medium mb-1">{agent.role}</p>
        <p className="text-gray-600 text-sm line-clamp-2">
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
