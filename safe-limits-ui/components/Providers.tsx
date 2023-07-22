"use client";

import { arbitrum, optimism, polygon } from "wagmi/chains";
import {
  connectorsForWallets,
  getDefaultWallets,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { configureChains, WagmiConfig, createClient } from "wagmi";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import { ReactNode, useEffect, useState } from "react";
import { CacheProvider } from "@chakra-ui/next-js";
import { ChakraProvider } from "@chakra-ui/react";
import { injectedWallet } from "@rainbow-me/rainbowkit/wallets";

const { chains, provider } = configureChains(
  [polygon, optimism, arbitrum],
  [
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_KEY as string }),
    publicProvider(),
  ],
);

const connectors = connectorsForWallets([
  { groupName: "Recomended", wallets: [injectedWallet({ chains })] },
]);

const wagmiConfig = createClient({
  autoConnect: true,
  connectors,
  provider,
});

const Providers = ({ children }: { children: ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <WagmiConfig client={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <CacheProvider>
          <ChakraProvider>{mounted && children}</ChakraProvider>
        </CacheProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

export default Providers;
