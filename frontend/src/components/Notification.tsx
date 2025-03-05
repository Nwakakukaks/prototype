/* eslint-disable @next/next/no-img-element */
import { pixelify_sans } from "@/app/fonts";
import { truncateAddress } from "@/utils/formatters";
import { Name } from "@coinbase/onchainkit/identity";
import Image from "next/image";
import { base } from "wagmi/chains";

interface NotificationProps {
  message: string;
  timestamp: Date;
  characterName: string;
  eventName?: string;
  metadata?: Record<string, string>;
}

const Notification = ({
  message,
  timestamp,
  characterName,
  eventName,
  metadata,
}: NotificationProps) => {
  const getEventTagClass = (event: string) => {
    switch (event) {
      case "funds_requested":
        return "bg-emerald-500 text-white";
      case "trade_executed":
        return "bg-blue-500 text-white";
      case "contract_deployed":
        return "bg-purple-500 text-white";
      case "wallet_created":
        return "bg-amber-500 text-white";
      case "uniswap_pool_created":
        return "bg-pink-500 text-white";
      case "tweet_created":
        return "bg-sky-500 text-white";
      case "system":
        return "bg-gray-500 text-white";
      case "image_created":
        return "bg-indigo-500 text-white";
      case "basename_managed":
        return "bg-blue-700 text-white";
      case "repo_created":
        return "bg-teal-500 text-white";
      case "vercel_deployment":
        return "bg-violet-500 text-white";
      case "prd_created":
        return "bg-red-500 text-white";
      case "listed_on_pad19":
        return "bg-cyan-500 text-white";
      case "research_completed":
        return "bg-black text-white";
      default:
        return "bg-orange-600 text-white";
    }
  };

  const getCharacterNameClass = (name: string) => {
    const lowerName = (name || "").toLowerCase();
    switch (lowerName) {
      case "jaden":
        return "text-green-500";
      case "qwen":
        return "text-amber-500";
      case "monad":
        return "text-rose-500";
      case "risha":
        return "text-blue-500";
      case "pearl":
        return "text-pink-500";
      default:
        return "text-black";
    }
  };

  const getBackgroundClass = (name: string) => {
    const lowerName = (name || "").toLowerCase();
    switch (lowerName) {
      case "jaden":
        return "bg-green-50";
      case "qwen":
        return "bg-amber-50";
      case "monad":
        return "bg-rose-50";
      case "risha":
        return "bg-blue-50";
      case "pearl":
        return "bg-pink-50";
      default:
        return "bg-card";
    }
  };

  const getBorderClass = (name: string) => {
    const lowerName = (name || "").toLowerCase();
    switch (lowerName) {
      case "jaden":
        return "border-green-100";
      case "qwen":
        return "border-amber-100";
      case "monad":
        return "border-rose-100";
      case "risha":
        return "border-blue-100";
      case "pearl":
        return "border-pink-100";
      default:
        return "border-gray-100";
    }
  };

  const renderMetadataValue = (key: string, value: string) => {
    if (
      key === "walletAddress" ||
      key === "contractAddress" ||
      key === "fromAddress" ||
      key === "toAddress" ||
      key === "poolAddress" ||
      key === "tokenAddress"
    ) {
      return truncateAddress(value);
    }
    if (
      key === "requestedAmount" ||
      key === "amount" ||
      key === "totalSupply"
    ) {
      return `${parseFloat(value) / 1e18} S`;
    }
    return value;
  };

  const getExternalLink = (
    eventName: string,
    metadata: Record<string, string>
  ): string | null => {
    switch (eventName) {
      case "contract_deployed":
        return `https://testnet.sonicscan.org/address/${metadata.contractAddress}`;
      case "uniswap_pool_created":
        return `https://dexscreener.com/base/${metadata.poolAddress.toLowerCase()}`;
      case "nft_created":
        return `https://zora.co/collect/zora:${metadata.contractAddress.toLowerCase()}`;
      case "tweet_created":
        return `https://x.com/i/${metadata.tweetId}`;
      case "prd_created":
        return `${metadata.Notion_doc}`;
      case "vercel_deployment":
        return `${metadata.live_link}`;
      case "repo_created":
        return `${metadata.github_repo}`;
      case "listed_on_pad19":
        return `http://localhost:3000/pad19`; // change to deployment url
      default:
        return null;
    }
  };

  return (
    <div
      className={`relative p-4 mb-2 rounded-lg shadow-sm ${getBackgroundClass(
        characterName
      )} ${getBorderClass(characterName)} border-2 ${
        ["contract_deployed", "uniswap_pool_created", "nft_created"].includes(
          eventName || ""
        )
          ? "cursor-pointer hover:opacity-90"
          : ""
      } text-black`}
      onClick={() => {
        const link =
          metadata && eventName ? getExternalLink(eventName, metadata) : null;
        if (link) {
          window.open(link, "_blank");
        }
      }}
    >
      <div className="flex flex-col gap-2 w-full">
        {/* Header row with timestamp */}
        <div className="flex items-start justify-between gap-2 w-full">
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <span
              className={`font-semibold truncate ${getCharacterNameClass(
                characterName
              )}`}
            >
              {characterName === "You" ? "Project Idea" : characterName}
            </span>
            {eventName && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${getEventTagClass(
                  eventName
                )} shrink-0`}
              >
                {eventName.replace("_", " ")}
              </span>
            )}
          </div>
          <span className="text-xs text-black shrink-0">
            {timestamp.toLocaleTimeString()}
          </span>
        </div>

        {/* Message */}
        <div
          className={`text-sm w-full text-black ${
            eventName === "system" ? "font-black" : ""
          }`}
        >
          {message.split(/(?<=[.!?])\s+/).map((sentence, index) => (
            <span key={index} className={index === 0 ? "font-medium" : ""}>
              {sentence}{" "}
            </span>
          ))}
        </div>

        {/* Metadata */}
        {metadata && (
          <div
            className={`mt-1 p-2 rounded-md bg-muted/50 text-xs font-mono w-full text-white ${
              pixelify_sans.className
            }  font-medium ${eventName ? getEventTagClass(eventName) : ""}`}
          >
            {eventName === "image_created" && metadata.url && (
              <img
                src={metadata.url}
                alt="Generated image"
                className="rounded-md"
              />
            )}

            {eventName === "uniswap_pool_created" && (
              <img
                src={
                  "https://i.pinimg.com/originals/1d/cc/84/1dcc8458abdeee8e528d7996047d1000.jpg"
                }
                alt="Uniswap pool"
                className="rounded-md"
              />
            )}
            {eventName === "nft_created" && (
              <img
                src={
                  "https://avatars.githubusercontent.com/u/60056322?s=280&v=4"
                }
                alt="NFT"
                className="rounded-md"
              />
            )}
            {eventName === "contract_deployed" && (
              <img
                src={
                  "https://images.mirror-media.xyz/publication-images/cgqxxPdUFBDjgKna_dDir.png?height=1200&width=1200"
                }
                alt="Contract deployed"
                className="rounded-md"
              />
            )}
            <div className="grid grid-cols-1 gap-1">
              {Object.entries(metadata).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-white font-medium capitalize shrink-0">
                    {key.replace(/([A-Z])/g, " $1").toLowerCase()}:
                  </span>
                  <span className="text-white truncate">
                    {renderMetadataValue(key, value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notification;
