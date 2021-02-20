import { Injectable, Inject } from '@nestjs/common';
import { CONFIG_OPTIONS } from '../constants';
import get from '../utils/get';
import {
  isUpperCase,
  isLowerCase,
  isSentenceCase,
  replaceAll,
} from '../helpers';
import * as fs from 'fs';
import { LocalizationOptions } from '../interfaces';

@Injectable()
export class Language {
  private static data: Record<string, any>;
  private static fallBackLang: string;
  private static caseTypes = {
    UPPER_CASE: 1,
    LOWER_CASE: 2,
    SENTENCE_CASE: 3,
    UNKNOWN: 0,
  };

  constructor(@Inject(CONFIG_OPTIONS) private options: LocalizationOptions) {
    const { path, fallBackLang } = options;
    const data: Record<string, any> = {};

    Language.readFiles(path, function (filename: string, content: any) {
      data[filename.split('.')[0]] = JSON.parse(content);
    });

    Language.data = data;
    Language.fallBackLang = fallBackLang;
  }

  static trans(
    key: string,
    language?: string | Record<string, any>,
    options?: Record<string, any>
  ): string {
    let langData = Language.data[this.fallBackLang];
    if (typeof language === 'string' && language != '') {
      langData = Language.data[language];
    } else {
      options = language as Record<string, any>;
    }

    let text = get(langData, key, null);
    if (!text || typeof text !== 'string') return `ERR::INVALID KEY ==> ${key}`;

    if (options) {
      for (const k in options) {
        text = this.handleOptions(text, k, options[k]);
      }
    }

    return text;
  }

  static transChoice(
    key: string,
    language?: string | number,
    count?: number | Record<string, any>,
    options?: Record<string, any>
  ): string {
    let langData = Language.data[this.fallBackLang];
    if (typeof language === 'string' && language != '') {
      langData = Language.data[language];
    }

    if (typeof language === 'number') {
      count = language as number;
    }

    if (typeof count === 'object') {
      options = count as Record<string, any>;
    }

    let text = get(langData, key, null);
    if (!text || typeof text !== 'string') return `ERR::INVALID KEY ==> ${key}`;

    const textObjArr: Record<string, any>[] = [];
    text.split('|').forEach((t) => {
      const limits: string[] = t.match(/\[(.*?)\]/)![1].split(',');
      textObjArr.push({
        text: replaceAll(t, /\[.*?\]/, '').trim(),
        limit: {
          lower: limits[0] === '*' ? Number.NEGATIVE_INFINITY : +limits[0],
          upper: limits[1]
            ? limits[1] === '*'
              ? Number.POSITIVE_INFINITY
              : +limits[1]
            : +limits[0],
        },
      });
    });

    let finalText = '';
    for (const t of textObjArr) {
      if (count && t.limit.upper === count && t.limit.lower === count) {
        finalText = t.text;
        break;
      }

      if (count && t.limit.upper >= count && t.limit.lower <= count) {
        finalText = t.text;
        break;
      }
    }

    if (finalText && finalText.match(/\bcount\b/)) {
      options = { ...options, count };
    }

    if (options) {
      for (const k in options) {
        finalText = this.handleOptions(finalText, k, options[k]);
      }
    }

    return finalText ? finalText : `ERR::INVALID COUNT ==> ${count}`;
  }

  private static handleOptions(text: string, key: string, value: any): string {
    // if value is a number
    if (!isNaN(+value)) return replaceAll(text, `:${key}`, value);

    // if value is a string
    let lowerCaseText = text.toLowerCase();
    const keyStartIdx = lowerCaseText.indexOf(key);
    const identifier: string = text.substr(
      keyStartIdx,
      keyStartIdx + key.length
    );

    const caseType = isUpperCase(identifier)
      ? this.caseTypes.UPPER_CASE
      : isLowerCase(identifier)
      ? this.caseTypes.LOWER_CASE
      : isSentenceCase(identifier)
      ? this.caseTypes.SENTENCE_CASE
      : this.caseTypes.UNKNOWN;

    text = replaceAll(
      text,
      `:${
        caseType === this.caseTypes.UPPER_CASE
          ? key.toUpperCase()
          : caseType === this.caseTypes.LOWER_CASE
          ? key.toLowerCase()
          : caseType === this.caseTypes.SENTENCE_CASE
          ? key[0].toUpperCase() + key.slice(1)
          : key
      }`,
      () => {
        switch (caseType) {
          case this.caseTypes.UPPER_CASE:
            return value.toUpperCase();
          case this.caseTypes.LOWER_CASE:
            return value.toLowerCase();
          case this.caseTypes.SENTENCE_CASE:
            return value[0].toUpperCase() + value.slice(1);
          default:
            return value;
        }
      }
    );
    return text;
  }

  private static readFiles(dirname: string, onFileContent: any) {
    const fss = fs.readdirSync(dirname);
    fss.forEach((filename: string) => {
      const fileData = fs.readFileSync(dirname + filename, {
        encoding: 'utf-8',
      });
      onFileContent(filename, fileData);
    });
  }
}
