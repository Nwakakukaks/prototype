'use client'

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Code,
  Lightbulb,
  ChevronRight,
  ArrowRightCircleIcon,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { pixelify_sans } from "../fonts";

const GetStartedPage = () => {
    const router = useRouter();

    const handleNavigate = () => {
      router.push('/home');
    };
  
  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header Section */}
        <div className="text-center mb-8">
          <Image
            src="https://jnoznbd6y3.ufs.sh/f/PKy8oE1GN2J3P7j4Pv1GN2J3xEzatPAmWyqpgcFKwuUrY9jn"
            alt="VersionOne Logo"
            width={700}
            height={300}
            className="mx-auto object-contain"
          />
        </div>

        {/* Cards Container */}
        <p className="flex gap-2 items-center justify-center text-2xl text-gray-50 font-bold text-center mb-4">
          Select a Track to Continue
          <ArrowRightCircleIcon />
        </p>
        <div className={`grid md:grid-cols-2 gap-8 max-w-5xl mx-auto `}>
          {/* Developer Card */}
          <Card className="relative group hover:shadow-xl transition-shadow duration-300 bg-card/90">
            <CardHeader className="pb-4">
              <div className="mb-4">
                <Code className="h-12 w-12 text-orange-600" />
              </div>
              <CardTitle className="text-2xl text-gray-800">
                For Developers
              </CardTitle>
              <CardDescription className="text-gray-600">
                Build and validate your dApp quickly with our AI-powered
                platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">
                    Describe your idea and let our AI agents create a working v1
                  </span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">
                    Get immediate feedback through Pad19 launchpad
                  </span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">
                    Build only validated ideas, saving time and resources
                  </span>
                </li>
              </ul>
              <Button
                size={"lg"}
                onClick={handleNavigate}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white group-hover:translate-y-[-2px] transition-transform duration-300 "
              >
                Start Building
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Non-Technical Card */}
          <Card className="relative group hover:shadow-xl transition-shadow duration-300 bg-card/90">
            <CardHeader className="pb-4">
              <div className="mb-4">
                <Lightbulb className="h-12 w-12 text-orange-600" />
              </div>
              <CardTitle className="text-2xl text-gray-800">
                For Non-Technical
              </CardTitle>
              <CardDescription className="text-gray-600">
                Turn your ideas into reality without writing code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">
                    Chat with AI agents to create your dApp prototype
                  </span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">
                    Earn revenue share when your idea succeeds
                  </span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">
                    Get support from Sonic developer team to further successful
                    ideas
                  </span>
                </li>
              </ul>
              <Button
                size={"lg"}
                onClick={handleNavigate}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white group-hover:translate-y-[-2px] transition-transform duration-300"
              >
                Chat with Agents
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GetStartedPage;
