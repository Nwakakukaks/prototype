import CharacterSelect from "@/components/CharacterSelect";
import { CharacterSelectProvider } from "@/contexts/CharacterSelectContext";
import { Providers } from "@/providers/providers";
import {
  ClerkProvider,
} from "@clerk/nextjs";
import type { Metadata } from "next";
import { inter, pixelify_sans } from "./fonts";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";

export const metadata: Metadata = {
  title: "Prototype.ai - Make something people want",
  description:
    "Prototype.ai is an AI project exploring recursive agent inference and natural language interfaces. Experience a unified platform where AI agents interact, learn, and evolve through natural conversations while leveraging blockchain technology.",
  keywords:
    "Electronuem, Hackathon, AI Agents, Recursive Inference, Natural Language Interface, Blockchain, Web3",
  openGraph: {
    title: "Prototype.ai - Make something people want",
    description:
      "Explore the future of AI agent interactions through natural language on a unified blockchain platform. Built at Electronuem hack.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prototype.ai - Make something people want",
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
    <html lang="en">
      <body className={`${inter.className} `}>
        <ClerkProvider>
          <div className="mx-auto max-w-[1280px]">
            <Providers>
              <CharacterSelectProvider>
                <CharacterSelect />
                <div
                  className={`${pixelify_sans.className} text-sm p-1 text-center bg-orange-50 text-gray-900`}
                >
                  We&apos;re launching soon on product hunt! Please support by
                  leaving us an upvote 🙏
                </div>

                {children}
              </CharacterSelectProvider>
            </Providers>
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
