"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';
import { sonicTestnet } from './chainConfig';
import { getConfig } from './wagmi';

export function Providers(props: { children: ReactNode; initialState?: any }) {
  const [config] = useState(() => getConfig());
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config} initialState={props.initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {props.children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
