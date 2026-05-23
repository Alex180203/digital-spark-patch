import { brandRo } from "./ro";
import { brandEn } from "./en";
import { brandHu } from "./hu";
import { brandDe } from "./de";

export type Brand = typeof brandRo;
export type Language = "ro" | "en" | "hu" | "de";

export const branding: Record<Language, Brand> = {
  ro: brandRo,
  en: brandEn,
  hu: brandHu,
  de: brandDe,
};

export { brandRo, brandEn, brandHu, brandDe };
