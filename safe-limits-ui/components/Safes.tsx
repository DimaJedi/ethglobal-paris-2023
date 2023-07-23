import { Box, Button, Flex, Spinner, Text } from "@chakra-ui/react";
import Safe from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";
import { useAccount, useChainId, useSigner } from "wagmi";
import {
  EthersAdapter,
  SafeAccountConfig,
  SafeFactory,
} from "@safe-global/protocol-kit";
import { ethers } from "ethers";
import { useCallback, useEffect, useMemo } from "react";
import useSWR from "swr";
import { useStore } from "@/util/store";
import { shortenAddress } from "@/util/intex";
import managerAbi from "@/util/abi/manager.json";

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

const useSafeSdk = (safeAddress: string) => {
  const ethAdapter = useEthersAdapter();

  const { data } = useSWR(
    [safeAddress, ethAdapter],
    ([safeAddress, ethAdapter]: [string, EthersAdapter]) => {
      if (!ethAdapter) return null;

      return Safe.create({ ethAdapter, safeAddress });
    },
  );

  return data;
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

const getSafeInfo = ([safeKit, safeAddress]: [SafeApiKit, string]) => {
  return Promise.all([
    safeKit.getTokenList(),
    safeKit
      .getPendingTransactions(safeAddress)
      .then((txns) =>
        Promise.all(
          txns.results.map((tx) => safeKit.decodeData(tx.data ?? "")),
        ),
      ),
    safeKit.getSafeInfo(safeAddress),
  ]);
};

const chainHookAddress: Record<number, string> = {
  10: "0x5eE0dCf8fF5DdEec9cB5a4f9cFb5Bf4cD5d4aFf4",
  42161: "0x5eE0dCf8fF5DdEec9cB5a4f9cFb5Bf4cD5d4aFf4",
  137: "0x61bEcB1b6586B880556De23489041161b377E614",
};

const chainManagerAddress: Record<number, string> = {
  10: "0xBAb9A2D08c22E3f0F600a14E22235C6ECc09eB6B",
  42161: "0xBAb9A2D08c22E3f0F600a14E22235C6ECc09eB6B",
  137: "0xc5BB2B971065BF4573a57B95CFc2bDfCFEda0132",
};

const SafeItem = ({ safeAddress }: { safeAddress: string }) => {
  const { selectedSafe, setSelectedSafe } = useStore();
  const safeSdk = useSafeSdk(safeAddress);
  const chainId = useChainId();
  const { data: signer } = useSigner();

  const managerAddress = chainManagerAddress[chainId];
  const hookAddress = chainHookAddress[chainId];

  const { safeKit } = useSafeService();
  const { data: safe } = useSWR(
    safeKit ? [safeKit, safeAddress, "safe"] : null,
    getSafeInfo,
  );

  const [tokens, txns, info] = safe ?? [];

  const assignModuleTx = useCallback(async () => {
    const enableModuleTx = await safeSdk?.createEnableModuleTx(managerAddress);
    const enableTxResp = await safeSdk?.executeTransaction(enableModuleTx!!);
  }, [safeAddress, safeSdk]);

  const handleAddHook = useCallback(async () => {
    const managerContract = new ethers.Contract(
      managerAddress,
      managerAbi,
      signer!!,
    );

    const setHookData = managerContract.interface.encodeFunctionData(
      "setHooks",
      [hookAddress],
    );

    const addIntegrationTx = await safeSdk?.createTransaction({
      safeTransactionData: {
        data: setHookData,
        to: managerAddress,
        operation: 0,
        value: "0",
      },
    });
    const sentTx = await safeSdk?.executeTransaction(addIntegrationTx!!);
  }, [safeSdk]);

  // render safe info
  return (
    <Flex
      flexDirection={"column"}
      gap={1}
      p={2}
      borderRadius={4}
      background={"white"}
      fontWeight={selectedSafe === safeAddress ? "semibold" : undefined}
      onClick={() => setSelectedSafe(safeAddress)}
    >
      <Text>{shortenAddress(safeAddress)}</Text>
      {!!txns?.length ? (
        <Box>{txns?.map((tx) => <Box>{JSON.stringify(tx)}</Box>)}</Box>
      ) : (
        <Text>No pending transactions</Text>
      )}
      <Box w={"100px"}>
        Modules: {info?.modules.length}
      </Box>
      <Button size={"sm"} onClick={handleAddHook}>
        2. Enable Hook
      </Button>
      <Button
        isDisabled={!!info?.modules.length}
        size={"sm"}
        onClick={assignModuleTx}
      >
        1. Authorize module
      </Button>
    </Flex>
  );
};

const Safes = () => {
  const { safeKit } = useSafeService();
  const { data: safes, isLoading } = useSafes(safeKit);
  const { address } = useAccount();
  const safeFactory = useSafeFactory();
  const store = useStore();
  useEffect(() => {
    if (safes?.safes.length) store.setSelectedSafe(safes?.safes[0]);
  }, [safes]);

  const createSafe = useCallback(() => {
    console.log(safeFactory);
    const safeAccountConfig: SafeAccountConfig = {
      owners: [address as string],
      threshold: 1,
    };
    return safeFactory?.deploySafe({ safeAccountConfig });
  }, [safeFactory, address]);

  return (
    <Flex flexDirection={"column"} gap={2}>
      <Button onClick={createSafe}>Create safe</Button>
      <Text fontWeight={"semibold"}>Your safes:</Text>
      {isLoading ? (
        <Spinner />
      ) : (
        <Flex gap={2}>
          {safes?.safes.length
            ? safes.safes.map((safe) => (
                <SafeItem key={safe} safeAddress={safe} />
              ))
            : "No safes found"}
        </Flex>
      )}
    </Flex>
  );
};

export default Safes;
