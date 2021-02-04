export const isUpperCase = (value: string): boolean => {
  return value.toUpperCase() === value;
};

export const isSentenceCase = (value: string): boolean => {
  return value[0].toUpperCase() === value[0];
};

export const isLowerCase = (value: string): boolean => {
  return value.toLowerCase() === value;
};
