import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import frCommon from "./locales/fr/common.json";
import enAdmin from "./locales/en/admin.json";
import frAdmin from "./locales/fr/admin.json";

export const resources = {
  en: {
    translation: enAdmin,
    common: enCommon,
    admin: enAdmin,
  },
  fr: {
    translation: frAdmin,
    common: frCommon,
    admin: frAdmin,
  },
} as const;

export const supportedLanguages = ["en", "fr"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

void i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  supportedLngs: supportedLanguages as unknown as string[],
  defaultNS: "translation",
  ns: ["translation", "common", "admin"],
  keySeparator: ".",
  nsSeparator: ":",
  returnNull: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
