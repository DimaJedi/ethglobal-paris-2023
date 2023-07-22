import { BigNumber } from "@ethersproject/bignumber";

export enum BuySellModes {
  BUY = "Buy",
  SELL = "Sell",
}

export const DealsFields: Record<BuySellModes, "askPrice" | "bidPrice"> = {
  [BuySellModes.BUY]: "askPrice",
  [BuySellModes.SELL]: "bidPrice",
};

export enum ProviderType {
  LYRA_OP = "LYRA_OP",
  LYRA_ARB = "LYRA_ARB",
  DERIBIT = "DERIBIT",
  PREMIA_OP = "PREMIA_OP",
  PREMIA_ARB = "PREMIA_ARB",
  HEGIC = "HEGIC",
  SYNQUOTE = "SYNQUOTE",
  BYBIT = "BYBIT",
}

export enum OptionType {
  CALL = "CALL",
  PUT = "PUT",
}

export type InstrumentMeta = {
  askPrice?: number;
  bidPrice?: number;
  midPrice?: number;
  provider: ProviderType;
  expiration: number;
  term: string;
  strike: number;
};

export type Instrument = {
  type: OptionType;
  askPrice?: number;
  bidPrice?: number;
  midPrice?: number;
} & InstrumentMeta;

export type CallOption = Instrument & { type: OptionType.CALL };
export type PutOption = Instrument & { type: OptionType.PUT };

export type InstrumentCouple = {
  [OptionType.CALL]?: CallOption;
  [OptionType.PUT]?: PutOption;
};

export type OptionsMap = InstrumentMeta & InstrumentCouple;

export enum Underlying {
  ETH = "ETH",
  BTC = "BTC",
}

export type DealPart = { price: number; provider: ProviderType };
export type Deal = Pick<OptionsMap, "term" | "strike"> & {
  amount: number;
  expiration: number;
  type: OptionType;
  buy: Instrument;
  sell: Instrument;
};

export type PositionCollateral = {
  amount: BigNumber
  // value: BigNumber
  // min: BigNumber
  // max: BigNumber | null
  // isBase: boolean
  // liquidationPrice: BigNumber | null
}


export type ActivePosition = {
  provider: ProviderType;
  id: number;
  strike: number;
  size: number;
  expiration: number;
  isOpen: boolean;
  isCall: boolean;
  isLong: boolean;
  isSettled: boolean;
  numTrades: number;
  avgPrice: number;
  currentPrice: number;
  collateral?: number;
  isBaseCollateral?: string;
  equity?: number;
  pnl: number;
  pnlPercent: number;
  liquidationPrice?: number;
  // realizedPnl: number;
  // realizedPnlPercent: number;
  // unrealizedPnl: number;
  // unrealizedPnlPercent: number;
};

export type Greeks = {
  delta: number;
  gamma: number;
  iv: number;
  theta: number;
  vega: number;
};
export type PositionWithGreeks = {
  position: ActivePosition;
  greeks: Greeks;
  instrument: OptionsMap;
};
