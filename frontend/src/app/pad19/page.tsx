import React, { useState } from 'react';
import {
  Star,
  Users,
  ExternalLink,
  Wallet,
  Calendar,
  TrendingUp,
  Timer,
  Radio,
} from 'lucide-react';

type Status = 'In Queue' | 'Building' | 'Live';

interface StatusBadgeProps {
  status: Status;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles: Record<Status, string> = {
    'In Queue': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Building': 'bg-blue-100 text-blue-800 border-blue-200',
    'Live': 'bg-green-100 text-green-800 border-green-200',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${styles[status]}`}>
      {status === 'In Queue' && <Timer size={14} className="inline mr-1" />}
      {status === 'Building' && <Radio size={14} className="inline mr-1" />}
      {status === 'Live' && <TrendingUp size={14} className="inline mr-1" />}
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
        className="w-12 h-12 rounded-full"
      />
      <StatusBadge status={startup.status} />
    </div>
    
    <h3 className="text-xl font-bold text-gray-800 mb-2">{startup.name}</h3>
    <p className="text-gray-600 mb-4 line-clamp-2">{startup.description}</p>
    
    <div className="flex items-center gap-2 mb-3">
      <Wallet size={16} className="text-gray-500" />
      <span className="text-sm text-gray-500 truncate">{startup.requester}</span>
    </div>

    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-sm text-gray-500">Daily Active Users</div>
        <div className="text-lg font-bold text-gray-800">{startup.metrics.dau}</div>
      </div>
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-sm text-gray-500">Revenue (24h)</div>
        <div className="text-lg font-bold text-gray-800">${startup.metrics.revenue}</div>
      </div>
    </div>
    
    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
      <div className="flex items-center gap-1">
        <Users size={16} className="text-orange-500" />
        <span className="text-sm font-medium">{startup.users}</span>
      </div>
      <div className="flex items-center gap-1">
        <Star size={16} className="text-orange-500" />
        <span className="text-sm font-medium">{startup.stars}</span>
      </div>
      <div className="flex items-center gap-1">
        <Calendar size={16} className="text-gray-500" />
        <span className="text-sm text-gray-500">{startup.launchedAt}</span>
      </div>
    </div>
  </div>
);

type SortBy = 'users' | 'stars' | 'date';
type FilterStatus = 'all' | Status;

const LaunchpadPage: React.FC = () => {
  const [sortBy, setSortBy] = useState<SortBy>('users');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const startups: Startup[] = [
    {
      name: "DeFi Pulse",
      description: "Real-time DeFi protocol analytics and tracking platform",
      logo: "/api/placeholder/48/48",
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
      name: "NFT Marketplace",
      description: "Decentralized marketplace for trading unique digital assets",
      logo: "/api/placeholder/48/48",
      requester: "0x8765...4321",
      users: "8.2k",
      stars: 289,
      launchedAt: "5d ago",
      status: "Building",
      metrics: {
        dau: "1.8k",
        revenue: "3.1k"
      }
    },
    {
      name: "Chain Analytics",
      description: "Advanced blockchain data analytics and visualization tools",
      logo: "/api/placeholder/48/48",
      requester: "0x9876...2345",
      users: "5.7k",
      stars: 156,
      launchedAt: "1w ago",
      status: "In Queue",
      metrics: {
        dau: "1.2k",
        revenue: "2.5k"
      }
    }
    // Add more startup data as needed
  ];

  const getSortedStartups = (): Startup[] => {
    const filteredStartups = filterStatus === 'all' 
      ? startups 
      : startups.filter((s) => s.status === filterStatus);

    return filteredStartups.sort((a, b) => {
      switch (sortBy) {
        case 'users':
          // Convert user string (like "12.5k") to a number for sorting.
          return parseFloat(b.users) - parseFloat(a.users);
        case 'stars':
          return b.stars - a.stars;
        case 'date':
          return new Date(b.launchedAt).getTime() - new Date(a.launchedAt).getTime();
        default:
          return 0;
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-800">Sonic Launchpad</h1>
          <p className="text-gray-600 mt-2">
            Discover and track the latest startups built on Sonic Blockchain
          </p>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex gap-4">
            <select 
              className="bg-white border border-gray-300 rounded-lg px-4 py-2"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            >
              <option value="all">All Status</option>
              <option value="In Queue">In Queue</option>
              <option value="Building">Building</option>
              <option value="Live">Live</option>
            </select>

            <select 
              className="bg-white border border-gray-300 rounded-lg px-4 py-2"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
            >
              <option value="users">Most Users</option>
              <option value="stars">Most Stars</option>
              <option value="date">Latest</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500">Total Projects: {startups.length}</span>
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
