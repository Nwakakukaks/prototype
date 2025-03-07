import { defineChain } from "viem";

export const sonicTestnet = defineChain({
  id: 52014,
  name: "Electronuem Mainnet",
  network: "electronuem-mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "Electronuem Mainnet",
    symbol: "ETN",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.electroneum.com"],
    },
    public: {
      http: ["https://rpc.electroneum.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Electronuem Explorer",
      url: "https://blockexplorer.electroneum.com",
    },
  },
});
