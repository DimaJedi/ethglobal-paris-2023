import Lyra, {
  Market,
  Position,
  Quote,
} from "@/node_modules/@lyrafinance/lyra-js";
import { useAccount } from "wagmi";
import { BigNumber } from "ethers";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getExpirationTerm } from "./intex";
import { CHAINS, UNIT, ZERO_BN } from "./constants";
import { arbitrumProvider, optimismProvider } from "./providers";
import fromBigNumber from "./fromBigNumber";
import {
  ActivePosition,
  Instrument,
  OptionsMap,
  OptionType,
  ProviderType,
} from "./types";

const lyraArbitrum = new Lyra({
  // @ts-ignore
  provider: arbitrumProvider,
});
const lyraOptimism = new Lyra({
  // @ts-ignore
  provider: optimismProvider,
});

const chainLyraInstances = {
  [CHAINS.OP]: lyraOptimism,
  [CHAINS.ARB]: lyraArbitrum,
};

const chainLyraProvider: Record<CHAINS, ProviderType> = {
  [CHAINS.OP]: ProviderType.LYRA_OP,
  [CHAINS.ARB]: ProviderType.LYRA_ARB,
};

const parsePrice = (quote: Quote) =>
  parseFloat(quote.pricePerOption.toString()) / 1e18;

const useLyraMarket = (chain: CHAINS) => {
  // const { underlying } = useAppContext();
  const underlying = "ETH";
  const { data: market } = useQuery(
    ["lyra-markets", underlying, chain],
    () => chainLyraInstances[chain].market(underlying).catch(console.error),
    { staleTime: Infinity, retryDelay: 10000, retry: 1 },
  );

  return [market];
};

export const useLyraStrikeId = ({
  strike,
  expiration,
  provider,
}: Pick<Instrument, "strike" | "expiration" | "provider">) => {
  const chain = Object.entries(chainLyraProvider).find(
    ([, providerType]) => providerType === provider,
  )?.[0] as CHAINS;
  const [market] = useLyraMarket(chain);
  const expirationDate = new Date(expiration).toDateString();
  const board = market
    ?.liveBoards()
    .find(
      (board) =>
        new Date(board.expiryTimestamp * 1000).toDateString() ===
        expirationDate,
    );

  return board?.strikes().find(({ strikePrice }) => {
    return strikePrice.div((1e18).toString()).toString() === strike.toString();
  });
};

const getMarketData = (market: Market, chain: CHAINS) => {
  // TODO: set global rate varibale for IV and greeks
  // const rate = market.__marketData.marketParameters.greekCacheParams.rateAndCarry ?? 5;

  const options = market.liveBoards().map((board) => {
    const expiration = board.expiryTimestamp * 1000;
    const term = getExpirationTerm(expiration);

    return board.strikes().map<OptionsMap | undefined>((strike) => {
      const strikePrice = parseFloat(strike.strikePrice.toString()) / 1e18;
      const one = BigNumber.from(10).pow(18);

      const { callBid, callAsk, putBid, putAsk } = strike.quoteAllSync(one);
      const quotes = [callAsk, callBid, putAsk, putBid];

      if (quotes.every((val) => val.isDisabled)) return;

      const [callBuyPrice, callSellPrice, putBuyPrice, putSellPrice] =
        quotes.map(parsePrice);

      const instrumentMeta = {
        strike: strikePrice,
        term,
        expiration,
        provider: chainLyraProvider[chain],
      };

      return {
        ...instrumentMeta,
        [OptionType.CALL]: {
          ...instrumentMeta,
          type: OptionType.CALL,
          askPrice: callBuyPrice,
          bidPrice: callSellPrice,
          midPrice: (callBuyPrice + callSellPrice) / 2,
        },
        [OptionType.PUT]: {
          ...instrumentMeta,
          type: OptionType.PUT,
          askPrice: putBuyPrice,
          bidPrice: putSellPrice,
          midPrice: (putBuyPrice + putSellPrice) / 2,
        },
      };
    });
  });

  return options?.flat(2).filter(Boolean) as OptionsMap[];
};

export const useLyraRates = (chain: CHAINS): [undefined | OptionsMap[]] => {
  const [market] = useLyraMarket(chain);
  const options = useMemo(
    // @ts-ignore
    () => (market ? getMarketData(market, chain) : undefined),
    [market, chain],
  );

  return [options];
};

const mapPositions =
  (chain: CHAINS) =>
  (positions: Position[]): ActivePosition[] => {
    return positions.map((pos) => {
      const currentPrice = pos.pricePerOption;
      const { liquidationPrice, isBase } = pos.collateral ?? {};
      const {
        realizedPnl,
        unrealizedPnl,
        settlementPnl,
        realizedPnlPercentage,
        settlementPnlPercentage,
        unrealizedPnlPercentage,
      } = pos.pnl();
      const pnl = pos.isOpen
        ? unrealizedPnl
        : pos.isSettled
        ? settlementPnl
        : realizedPnl;
      const pnlPercentage = pos.isOpen
        ? unrealizedPnlPercentage
        : pos.isSettled
        ? settlementPnlPercentage
        : realizedPnlPercentage;

      const collateral =
        !pos.isLong && (+(pos.collateral?.amount ?? 0) as number) / 1e18;

      return {
        provider: chainLyraProvider[chain],
        id: pos.id,
        strike: +pos.strikePrice / 1e18,
        size: +pos.size,
        expiration: pos.expiryTimestamp * 1000,
        collateral: pos.collateral && +pos.collateral?.amount / 1e18,
        isOpen: pos.isOpen,
        isCall: pos.isCall,
        isLong: pos.isLong,
        isSettled: pos.isSettled,
        isBaseCollateral: pos.market().baseToken.symbol,
        liquidationPrice: liquidationPrice
          ? +liquidationPrice / 1e18
          : undefined,
        numTrades: pos.trades().length,
        currentPrice: +currentPrice / 1e18,
        equity: fromBigNumber(
          pos.isLong
            ? pos.pricePerOption.mul(pos.size).div(UNIT)
            : pos.collateral?.value ?? ZERO_BN,
        ),
        avgPrice: +pos.averageCostPerOption() / 1e18,
        pnl: +pnl / 1e18,
        pnlPercent: +pnlPercentage / 1e18,
      };
    });
  };

export const useLyraPositions = (
  chain: CHAINS,
): [ActivePosition[], boolean] => {
  const { address } = useAccount();
  const { data = [], isLoading } = useQuery(
    ["lyra-positions", address, chain],
    () =>
      chainLyraInstances[chain]
        .openPositions(address as string)
        .then(mapPositions(chain)),
    { enabled: Boolean(address), staleTime: 30000 },
  );

  return [data, isLoading];
};
