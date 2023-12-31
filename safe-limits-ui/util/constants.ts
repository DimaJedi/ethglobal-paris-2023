import {BigNumber} from "@ethersproject/bignumber";

export const ZERO_BN = BigNumber.from(0)
export const MAX_BN = BigNumber.from(2).pow(256).sub(1)
export const MIN_BN = BigNumber.from(2).pow(128).sub(1).mul(-1)
export const UNIT = BigNumber.from(10).pow(18)
export const ONE_BN = BigNumber.from(1).mul(UNIT)

export enum CHAINS {
    ARB = "ARB",
    OP = "OP",
}