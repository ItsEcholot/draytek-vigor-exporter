import { METRIC_NAME_PREFIX } from "./constants";

export const getName = (name: string): string => {
  return `${METRIC_NAME_PREFIX}_${name}`;
};

export const getStatusVariable = (
  variable: string,
  payload: string,
): string => {
  const match = payload.match(new RegExp(`${variable}\\s*:\\s*(.*?)\\s`));
  if (match) {
    return match[1];
  }
  return '';
};

export const getStatusVariableNumber = (
  variable: string,
  payload: string
): number => {
  return parseInt(getStatusVariable(variable, payload));
};