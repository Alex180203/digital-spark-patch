import { ro } from "./ro";
import { en } from "./en";
import { hu } from "./hu";
import { de } from "./de";
import type { Language } from "../branding";

export type Translations = typeof ro;

export const translations: Record<Language, Translations> = {
  ro,
  en,
  hu,
  de,
};

export { ro, en, hu, de };
