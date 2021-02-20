export * from './String';
import { Language } from '../services';

export const __ = (
  key: string,
  language?: string | Record<string, any>,
  options?: Record<string, any>,
): string => {
  return Language.trans(key, language, options);
};

export const transChoice = (
  key: string,
  language?: string,
  count?: number,
  options?: Record<string, any>,
): string => {
  return Language.transChoice(key, language, count, options);
};
