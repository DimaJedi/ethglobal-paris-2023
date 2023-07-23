import { useState } from "react";
import {
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Select,
  Text,
} from "@chakra-ui/react";
import { useLyraRates } from "@/util/lyra";
import { CHAINS } from "@/util/constants";
import { useExpirations } from "@/util/hooks";
import { OptionType } from "@/util/types";

const Trade = () => {
  const [lyraRates] = useLyraRates(CHAINS.OP);
  const expirations = useExpirations(lyraRates, 1);
  const strikes =
    lyraRates?.reduce(
      (acc, instrument) => acc.add(instrument.strike),
      new Set(),
    ) ?? new Set();
  // @ts-ignore
  const strikesArray = [...strikes.values()].sort((a, b) => a - b);

  const [expiration, setExpiration] = useState(expirations?.[0]?.[1]);
  const [strike, setSrike] = useState(strikesArray?.[0] ?? 0);

  const [optionType, setOptionType] = useState(OptionType.CALL);

  return (
    <Flex flexDirection={"column"} gap={2}>
      <Flex gap={2}>
        <FormControl>
          <FormLabel>Expiration</FormLabel>
          <Select onChange={(e) => setExpiration(+e.target.value)}>
            {expirations.map(([term, expiration]) => (
              <option value={expiration}>{term}</option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Strike</FormLabel>
          <Select onChange={(e) => setSrike(+e.target.value)}>
            {strikesArray.map((strike) => (
              <option value={strike}>{strike}</option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Type</FormLabel>
          <Select onChange={(e) => setOptionType(e.target.value as OptionType)}>
            <option value={OptionType.CALL}>Call</option>
            <option value={OptionType.PUT}>Put</option>
          </Select>
        </FormControl>
      </Flex>

      <Flex gap={2}>
        <FormControl>
          <FormLabel>Market price</FormLabel>
          <Input isDisabled value={45.1}></Input>
        </FormControl>

        <FormControl>
          <FormLabel>Limit price</FormLabel>
          <Input value={40.2}></Input>
        </FormControl>
      </Flex>
      <Flex gap={2}>
        <FormControl>
          <FormLabel>Limit</FormLabel>
          <Checkbox size={"lg"} isChecked />
        </FormControl>
        <Text w={"full"} fontWeight={"semibold"}>
          Diff: -10.8%
        </Text>
      </Flex>
      {/*TODO propose tx to safe*/}
      <Button>Sign limit order</Button>
    </Flex>
  );
};

export default Trade;
