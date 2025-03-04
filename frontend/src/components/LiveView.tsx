import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CircleAlertIcon,
  Code,
  Eye,
  Loader2,
  RadioTowerIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { pixelify_sans } from "@/app/fonts";
import NotificationBoard from "./NotificationBoard";
import {CodeEditor, CodePreview} from "./QwenCoder";

interface liveProps {
  animateRadio: boolean;
  notifications: any[];
}

const LiveView = ({ animateRadio, notifications }: liveProps) => {
  const [open, setOpen] = useState(false);
  const [activeSession, setActiveSession] = useState(true);
  const [code, setCode] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentTab, setCurrentTab] = useState("notifications");
  const [codeSnippets, setCodeSnippets] = useState({
    main: '',
    landing: '',
    header: ''
  });

  // Simulate AI typing
  const simulateAiTyping = () => {
    setIsTyping(true);
    setCode("");

    const exampleCode = `
function fibonacci(n) {
  if (n <= 1) return n;
  
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Display the first 10 Fibonacci numbers
for (let i = 0; i < 10; i++) {
  console.log(fibonacci(i));
}
`;

    let i = 0;
    const typeInterval = setInterval(() => {
      if (i < exampleCode.length) {
        setCode((prev) => prev + exampleCode.charAt(i));
        i++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
      }
    }, 50);
  };

  const startSession = () => {
    setActiveSession(true);
    simulateAiTyping();
  };

  const endSession = () => {
    setActiveSession(false);
    setCode("");
  };

  return (
    <div>
      <button onClick={() => setOpen(true)}>
        <RadioTowerIcon
          size={22}
          className={`mt-2 ${
            animateRadio ? "text-green-500 animate-pulse" : "text-gray-500"
          }`}
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
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
                    <TabsTrigger
                      value="editor"
                      className="flex-1 text-center"
                    >
                      <Code className="mr-2 h-4 w-4" />
                      Live Coder
                    </TabsTrigger>
                    <TabsTrigger
                      value="preview"
                      className="flex-1 text-center"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Preview Project
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="notifications" className="mt-4">
                  <NotificationBoard notifications={notifications} />
                </TabsContent>

                <TabsContent value="editor" className="mt-4">
                <CodeEditor />
                </TabsContent>

                <TabsContent value="preview" className="mt-4">
                <CodePreview codeSnippets={codeSnippets} /> 
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LiveView;
