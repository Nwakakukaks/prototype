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
        return `${data.characterId}'s wallet was created 👛`;
      case "funds_requested":
        return `${data.characterId} requested ${formatEther(
          data.metadata.requestedAmount
        )} S 💸`;
      case "repo_created":
        return `Risha created a GitHub repository for the project, necessary for rapid collaboration and development. 📁`;
      case "vercel_deployment":
        return `Risha deployed the project on Vercel, leveraging modern cloud infrastructure for global access and agile updates. 🚀`;
      case "prd_created":
        return `Risha crafted a PRD on Notion outlining milestones, objectives, and deliverables—a concise roadmap from concept to execution. 📝`;
      case "listed_on_pad19":
        return `Pearl published a pad19 listing for the project, enabling quick testing, feedback, and early validation within the Electronuem Blockchain community. 📋`;
      case "tweet_created":
        return `Monad tweeted about the project on X to generate buzz, drive engagement, and attract early adopters by showcasing its unique value. 🐦`;
      case "research_completed":
        return `Jaden completed in-depth crypto and DeFi research, offering actionable insights to position the project competitively in an evolving market. 📊`;
      case "pin_idea":
        return `${data.message} 📌`;
      default:
        return ``;
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
