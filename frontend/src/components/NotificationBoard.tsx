import { pixelify_sans } from "@/app/fonts";
import { useEffect } from "react";
import { formatEther } from "viem";
import { useSendTransaction } from "wagmi";
import Notification from "./Notification";

interface NotificationBoardProps {
  notifications: any[];
}

const NotificationBoard = ({ notifications }: NotificationBoardProps) => {
  const { sendTransaction } = useSendTransaction();

  const formatMessage = (data: any): string => {
    switch (data.eventName) {
      case "wallet_created":
        return `${data.characterId}'s wallet was created`;
      case "funds_requested":
        return `${data.characterId} requested ${formatEther(
          data.metadata.requestedAmount
        )} S`;
      case "repo_created":
        return `${data.characterId} created a github repository: https://github.com/${data.metadata.repoOwner}/${data.metadata.repoName}`;
      case "vercel_deployment":
        return `${data.characterId} deployed project on Vercel: https://${data.metadata.deploymentId}.vercel.app`;
      case "prd_created":
        return `${data.characterId} created project PRD: https://www.notion.so/${data.metadata.prdId}`;
      case "listed_on_pad19":
        return `${data.characterId} created pad19 listing: https://${window.location}/pad19`;
      case "tweet_created":
        return `${data.characterId} created a tweet to promote product on X: https://x.com/i/${data.metadata.tweetId}`;
      case "research_completed":
        return `${data.characterId} completed crypto and DeFi strategy research and has offered advice on how to best position for success.`;
      case "pin_idea":
        return data.message;
      default:
        return `System event: ${data.eventName}`;
    }
  };

  useEffect(() => {
    const recentFundRequests = notifications
      ?.map((notification) => {
        let data;
        try {
          data = JSON.parse(notification.message);
        } catch (error) {
          data = {
            eventName: "pin_idea",
            createdAt: notification.timestamp,
            characterId: notification.characterName,
            metadata: {},
            message: notification.message,
          };
        }
        return {
          eventName: data.eventName,
          timestamp: new Date(data.createdAt),
          metadata: data.metadata,
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

  return (
    <div className="w-full h-[60vh] flex flex-col p-4 overflow-y-auto">
      <h2
        className={`font-semibold tracking-tight text-lg text-orange-600 mb-4 ${pixelify_sans.className}`}
      >
        System Events
      </h2>
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {notifications?.map((notification) => {
            let parsedData;
            try {
              parsedData = JSON.parse(notification.message);
            } catch (error) {
              parsedData = {
                eventName: "pin_idea",
                createdAt: notification.timestamp,
                characterId: notification.characterName,
                metadata: {},
                message: notification.message,
              };
            }
            return (
              <Notification
                key={notification.id}
                characterName={parsedData.characterId}
                timestamp={new Date(parsedData.createdAt)}
                message={formatMessage(parsedData)}
                eventName={parsedData.eventName}
                metadata={parsedData.metadata}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NotificationBoard;
