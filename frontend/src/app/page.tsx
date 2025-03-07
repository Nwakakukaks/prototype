/* eslint-disable @next/next/no-img-element */
"use client";

export const dynamic = "force-dynamic";

import React from "react";
import { Star, Users, ExternalLink, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomConnectButton } from "@/components/ConnectButton";
import { NavBar } from "@/components/navbar";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Startup {
  name: string;
  description: string;
  logo: string;
  requester: string;
  users: string;
  stars: number;
  launchedAt: string;
}

interface StartupCardProps {
  startup: Startup;
}

const StartupCard: React.FC<StartupCardProps> = ({ startup }) => (
  <div className="bg-white rounded-lg shadow-lg p-6 transition-all hover:shadow-xl relative z-10">
    <div className="flex items-center justify-between mb-4">
      <img
        src={startup.logo}
        alt={`${startup.name} logo`}
        className="w-12 h-12 rounded-full object-contain"
      />
      <div className="flex gap-2">
        <a href="/pad19" className="text-gray-800 hover:text-orange-500">
          <ExternalLink size={20} />
        </a>
      </div>
    </div>

    <h3 className="text-xl font-bold text-gray-800 mb-2">{startup.name}</h3>
    <p className="text-gray-600 mb-4 line-clamp-2">{startup.description}</p>

    <div className="flex items-center gap-2 mb-3">
      <Wallet size={16} className="text-gray-500" />
      <span className="text-sm text-gray-600 truncate">
        {startup.requester}
      </span>
    </div>

    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
      <div className="flex items-center gap-1">
        <Users size={16} className="text-orange-500" />
        <span className="text-sm font-medium text-gray-600">
          {startup.users}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Star size={16} className="text-orange-500" />
        <span className="text-sm font-medium text-gray-600">
          {startup.stars}
        </span>
      </div>
      <span className="text-sm text-gray-600">{startup.launchedAt}</span>
    </div>
  </div>
);

const LiveIndicator = () => (
  <div className="inline-flex items-center">
    <div className="relative w-2.5 h-2.5 mr-2">
      <div className="absolute w-full h-full rounded-full bg-green-500"></div>
      <div className="absolute w-full h-full rounded-full bg-green-500 animate-ping"></div>
    </div>
    <span>Live</span>
  </div>
);

const StartupMarquee = ({ startups }: { startups: Startup[] }) => {
  const duplicatedStartups = [
    ...startups,
    ...startups,
    ...startups,
    ...startups,
  ];

  return (
    <div className="w-full overflow-hidden bg-white py-5 mb-12">
      <div className="relative flex whitespace-nowrap animate-scroll">
        <div className="flex gap-8 animate-scroll">
          {duplicatedStartups.map((startup, index) => (
            <div key={index} className="inline-flex items-center gap-3 px-4">
              <span className="text-orange-500">•</span>
              <span className="text-gray-900 font-medium whitespace-nowrap">
                {startup.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LandingPage: React.FC = () => {
  const router = useRouter();

  const handleClick = () => {
    router.push("/start");
  };

  const recentStartups: Startup[] = [
    {
      name: "DeFi Pulse",
      description: "Real-time DeFi protocol analytics and tracking platform",
      logo: "https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J3SS22SnRHgldbCZqO68FamQULKyreIx24zPNs",
      requester: "0x1234...5678",
      users: "12.5k",
      stars: 342,
      launchedAt: "2d ago",
    },
    {
      name: "NFT Marketplace",
      description:
        "Decentralized marketplace for trading unique digital assets",
      logo: "https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J34Nc761zOtmS4gyWw60ueoFxcn1br78fIZYvJ",
      requester: "0x8765...4321",
      users: "8.2k",
      stars: 289,
      launchedAt: "5d ago",
    },
    {
      name: "Chain Analytics",
      description: "Advanced blockchain data analytics and visualization tools",
      logo: "https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J3df3rLZ0DfhcbXeOIWLiz1ya3l7RjmTBqGNZP",
      requester: "0x9876...2345",
      users: "5.7k",
      stars: 156,
      launchedAt: "1w ago",
    },
    {
      name: "Token Swap",
      description: "Cross-chain token swapping with minimal fees",
      logo: "https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J34Nc761zOtmS4gyWw60ueoFxcn1br78fIZYvJ",
      requester: "0x3456...7890",
      users: "15.3k",
      stars: 423,
      launchedAt: "3d ago",
    },
    {
      name: "Smart Yield",
      description: "Automated yield farming strategy optimizer",
      logo: "https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J3TO6Cz42r3VuUbqmM51Boz9gZcavsDI6kTHpE",
      requester: "0x7890...1234",
      users: "6.8k",
      stars: 198,
      launchedAt: "6d ago",
    },
    {
      name: "DAO Factory",
      description:
        "No-code platform for launching DAOs on Electronuem Blockchain",
      logo: "https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J3JlEaf6HVozIYU8DFRWmkp7SC4bh16KiGHZfv",
      requester: "0x2345...6789",
      users: "9.1k",
      stars: 267,
      launchedAt: "4d ago",
    },
  ];

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J34Nc761zOtmS4gyWw60ueoFxcn1br78fIZYvJ"
          alt="Mascot 1"
          className="absolute top-1/3 right-5 w-36 mt-40"
        />
      </div>

      <NavBar />
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-extrabold text-gray-50 mb-3">
            AI Agent to Build v1 of Any Idea;
          </h1>
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-extrabold text-gray-50 mb-6">
            Commit Only When Validated
          </h1>
          <div className="flex flex-col items-center gap-2">
            <img
              alt="Arrows pointing to button"
              className="w-20"
              src="https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J3vJOwXMTAmeTSnXHbfhYk8MFj6RCAl0B3E2pO"
            />
            <Button
              size={"lg"}
              onClick={handleClick}
              className="rounded-full py-6 px-10 text-lg font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors relative pulse-button"
            >
              Get Started
            </Button>
          </div>
        </div>

        {/* New Marquee Component */}
        <StartupMarquee startups={recentStartups} />

        {/* Recent Startups Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-2xl font-bold text-gray-50">
              Recently Launched Dapps
            </h2>
            <LiveIndicator />
          </div>

          {/* Startups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentStartups.map((startup, index) => (
              <StartupCard key={index} startup={startup} />
            ))}
          </div>
        </div>

        {/* Footer  */}
        <div>
          <hr className="border-t border-gray-400" />
          <div className="flex justify-between items-center px-14 text-sm text-gray-200 pb-10 pt-6 font-medium">
            <p>&copy; 2025 protype Inc.</p>
            <p>
              Built with{" "}
              <span
                role="Image 
              "
                aria-label="love"
              >
                ❤️
              </span>{" "}
              by Prototype.ai team
            </p>
            <div className="flex space-x-3">
              <a
                href="https://example.com/brand-kit"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                <img
                  alt="product hunt banner"
                  src="https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J35QJSvrKJiQOmPLbwU0Y7WR9qa2zjN6CVrdko"
                  className="h-8"
                />
              </a>
              <a
                href="https://example.com/brand-kit"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline font-medium mt-[6px]"
              >
                Brand Kit
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
