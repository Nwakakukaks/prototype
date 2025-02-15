"use client";

export const dynamic = "force-dynamic";

import React, { useState } from "react";
import {
  Star,
  Users,
  ExternalLink,
  Wallet,
  Calendar,
  TrendingUp,
  Timer,
  Radio,
} from "lucide-react";
import { CustomConnectButton } from "@/components/ConnectButton";

type Status = "In Queue" | "Live";

interface StatusBadgeProps {
  status: Status;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles: Record<Status, string> = {
    "In Queue": "bg-yellow-100 text-yellow-800 border-yellow-200",
    Live: "bg-green-100 text-green-800 border-green-200",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium border ${styles[status]}`}
    >
      {status === "In Queue" && <Timer size={14} className="inline mr-1" />}
      {status === "Live" && <TrendingUp size={14} className="inline mr-1" />}
      {status}
    </span>
  );
};

interface Metrics {
  dau: string;
  revenue: string;
}

interface Startup {
  name: string;
  description: string;
  logo: string;
  requester: string;
  users: string;
  stars: number;
  launchedAt: string;
  status: Status;
  metrics: Metrics;
}

interface StartupCardProps {
  startup: Startup;
}

const StartupCard: React.FC<StartupCardProps> = ({ startup }) => (
  <div className="bg-white rounded-lg shadow-lg p-6 transition-all hover:shadow-xl">
    <div className="flex items-center justify-between mb-4">
      <img
        src={startup.logo}
        alt={`${startup.name} logo`}
        className="w-12 h-12 rounded-full object-contain"
      />
      <StatusBadge status={startup.status} />
    </div>

    <h3 className="text-xl font-bold text-gray-800 mb-2">{startup.name}</h3>
    <p className="text-gray-600 mb-4 line-clamp-2">{startup.description}</p>

    <div className="flex items-center gap-2 mb-3">
      <Wallet size={16} className="text-gray-600" />
      <span className="text-sm text-gray-500 truncate">
        {startup.requester}
      </span>
    </div>

    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-sm text-gray-500">Daily Active Users</div>
        <div className="text-lg font-bold text-gray-800">
          {startup.metrics.dau}
        </div>
      </div>
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-sm text-gray-500">Revenue (24h)</div>
        <div className="text-lg font-bold text-gray-800">
          ${startup.metrics.revenue}
        </div>
      </div>
    </div>

    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
      <div className="flex items-center gap-1">
        <Users size={16} className="text-orange-500" />
        <span className="text-sm font-medium text-gray-600">{startup.users}</span>
      </div>
      <div className="flex items-center gap-1">
        <Star size={16} className="text-orange-500" />
        <span className="text-sm font-medium text-gray-600">{startup.stars}</span>
      </div>
      <div className="flex items-center gap-1">
        <Calendar size={16} className="text-gray-500" />
        <span className="text-sm text-gray-600">{startup.launchedAt}</span>
      </div>
    </div>
  </div>
);

type SortBy = "users" | "stars" | "date";
type FilterStatus = "all" | Status;

const LaunchpadPage: React.FC = () => {
  const [sortBy, setSortBy] = useState<SortBy>("users");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const startups: Startup[] = [
    {
      name: "DeFi Pulse",
      description: "Real-time DeFi protocol analytics and tracking platform",
      logo: "https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J34Nc761zOtmS4gyWw60ueoFxcn1br78fIZYvJ",
      requester: "0x1234...5678",
      users: "12.5k",
      stars: 342,
      launchedAt: "2d ago",
      status: "Live",
      metrics: {
        dau: "2.3k",
        revenue: "5.2k"
      }
    },
    {
      name: "Smart Yield",
      description: "Automated yield farming strategy optimizer for Sonic Blockchain",
      logo: "https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J3TO6Cz42r3VuUbqmM51Boz9gZcavsDI6kTHpE",
      requester: "0x7890...1234",
      users: "8.2k",
      stars: 289,
      launchedAt: "5d ago",
      status: "Live",
      metrics: {
        dau: "1.8k",
        revenue: "3.1k"
      }
    },
    {
      name: "Chain Analytics",
      description: "Advanced blockchain data analytics and visualization tools",
      logo: "https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J3df3rLZ0DfhcbXeOIWLiz1ya3l7RjmTBqGNZP",
      requester: "0x9876...2345",
      users: "5.7k",
      stars: 156,
      launchedAt: "1w ago",
      status: "Live",
      metrics: {
        dau: "1.2k",
        revenue: "2.5k"
      }
    },
    {
      name: "NFT Marketplace",
      description: "Decentralized marketplace for trading unique digital assets",
      logo: "https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J34Nc761zOtmS4gyWw60ueoFxcn1br78fIZYvJ",
      requester: "0x8765...4321",
      users: "N/A",
      stars: 0,
      launchedAt: "5d ago",
      status: "In Queue",
      metrics: {
        dau: "N/A",
        revenue: "N/A"
      }
    },
    {
      name: "Token Swap",
      description: "Cross-chain token swapping with minimal fees",
      logo: "https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J34Nc761zOtmS4gyWw60ueoFxcn1br78fIZYvJ",
      requester: "0x3456...7890",
      users: "N/A",
      stars: 0,
      launchedAt: "3d ago",
      status: "In Queue",
      metrics: {
        dau: "N/A",
        revenue: "N/A"
      }
    },
    {
      name: "DAO Factory",
      description: "No-code platform for launching DAOs on Sonic Blockchain",
      logo: "https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J3JlEaf6HVozIYU8DFRWmkp7SC4bh16KiGHZfv",
      requester: "0x2345...6789",
      users: "N/A",
      stars: 0,
      launchedAt: "4d ago",
      status: "In Queue",
      metrics: {
        dau: "N/A",
        revenue: "N/A"
      }
    }
  ];
  

  const getSortedStartups = (): Startup[] => {
    const filteredStartups =
      filterStatus === "all"
        ? startups
        : startups.filter((s) => s.status === filterStatus);

    return filteredStartups.sort((a, b) => {
      switch (sortBy) {
        case "users":
          // Convert user string (like "12.5k") to a number for sorting.
          return parseFloat(b.users) - parseFloat(a.users);
        case "stars":
          return b.stars - a.stars;
        case "date":
          return (
            new Date(b.launchedAt).getTime() - new Date(a.launchedAt).getTime()
          );
        default:
          return 0;
      }
    });
  };

  return (
    <div className="min-h-screen">
     

      {/* Header */}

      {/* Filters and Sorting */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="">
            <h1 className="text-3xl font-bold text-gray-200">Sonic Launchpad</h1>
            <p className="text-gray-300 mt-2">
              Discover and track the latest startups launching on Sonic Ecosystem
            </p>
          </div>

          <div className="flex gap-4">
            <select
              className="bg-white border border-gray-100 text-sm text-gray-600 rounded-md px-4 py-2"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            >
              <option value="all">All Status</option>
              <option value="In Queue">In Queue</option>
              <option value="Live">Live</option>
            </select>

            <select
              className="bg-white border border-gray-100 text-sm text-gray-600 rounded-md px-4 py-2"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
            >
              <option value="users">Most Users</option>
              <option value="stars">Most Stars</option>
              <option value="date">Latest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Startups Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {getSortedStartups().map((startup, index) => (
            <StartupCard key={index} startup={startup} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LaunchpadPage;
