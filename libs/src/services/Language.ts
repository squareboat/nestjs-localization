import { Injectable, Inject } from '@nestjs/common';
import { CONFIG_OPTIONS } from '../constants';
import get from '../utils/get';
import { isUpperCase, isLowerCase, isSentenceCase } from '../helpers';
import * as fs from 'fs';

@Injectable()
export class Language {
  private static data;

  constructor(@Inject(CONFIG_OPTIONS) private options: { path: string }) {
    const { path } = options;
    const data = {};

    Language.readFiles(path, function (filename, content) {
      data[filename.split('.')[0]] = JSON.parse(content);
    });
    Language.data = data;
  }

  static trans(
    key: string,
    language: string,
    options?: Record<string, any>,
  ): string {
    let langData = Language.data[language];
    if (!langData) langData = Language.data['en'];

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
    language: string,
    count: number,
    options?: Record<string, any>,
  ): string {
    let langData = Language.data[language];
    if (!langData) langData = Language.data['en'];

    let text = get(langData, key, null);
    if (!text || typeof text !== 'string') return `ERR::INVALID KEY ==> ${key}`;

    const textObjArr = [];
    let texts = text.split('|');
    texts.forEach((t) => {
      const limits = t.match(/\[(.*?)\]/)[1].split(',');
      textObjArr.push({
        text: t.replace(/\[.*?\]/, '').trim(),
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
      if (t.limit.upper === count && t.limit.lower === count) {
        finalText = t.text;
        break;
      }
      if (t.limit.upper >= count && t.limit.lower <= count) {
        finalText = t.text;
        break;
      }
    }
    if (finalText && finalText.match(/^(.*?(\:count\b)[^$]*)$/)) {
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
    if (!isNaN(+value)) return text.replace(`:${key}`, value);

    // if value is a string
    let lowerCaseText = text.toLowerCase();
    const keyStartIdx = lowerCaseText.indexOf(key);
    const identifier: string = text.substr(
      keyStartIdx,
      keyStartIdx + key.length,
    );

    const caseType = isUpperCase(identifier)
      ? 1
      : isLowerCase(identifier)
      ? 2
      : isSentenceCase(identifier)
      ? 3
      : 0;

    text = text.replace(
      `:${
        caseType === 1
          ? key.toUpperCase()
          : caseType === 2
          ? key.toLowerCase()
          : caseType === 3
          ? key[0].toUpperCase() + key.slice(1)
          : key
      }`,
      () => {
        switch (caseType) {
          case 1:
            return value.toUpperCase();
          case 2:
            return value.toLowerCase();
          case 3:
            return value[0].toUpperCase() + value.slice(1);
          default:
            return value;
        }
      },
    );
    return text;
  }

  private static readFiles(dirname, onFileContent) {
    const fss = fs.readdirSync(dirname);
    fss.forEach((filename) => {
      const fileData = fs.readFileSync(dirname + filename, {
        encoding: 'utf-8',
      });
      onFileContent(filename, fileData);
    });
  }
}
