import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  rainbowWallet,
  metaMaskWallet,
  walletConnectWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { base } from 'wagmi/chains';
import { sonicTestnet } from './chainConfig';
import { cookieStorage, createConfig, createStorage, http } from 'wagmi';

export function getConfig() {
    const connectors = connectorsForWallets(
        [
          {
            groupName: 'Recommended',
            wallets: [rainbowWallet, walletConnectWallet],
          },
          {
            groupName: 'Other options',
            wallets: [metaMaskWallet, injectedWallet],
          },
        ],
        {
            appName: 'RFS - RequestForStartup',
            projectId: 'YOUR_PROJECT_ID',
          }
  );

  return createConfig({
    chains: [base, sonicTestnet],
    connectors,
    storage: createStorage({ storage: cookieStorage }),
    ssr: true,
    transports: {
      [base.id]: http(),
      [sonicTestnet.id]: http(),
    },
  });
}
