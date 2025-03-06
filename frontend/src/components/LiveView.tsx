import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CircleAlertIcon,
  Code,
  Eye,
  Loader2,
  RadioTowerIcon,
} from "lucide-react";
import { pixelify_sans } from "@/app/fonts";
import NotificationBoard from "./NotificationBoard";
import { CodeEditor, CodePreview } from "./QwenCoder";

interface liveProps {
  animateRadio: boolean;
  notifications: any[];
}

const LiveView = ({ animateRadio, notifications }: liveProps) => {
  const [activeSession, setActiveSession] = useState(true);
  const [code, setCode] = useState(defaultCode);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTab, setCurrentTab] = useState("notifications");

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      let interfaceNotification = null;
      for (const notification of notifications) {
        let parsedData;
        try {
          parsedData = JSON.parse(notification.message);
        } catch (error) {
          continue;
        }
        if (parsedData.eventName === "interface_created") {
          interfaceNotification = parsedData;
          break;
        }
      }
      if (interfaceNotification && interfaceNotification.metadata) {
        const codeContent = interfaceNotification.metadata.code;
        setCode(codeContent);
      }
    }
  }, [notifications]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <RadioTowerIcon
          size={24}
          className={`${
            animateRadio ? "text-green-500 animate-pulse" : "text-gray-500"
          }`}
        />
      </DialogTrigger>

      <DialogHeader>
        <DialogTitle></DialogTitle>
      </DialogHeader>
      <DialogContent
        className={`${pixelify_sans.className} sm:max-w-3xl bg-gray-950 border border-gray-400 max-h-[80vh] scrollbar-hide overflow-y-auto`}
      >
        {!activeSession ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <div className="text-center text-muted-foreground">
              <Code size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold">No Active Session</h3>
              <p className="mt-2 text-sm">
                Begin chat with agents to initiate a new live session.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Tabs
              value={currentTab}
              onValueChange={setCurrentTab}
              className="w-full"
            >
              <div className="flex items-center justify-between">
                <TabsList className="w-full flex">
                  <TabsTrigger
                    value="notifications"
                    className="flex-1 text-center"
                  >
                    <CircleAlertIcon className="mr-2 h-4 w-4" />
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger value="editor" className="flex-1 text-center">
                    <Code className="mr-2 h-4 w-4" />
                    Live Coder
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex-1 text-center">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview Project
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="notifications" className="mt-4">
                <NotificationBoard notifications={notifications} />
              </TabsContent>

              <TabsContent value="editor" className="mt-4">
                <CodeEditor code={code} />
              </TabsContent>

              <TabsContent value="preview" className="mt-4">
                <CodePreview code={code} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LiveView;

const defaultCode = `export const MainPage = () => {
    return (
      <div className="bg-gray-100 min-h-screen p-8">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-blue-900 mb-8">Lending Dashboard</h2>
          
          <div className="grid grid-cols-3 gap-6">
            {/* Lending Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-blue-900 mb-4">Lend Assets</h3>
              <div className="space-y-4">
                <select className="w-full p-2 border rounded-lg">
                  <option>Select Asset</option>
                  <option>ETH</option>
                  <option>USDC</option>
                  <option>DAI</option>
                </select>
                <input 
                  type="number" 
                  placeholder="Enter Amount" 
                  className="w-full p-2 border rounded-lg"
                />
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
                  Supply Liquidity
                </button>
              </div>
            </div>
  
            {/* Borrowing Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-blue-900 mb-4">Borrow Assets</h3>
              <div className="space-y-4">
                <select className="w-full p-2 border rounded-lg">
                  <option>Select Collateral</option>
                  <option>ETH</option>
                  <option>BTC</option>
                </select>
                <input 
                  type="number" 
                  placeholder="Borrow Amount" 
                  className="w-full p-2 border rounded-lg"
                />
                <div className="text-sm text-gray-600">
                  Collateralization Ratio: 150%
                </div>
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
                  Borrow Now
                </button>
              </div>
            </div>
  
            {/* Portfolio Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-blue-900 mb-4">Your Portfolio</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Supplied</span>
                  <span className="font-bold">$5,420.35</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Borrowed</span>
                  <span className="font-bold">$2,310.75</span>
                </div>
                <div className="flex justify-between">
                  <span>Current APY</span>
                  <span className="font-bold text-green-600">4.5%</span>
                </div>
                <button className="w-full bg-gray-200 text-blue-900 py-3 rounded-lg hover:bg-gray-300">
                  View Full Portfolio
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };`;
