import type { CursorAgentModel } from "../services/features/admin/SettingsService";

/**
 * Group Cursor's model catalogue for the coding-model picker.
 *
 * Cursor's GET /v1/models returns no price, tier or cost field — only ids,
 * display names and parameters. So these buckets are a heuristic over model
 * FAMILY, not authoritative pricing, and the labels say "typically" for that
 * reason. Check Cursor's own pricing before treating a bucket as a bill.
 *
 * The one hard guarantee: every model in the catalogue lands in exactly one
 * group. Cursor ships new models often, and a model that matched no rule and
 * silently vanished from the dropdown would be unselectable — so unmatched ids
 * fall through to "Other" rather than being dropped.
 */

export interface ModelGroup {
  label: string;
  models: CursorAgentModel[];
}

/** Cursor-native / bundled tiers: Auto, Composer, and Cursor's Grok builds. */
const isCursorNative = (id: string): boolean =>
  id === "default" || /^(composer|grok)/i.test(id);

/**
 * Small, fast variants — the cheap end of each vendor's line-up.
 *
 * `mini` and `nano` are matched as hyphen-delimited SEGMENTS, not substrings:
 * "gemini" contains "mini", so a bare /mini/ files every Gemini model
 * (including gemini-3.1-pro, a flagship) under economical.
 */
const isEconomical = (id: string): boolean =>
  /(^|-)(mini|nano)(-|$)/i.test(id) || /(flash|haiku)/i.test(id);

/** Vendor flagships — the expensive end. */
const isFrontier = (id: string): boolean =>
  /(opus|sonnet|fable|codex)/i.test(id) ||
  /(^|-)pro(-|$)/i.test(id) ||
  /^gpt-5/i.test(id);

export const CURSOR_GROUP_LABEL = "Cursor models (recommended — fastest)";
export const ECONOMICAL_GROUP_LABEL = "Economical (typically lower cost)";
export const FRONTIER_GROUP_LABEL = "Frontier (typically higher cost)";
export const OTHER_GROUP_LABEL = "Other";

/**
 * Split the catalogue into ordered groups, preserving Cursor's own ordering
 * inside each. Empty groups are omitted so the dropdown never shows a bare
 * heading.
 */
export function groupCursorModels(
  catalogue: CursorAgentModel[],
): ModelGroup[] {
  const cursor: CursorAgentModel[] = [];
  const economical: CursorAgentModel[] = [];
  const frontier: CursorAgentModel[] = [];
  const other: CursorAgentModel[] = [];

  for (const model of catalogue) {
    const id = model.id ?? "";
    // Order matters: Cursor's own builds win over the name heuristics (a
    // Cursor Grok is a Cursor model first), and "economical" is checked before
    // "frontier" so gpt-5.4-mini lands in economical, not with the flagships.
    if (isCursorNative(id)) cursor.push(model);
    else if (isEconomical(id)) economical.push(model);
    else if (isFrontier(id)) frontier.push(model);
    else other.push(model);
  }

  return [
    { label: CURSOR_GROUP_LABEL, models: cursor },
    { label: ECONOMICAL_GROUP_LABEL, models: economical },
    { label: FRONTIER_GROUP_LABEL, models: frontier },
    { label: OTHER_GROUP_LABEL, models: other },
  ].filter((group) => group.models.length > 0);
}
