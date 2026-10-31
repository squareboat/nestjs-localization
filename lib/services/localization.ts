import { Injectable, Inject } from "@nestjs/common";
import { CONFIG_OPTIONS } from "../constants";
import get from "../utils/get";
import { replaceAll } from "../helpers";
import { readdirSync, readFileSync } from "fs";
import { LocalizationOptions } from "../interfaces";

@Injectable()
export class LocalizationService {
  private static data: Record<string, any>;
  private static fallbackLang: string;

  constructor(@Inject(CONFIG_OPTIONS) private options: LocalizationOptions) {
    const { path, fallbackLang } = this.options;
    const data: Record<string, any> = {};

    LocalizationService.readFiles(
      path,
      function (filename: string, content: any) {
        data[filename.split(".")[0]] = JSON.parse(content);
      }
    );

    LocalizationService.data = data;
    LocalizationService.fallbackLang = fallbackLang;
  }

  static trans(
    key: string,
    language?: string | Record<string, any>,
    options?: Record<string, any>
  ): string {
    let langData = LocalizationService.data[this.fallbackLang];
    if (typeof language === "string" && language != "") {
      langData = LocalizationService.data[language];
    } else {
      options = language as Record<string, any>;
    }

    let text = get(langData, key, null);
    if (!text || typeof text !== "string") return `ERR::INVALID KEY ==> ${key}`;

    if (options) text = this.replacePlaceholders(text, options);

    return text;
  }

  static transChoice(
    key: string,
    language?: string | number,
    count?: number | Record<string, any>,
    options?: Record<string, any>
  ): string {
    let langData = LocalizationService.data[this.fallbackLang];
    if (typeof language === "string" && language != "") {
      langData = LocalizationService.data[language];
    }

    if (typeof count === "object") {
      options = count as Record<string, any>;
    }

    if (typeof language === "number") {
      count = language as number;
    }

    if (!count && count != 0) throw new Error("Count value not found");

    let text = get(langData, key, null);
    if (!text || typeof text !== "string") return `ERR::INVALID KEY ==> ${key}`;

    const textObjArr: Record<string, any>[] = [];
    text.split("|").forEach((t) => {
      textObjArr.push(this.choiceStringParser(t));
    });

    let finalText = "";
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

    if (finalText && finalText.match(/\bcount\b/i)) {
      options = { ...options, count };
    }

    if (options) finalText = this.replacePlaceholders(finalText, options);

    return finalText ? finalText : `ERR::INVALID COUNT ==> ${count}`;
  }

  private static choiceStringParser(t: string): Record<string, any> {
    const limits: string[] = t.match(/\[(.*?)\]/)![1].split(",");

    return {
      text: replaceAll(t, /\[.*?\]/, "").trim(),
      limit: {
        lower: limits[0] === "*" ? Number.NEGATIVE_INFINITY : +limits[0],
        upper: limits[1]
          ? limits[1] === "*"
            ? Number.POSITIVE_INFINITY
            : +limits[1]
          : +limits[0],
      },
    };
  }

  /**
   * Replace every `:key` placeholder in one pass. Longer keys are tried first,
   * so `:names` is not read as `:name` + "s", while `:widthpx` still becomes
   * the width followed by "px". The placeholder's case decides the value's
   * case: `:NAME` upper-cases it, `:Name` capitalises it, any other casing
   * keeps it as passed (#4). Keys whose value is undefined are left as is.
   */
  private static replacePlaceholders(text: string, options: Record<string, any>): string {
    const keys = Object.keys(options)
      .filter((k) => k !== "" && options[k] !== undefined)
      .sort((a, b) => b.length - a.length);
    if (!keys.length) return text;

    const byLowerCase = new Map<string, string>();
    for (const k of keys) {
      if (!byLowerCase.has(k.toLowerCase())) byLowerCase.set(k.toLowerCase(), k);
    }

    const pattern = new RegExp(`:(${keys.map(escapeRegExp).join("|")})`, "gi");
    return text.replace(pattern, (_placeholder, written: string) => {
      const key = written in options ? written : byLowerCase.get(written.toLowerCase())!;
      const value = String(options[key]);
      const hasLetters = written !== written.toLowerCase();
      if (hasLetters && written === written.toUpperCase()) return value.toUpperCase();
      if (written[0] !== written[0].toLowerCase()) {
        return value.charAt(0).toUpperCase() + value.slice(1);
      }
      return value;
    });
  }

  private static readFiles(dirname: string, onFileContent: any) {
    const fss = readdirSync(dirname);
    fss.forEach((filename: string) => {
      const fileData = readFileSync(dirname + "/" + filename, {
        encoding: "utf-8",
      });
      onFileContent(filename, fileData);
    });
  }
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
