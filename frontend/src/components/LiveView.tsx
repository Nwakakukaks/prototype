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
import { CircleAlertIcon, Code, Eye, Loader2, RadioTowerIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const LiveView = ({ animateRadio }: { animateRadio: boolean }) => {
  const [open, setOpen] = useState(false);
  const [activeSession, setActiveSession] = useState(true);
  const [code, setCode] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentTab, setCurrentTab] = useState("editor");

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
            animateRadio ? "text-green-600 animate-pulse" : "text-gray-500"
          }`}
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl bg-card/90">
          {!activeSession ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-12">
              <div className="text-center text-muted-foreground">
                <Code size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold">No Active Session</h3>
                <p className="mt-2">
                  Start a new session agent assistance.
                </p>
              </div>
              <Button onClick={startSession}>Start New Session</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Tabs
                value={currentTab}
                onValueChange={setCurrentTab}
                className="w-full"
              >
                <div className="flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="notifications" className="flex items-center">
                      <CircleAlertIcon className="mr-2 h-4 w-4" />
                      Notifications
                    </TabsTrigger>
                    <TabsTrigger value="editor" className="flex items-center">
                      <Code className="mr-2 h-4 w-4" />
                      Editor
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex items-center">
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </TabsTrigger>
                  </TabsList>
                  <Button variant="destructive" size="sm" onClick={endSession}>
                    Close
                  </Button>
                </div>

                <TabsContent value="notifications" className="mt-4">
                  <Card>
                    <CardContent className="p-0">
                      <div className="relative">
                        {isTyping && (
                          <div className="absolute top-2 right-2 flex items-center text-xs text-muted-foreground">
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            AI writing code...
                          </div>
                        )}
                        <pre className="relative h-64 overflow-auto rounded bg-black p-4 text-sm text-white">
                          <code>{code}</code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="editor" className="mt-4">
                  <Card>
                    <CardContent className="p-0">
                      <div className="relative">
                        {isTyping && (
                          <div className="absolute top-2 right-2 flex items-center text-xs text-muted-foreground">
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            AI writing code...
                          </div>
                        )}
                        <pre className="relative h-64 overflow-auto rounded bg-black p-4 text-sm text-white">
                          <code>{code}</code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="preview" className="mt-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="h-64 overflow-auto rounded border bg-white p-4">
                        <div className="space-y-2 text-sm">
                          <p className="font-mono">Output:</p>
                          {code && !isTyping ? (
                            <div className="font-mono">
                              <p>0</p>
                              <p>1</p>
                              <p>1</p>
                              <p>2</p>
                              <p>3</p>
                              <p>5</p>
                              <p>8</p>
                              <p>13</p>
                              <p>21</p>
                              <p>34</p>
                            </div>
                          ) : (
                            <p className="text-muted-foreground">
                              Waiting for code execution...
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
