import moment from "moment";

export const getExpirationTerm = (expiration: number) => {
    const term = moment(expiration).format("DDMMMYY").toUpperCase();

    return term.startsWith("0") ? term.slice(1) : term;
};
