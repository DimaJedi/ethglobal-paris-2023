import moment from "moment";
import { getAddress } from "ethers/lib/utils";

export const getExpirationTerm = (expiration: number) => {
  const term = moment(expiration).format("DDMMMYY").toUpperCase();

  return term.startsWith("0") ? term.slice(1) : term;
};

export function isAddress(value: any): string | false {
  try {
    return getAddress(value);
  } catch {
    return false;
  }
}
// shorten the checksummed version of the input address to have 0x + 4 characters at start and end
export function shortenAddress(address: string, chars = 4): string {
  const parsed = isAddress(address);
  if (!parsed) {
    // throw Error(`Invalid 'address' parameter '${address}'.`);
    return "";
  }
  return `${parsed.substring(0, chars)}...${parsed.substring(42 - chars)}`;
}
