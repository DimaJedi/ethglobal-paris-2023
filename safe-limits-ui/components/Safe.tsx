import { Box, Button, Text } from "@chakra-ui/react";

import SafeApiKit from "@safe-global/api-kit";
import { useAccount, useChainId, useSigner } from "wagmi";
import {
  EthersAdapter,
  SafeAccountConfig,
  SafeFactory,
} from "@safe-global/protocol-kit";
import { ethers } from "ethers";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

const ChainTxServiceUrl: Record<number, string> = {
  //optimism
  10: "https://safe-transaction-optimism.safe.global/",
  // arbitrum
  42161: "https://safe-transaction-arbitrum.safe.global/",
  // polygon
  137: "https://safe-transaction-polygon.safe.global/",
};
const txServiceUrl = "https://safe-transaction-goerli.safe.global";
// const safeService = new SafeApiKit({
//   txServiceUrl,
//   ethAdapter: ethAdapterOwner1,
// });

const useEthersAdapter = () => {
  const { data: signer } = useSigner();

  return useMemo(() => {
    if (!signer) return null;

    return new EthersAdapter({ ethers, signerOrProvider: signer });
  }, [signer]);
};
const useSafeService = () => {
  const chain = useChainId();
  const currentChainTxServiceUrl = ChainTxServiceUrl[chain];
  const ethAdapter = useEthersAdapter();

  const safeKit = useMemo(() => {
    if (!ethAdapter) return null;

    return new SafeApiKit({
      txServiceUrl: currentChainTxServiceUrl,
      ethAdapter,
    });
  }, [currentChainTxServiceUrl, ethAdapter]);

  return { safeKit };
};

const useSafeFactory = () => {
  const ethAdapter = useEthersAdapter();

  const safeFactory = useSWR(
    ethAdapter ? [ethAdapter || null, "safe-factory"] : null,
    ([ethAdapter]) => SafeFactory.create({ ethAdapter }),
  );

  return safeFactory.data;
};

const useSafes = (safeKit: SafeApiKit | null) => {
  const { address } = useAccount();
  console.log(safeKit);

  return useSWR([address, "safes"], async ([address]: [string]) => {
    return safeKit?.getSafesByOwner(address);
  });
};

const Safe = () => {
  const { safeKit } = useSafeService();
  const { data: safes } = useSafes(safeKit);
  const { address } = useAccount();
  const safeFactory = useSafeFactory();

  const createSafe = useCallback(() => {
    console.log(safeFactory);
    const safeAccountConfig: SafeAccountConfig = {
      owners: [address as string],
      threshold: 1,
    };
    return safeFactory?.deploySafe({ safeAccountConfig });
  }, [safeFactory, address]);

  return (
    <Box>
      <Button onClick={createSafe}>Create safe</Button>
      <Text>Your safes</Text>
      <Box>{safes?.safes.map((safe) => <Box key={safe}>{safe}</Box>)}</Box>
    </Box>
  );
};

export default Safe;
