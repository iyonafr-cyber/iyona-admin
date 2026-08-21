import type { AdminModel, ModelProvider } from "../../services/features/admin/ModelsService";

/**
 * Display order for provider groups. Explicit rather than alphabetical so the
 * grouping stays put if a provider is ever added whose name would sort into
 * the middle.
 */
export const PROVIDER_ORDER: ReadonlyArray<ModelProvider> = [
  "anthropic",
  "google",
  "openai",
];

export const PROVIDER_LABELS: Record<ModelProvider, string> = {
  anthropic: "Anthropic",
  google: "Google",
  openai: "OpenAI",
};

const providerRank = (p: ModelProvider): number => {
  const i = PROVIDER_ORDER.indexOf(p);
  // Unknown providers sort last rather than first, so a new one is visible
  // at the bottom instead of silently displacing Anthropic.
  return i === -1 ? PROVIDER_ORDER.length : i;
};

/**
 * Recency key derived from the model id, used only when the provider gave us
 * no `releasedAt` — Google never does, and rows added before that column
 * existed won't have one until the next catalog refresh.
 *
 * Two shapes carry recency in practice:
 *   - a dated suffix: `claude-opus-4-5-20251101`, `gpt-5.5-pro-2026-04-23`
 *   - a version run:  `claude-opus-5` > `claude-opus-4-8` > `claude-opus-4-7`
 *
 * Returns a number that is only meaningful *relative to other ids of the same
 * family*, which is all we need — it is a tiebreak within one provider group,
 * never a cross-provider comparison.
 */
export function idRecencyKey(modelId: string): number {
  const compact = modelId.match(/(\d{4})(\d{2})(\d{2})\b/);
  if (compact) {
    return Number(`${compact[1]}${compact[2]}${compact[3]}`);
  }
  const dashed = modelId.match(/(\d{4})-(\d{2})-(\d{2})\b/);
  if (dashed) {
    return Number(`${dashed[1]}${dashed[2]}${dashed[3]}`);
  }

  // Version run: first number is the major, the next (if any) the minor.
  // `gpt-5.5-pro` -> 5.5, `claude-opus-4-8` -> 4.8, `gemini-3-1-high` -> 3.1
  const version = modelId.match(/(\d+)(?:[.-](\d+))?/);
  if (version) {
    const major = Number(version[1]);
    const minor = version[2] ? Number(version[2]) : 0;
    return major + minor / 100;
  }
  return 0;
}

const releasedMs = (m: AdminModel): number | null => {
  if (!m.releasedAt) return null;
  const t = new Date(m.releasedAt).getTime();
  return Number.isNaN(t) ? null : t;
};

/**
 * Group by provider (Anthropic → Google → OpenAI), newest model first inside
 * each group.
 *
 * Rows carrying a real provider `releasedAt` always outrank rows without one,
 * so a dated model never sorts below a guess. Undated rows fall back to
 * {@link idRecencyKey}, then to display name for a stable final order.
 */
export function sortModels(models: AdminModel[]): AdminModel[] {
  return [...models].sort((a, b) => {
    const byProvider = providerRank(a.provider) - providerRank(b.provider);
    if (byProvider !== 0) return byProvider;

    const ra = releasedMs(a);
    const rb = releasedMs(b);
    if (ra !== null && rb !== null && ra !== rb) return rb - ra;
    if (ra !== null && rb === null) return -1;
    if (ra === null && rb !== null) return 1;

    const ka = idRecencyKey(a.modelId);
    const kb = idRecencyKey(b.modelId);
    if (ka !== kb) return kb - ka;

    return (a.displayName || a.modelId).localeCompare(b.displayName || b.modelId);
  });
}

/**
 * Lifecycle state of a catalog row, as far as this page is concerned.
 *
 * `deprecated` outranks the enabled flag deliberately: once the backend has
 * stamped `deprecatedAt`, the router refuses the model and the user picker
 * drops it, so an `enabled` deprecated row is not "on" in any sense a reader
 * would expect — it is blocked.
 */
export type ModelStatus = "active" | "inactive" | "deprecated";

export const MODEL_STATUS_FILTERS = [
  "active",
  "inactive",
  "deprecated",
  "all",
] as const;

export type ModelStatusFilter = (typeof MODEL_STATUS_FILTERS)[number];

export function modelStatus(model: AdminModel): ModelStatus {
  if (model.deprecatedAt) return "deprecated";
  return model.enabled ? "active" : "inactive";
}
