import { defineChain } from 'viem'

export const sonicTestnet = defineChain({
  id: 57054,
  name: 'Electronuem Testnet',
  network: 'electronuem-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Electronuem Testnet',
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
      name: 'Electronuem Explorer',
      url: 'https://testnet.sonicscan.org'
    }
  },
  testnet: true
})
