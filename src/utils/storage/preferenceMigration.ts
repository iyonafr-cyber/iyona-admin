/**
 * Bucket B (rebrand): client preference keys were renamed `jarvis-*` → `iyona-*`.
 *
 * Persisted admin preferences (theme, UI language) must survive the rename —
 * renaming the key outright would reset everyone's saved choice. So we migrate on
 * read: if the new key is absent but the legacy key exists, copy it forward and
 * use it. The legacy key is left in place (harmless) for one release.
 */
export function readMigratedLocalStorage(
  newKey: string,
  legacyKey: string,
): string | null {
  try {
    const current = localStorage.getItem(newKey);
    if (current !== null) return current;

    const legacy = localStorage.getItem(legacyKey);
    if (legacy !== null) {
      try {
        localStorage.setItem(newKey, legacy);
      } catch {
        /* private mode / quota — still return the legacy value */
      }
      return legacy;
    }
  } catch {
    /* private mode / quota */
  }
  return null;
}
