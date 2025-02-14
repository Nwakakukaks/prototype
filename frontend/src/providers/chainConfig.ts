import { defineChain } from 'viem'

export const sonicTestnet = defineChain({
  id: 57054,
  name: 'Sonic Blaze Testnet',
  network: 'sonic-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Sonic Testnet',
    symbol: 'S',
  },
  rpcUrls: {
    default: { 
      http: ['https://rpc.blaze.soniclabs.com']
    },
    public: {
      http: ['https://rpc.blaze.soniclabs.com']
    }
  },
  blockExplorers: {
    default: {
      name: 'Sonic Explorer',
      url: 'https://testnet.sonicscan.org'
    }
  },
  testnet: true
})
