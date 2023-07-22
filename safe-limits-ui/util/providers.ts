import { JsonRpcProvider } from "@ethersproject/providers";

const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY;

export const arbitrumProvider = new JsonRpcProvider(
  // { url: "https://rpc.ankr.com/arbitrum" },
  // { url: "https://arb1.arbitrum.io/rpc " },
  {
    url: `https://arb-mainnet.g.alchemy.com/v2/${alchemyKey}`,
  },
  42161
);

export const optimismProvider = new JsonRpcProvider(
  {
    url: `https://opt-mainnet.g.alchemy.com/v2/${alchemyKey}`,
  },
  // { url: "https://mainnet.optimism.io" },
  10
);
