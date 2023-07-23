import { useMemo } from "react";
import { OptionsMap } from "@/util/types";
import * as _ from "lodash";
import moment from "moment";

export const useExpirations = (
  baseRates?: OptionsMap[],
  minDays = 0,
  maxMonths = 3,
) => {
  const currentDate = moment(new Date());

  return useMemo<[string, number][]>(
    () =>
      _.chain(baseRates)
        .uniqBy("term")
        .sortBy("expiration")
        .filter(({ term, expiration }) => {
          const momentExpiration = moment(expiration);
          const duration = moment.duration(momentExpiration.diff(currentDate));
          const monthsPassed = duration.asMonths();
          const daysPassed = duration.asDays();

          return monthsPassed <= maxMonths && daysPassed > minDays;
        })
        .map(
          ({ term, expiration }) =>
            [term, +moment(expiration).set("hour", 8)] as [string, number],
        )
        .value(),
    [baseRates?.length],
  );
};
export type Strikes = {
  allStrikes?: number[];
  callStrikes?: number[];
  putStrikes?: number[];
  basePrice?: number;
};

export const STRIKE_CUTOFF = 1.4;

export const useStrikes = (): Strikes => {
  const basePrice = 1890;
  const rounding = 100;
  // Call : 0.8x spot -> 2x spot
  // Put : 0.5x spot -> 1.2x spot
  return useMemo(() => {
    if (!basePrice) return {};

    const roundedBase = Math.floor(basePrice / rounding) * rounding;
    const callStart = Math.ceil((roundedBase * 0.9) / rounding) * rounding;
    const callEnd = roundedBase * STRIKE_CUTOFF;
    const putStart =
      Math.ceil(roundedBase / STRIKE_CUTOFF / rounding) * rounding;
    const putEnd = Math.floor((roundedBase * 1.1) / rounding) * rounding;

    const callStrikes: number[] = [];
    const putStrikes: number[] = [];
    const allStrikes: number[] = [];

    for (let i = callStart; i <= callEnd; i += rounding) callStrikes.push(i);
    for (let i = putStart; i <= putEnd; i += rounding) putStrikes.push(i);
    for (let i = putStart; i <= callEnd; i += rounding) allStrikes.push(i);

    return { allStrikes, callStrikes, putStrikes, basePrice };
  }, [basePrice]);
};
