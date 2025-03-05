/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import {
  Star,
  Users,
  ExternalLink,
  Wallet,
  Calendar,
  TrendingUp,
  Timer,
  Radio,
  Link2Icon,
  ContactRoundIcon,
  BuildingIcon,
  Loader2,
} from "lucide-react";

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

export interface Startup {
  name: string;
  description: string;
  logo: string;
  link: string;
  requester: string;
  users: string;
  stars: number;
  launchedAt: string;
  created_at: string;
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
    <p className="text-gray-600 mb-4 line-clamp-3">{startup.description}</p>

    <div className="flex items-center gap-4 mb-3">
      <div className="flex items-center gap-2">
        <Link2Icon size={16} className="text-gray-600" />
        {startup.status === "In Queue" ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-600 underline">
              awaiting deployment
            </span>
            <Loader2 size={16} className="animate-spin text-gray-600" />
          </div>
        ) : (
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={startup.link}
            className="text-sm text-blue-500 truncate font-medium underline min-w-0 cursor-pointer"
          >
            {startup.link}
          </a>
        )}
      </div>
      <div className="flex items-center gap-2">
        <BuildingIcon size={16} className="text-gray-600" />
        <span className="text-sm text-gray-900 truncate font-medium min-w-0">
          {startup.requester}
        </span>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-sm text-gray-500">Daily Active Users</div>
        <div className="text-lg font-bold text-gray-800">
          {startup.metrics.dau}
        </div>
      </div>
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-sm text-gray-500">Revenue (AT)</div>
        <div className="text-lg font-bold text-gray-800">
          ${startup.metrics.revenue}
        </div>
      </div>
    </div>

    <div className="flex items-center justify-between pt-4 px-4 border-t border-gray-100">
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
      <div className="flex items-center gap-1">
        <Calendar size={16} className="text-gray-500" />
        <span className="text-sm text-gray-600 font-medium">
          {new Date(startup.created_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
          })}
        </span>
      </div>
    </div>
  </div>
);

type SortBy = "users" | "stars" | "date";
type FilterStatus = "all" | Status;

const LaunchpadPage: React.FC = () => {
  const [sortBy, setSortBy] = useState<SortBy>("users");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    const fetchStartups = async () => {
      try {
        const res = await fetch(
          `${supabaseUrl}/rest/v1/pad19_listings?select=*`,
          {
            headers: {
              apikey: supabaseAnonKey!,
              Authorization: `Bearer ${supabaseAnonKey}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!res.ok) {
          throw new Error("Failed to fetch startups");
        }
        const data = await res.json();
        setStartups(data);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchStartups();
  }, [supabaseUrl, supabaseAnonKey]);

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

  if (loading)
    return <div className="text-center p-8">Loading startups...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen">
      {/* Filters and Sorting */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="">
            <h1 className="text-3xl font-bold text-gray-200">
              Sonic Launchpad
            </h1>
            <p className="text-gray-300 mt-2">
              Discover and track the latest startups launching on the Sonic
              Ecosystem
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getSortedStartups().map((startup, index) => (
            <StartupCard key={index} startup={startup} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LaunchpadPage;
