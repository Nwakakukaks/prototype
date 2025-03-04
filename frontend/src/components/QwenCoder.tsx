import React, { useState, useEffect } from "react";
import { pixelify_sans } from "@/app/fonts";
import { CustomConnectButton } from "./ConnectButton";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useAccount, useReadContract } from "wagmi";
import { parseAbi } from "viem";

export const CodePreview = ({
  codeSnippets,
}: {
  codeSnippets: {
    main: string;
    landing: string;
    header: string;
  };
}) => {
  const combinedCode = `
    <html>
      <head>
        <style>
          body { font-family: sans-serif; margin: 0; padding: 20px; }
          .container { max-width: 1200px; margin: 0 auto; }
        </style>
      </head>
      <body>
        ${codeSnippets.header}
        ${codeSnippets.landing}
        ${codeSnippets.main}
      </body>
    </html>
  `;

  return (
    <div className={`${pixelify_sans.className} h-screen overflow-y-auto p-4`}>
      <div className="">
        <iframe
          title="code-preview"
          srcDoc={combinedCode}
          className="w-full h-full"
          sandbox="allow-scripts"
        />
      </div>
    </div>
  );
};

export const CodeEditor = () => {
  const [customCode, setCustomCode] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const pages = {
    main: `function MainPage() {
  return (
    <div className="container">
      <h1>Welcome to Main</h1>
    </div>
  );
}`,
    landing: `export function Landing() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h2>Start Coding Now</h2>
      </div>
    </section>
  );
}`,
    header: `import { Navigation } from "./components";

export const AppHeader = () => {
  return (
    <header>
      <Navigation />
    </header>
  );
};`,
  };

  return (
    <div className={`${pixelify_sans.className} h-screen overflow-y-auto p-4`}>
      <div className="space-y-8">
        {Object.entries(pages).map(([page, code]) => (
          <div key={page} className="bg-gray-900 p-4 rounded-lg">
            <h3 className="text-xl text-white mb-4">{page}.tsx</h3>
            <div className="text-green-400 font-mono text-sm">
              <pre className="whitespace-pre-wrap">{code}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
