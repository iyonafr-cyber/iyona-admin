export type LanguageCode = "en" | "fr";

/**
 * ISO 3166-1 alpha-2 country codes where French is an official /
 * predominant day-to-day language. Conservative list — we only flip
 * the default to French when we're confident the user will expect it.
 */
const FRENCH_COUNTRIES: ReadonlySet<string> = new Set([
    "FR", // France
    "MC", // Monaco
    "LU", // Luxembourg
    "BE", // Belgium (bilingual, but French is dominant in Wallonia/Brussels)
    "CH", // Switzerland (one of four official; serves French-speaking cantons)
    "CI", // Côte d'Ivoire
    "SN", // Senegal
    "ML", // Mali
    "BF", // Burkina Faso
    "NE", // Niger
    "TG", // Togo
    "BJ", // Benin
    "CG", // Republic of the Congo
    "CD", // Democratic Republic of the Congo
    "GA", // Gabon
    "CM", // Cameroon
    "MG", // Madagascar
    "DJ", // Djibouti
    "KM", // Comoros
    "HT", // Haiti
    "GN", // Guinea
    "CF", // Central African Republic
    "TD", // Chad
    "BI", // Burundi
    "RW", // Rwanda
    "SC", // Seychelles
    "VU", // Vanuatu
    "GQ", // Equatorial Guinea
    "PF", // French Polynesia
    "NC", // New Caledonia
    "GP", // Guadeloupe
    "MQ", // Martinique
    "GF", // French Guiana
    "RE", // Réunion
    "YT", // Mayotte
    "WF", // Wallis and Futuna
    "PM", // Saint Pierre and Miquelon
    "BL", // Saint Barthélemy
    "MF", // Saint Martin (French part)
]);

/** Map an ISO country code to the language we want as default. */
export const languageForCountry = (country: string | null | undefined): LanguageCode =>
    country && FRENCH_COUNTRIES.has(country.toUpperCase()) ? "fr" : "en";

/**
 * Synchronous best-effort pick from the browser's own locale list.
 * Runs instantly at boot; no network. Guaranteed to never throw.
 */
export const detectLanguageFromBrowser = (): LanguageCode => {
    if (typeof navigator === "undefined") return "en";
    const tags: string[] = [];
    if (Array.isArray(navigator.languages)) tags.push(...navigator.languages);
    if (navigator.language) tags.push(navigator.language);
    for (const tag of tags) {
        const primary = tag.toLowerCase().split("-")[0];
        if (primary === "fr") return "fr";
        if (primary === "en") return "en";
    }
    return "en";
};

/**
 * Look up the caller's country via a free IP-geolocation endpoint and
 * translate that to our `LanguageCode`. Bails out quietly (returns
 * `null`) on any failure — caller should fall back to the browser
 * locale guess.
 *
 * Uses `get.geojs.io` which is CORS-friendly, requires no API key, and
 * only returns the country code so there's no PII involved.
 */
export const detectLanguageFromIP = async (
    timeoutMs = 2500,
): Promise<LanguageCode | null> => {
    if (typeof fetch === "undefined") return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch("https://get.geojs.io/v1/ip/country.json", {
            signal: controller.signal,
            // Keep this cheap and cacheable by the browser.
            cache: "force-cache",
        });
        if (!res.ok) return null;
        const json = (await res.json()) as { country?: string };
        return languageForCountry(json?.country);
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
};

export interface DetectedLanguageResult {
    language: LanguageCode;
    source: "ip" | "browser";
}

/**
 * Full auto-detect pipeline (no storage lookup). Tries IP first, then
 * falls back to the browser locale. Always resolves — never throws.
 */
export const detectPreferredLanguage = async (): Promise<DetectedLanguageResult> => {
    const fromIp = await detectLanguageFromIP();
    if (fromIp) return { language: fromIp, source: "ip" };
    return { language: detectLanguageFromBrowser(), source: "browser" };
};
