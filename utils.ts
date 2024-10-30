import { METRIC_NAME_PREFIX } from "./constants";

export const getName = (name: string): string => {
  return `${METRIC_NAME_PREFIX}_${name}`;
};