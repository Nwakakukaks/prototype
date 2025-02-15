import CharacterSelect from "@/components/CharacterSelect";
import CreateCharacterButton from "@/components/CreateCharacterButton";
import { CharacterSelectProvider } from "@/contexts/CharacterSelectContext";
import { Providers } from "@/providers/providers";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs";
import type { Metadata } from "next";
import Image from "next/image";
import { inter } from "./fonts";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";

export const metadata: Metadata = {
  title: "RequestForStartup - Sonic DEFAI Project",
  description:
    "RequestForStartup is an Sonic DEFAI project exploring recursive agent inference and natural language interfaces. Experience a unified platform where AI agents interact, learn, and evolve through natural conversations while leveraging blockchain technology.",
  keywords:
    "Sonic DEFAI, Hackathon, AI Agents, Recursive Inference, Natural Language Interface, Blockchain, Web3",
  openGraph: {
    title: "RequestForStartup - Recursive Agent Platform",
    description:
      "Explore the future of AI agent interactions through natural language on a unified blockchain platform. Built at Sonic DEFAI.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RequestForStartup - Sonic DEFAI",
    description:
      "Revolutionary platform for recursive AI agent interactions through natural language interfaces.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" >
      <body className={`${inter.className} `}>
        <ClerkProvider>
          <div className="mx-auto max-w-[1280px]">
            <Providers>
              <CharacterSelectProvider>
                <CharacterSelect />
                {children}
              </CharacterSelectProvider>
            </Providers>
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
