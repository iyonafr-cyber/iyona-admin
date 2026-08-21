import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/button/Button";
import { useAsync } from "../../hooks/useAsync";
import {
  TaskRoutesService,
  type RouterTaskName,
  type TaskRoute,
} from "../../services/features/admin/TaskRoutesService";
import {
  ModelsService,
  type AdminModel,
} from "../../services/features/admin/ModelsService";
import { ToastService } from "../../services/toast";
import { getApiErrorMessage } from "../../api/getApiErrorMessage";

/** Local edit buffer — a row is only PATCHed when the admin hits Save. */
interface Draft {
  primaryModelId: string;
  fallbackModelIds: string[];
  enforce: boolean;
  enabled: boolean;
}

const toDraft = (route: TaskRoute): Draft => ({
  primaryModelId: route.primaryModelId ?? "",
  fallbackModelIds: [...route.fallbackModelIds],
  enforce: route.enforce,
  enabled: route.enabled,
});

const isDirty = (route: TaskRoute, draft: Draft) =>
  draft.primaryModelId !== (route.primaryModelId ?? "") ||
  draft.enforce !== route.enforce ||
  draft.enabled !== route.enabled ||
  draft.fallbackModelIds.join("|") !== route.fallbackModelIds.join("|");

const TaskRoutesPage = () => {
  const { t } = useTranslation("admin");
  const {
    data: routes,
    loading,
    reload,
  } = useAsync(() => TaskRoutesService.list(), []);
  const { data: models, reload: reloadModels } = useAsync(
    () => ModelsService.list(),
    [],
  );
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [savingDefault, setSavingDefault] = useState(false);

  /**
   * The global "Auto" default — one layer below task routes in the router's
   * precedence, and reached whenever a task has no route or its whole chain
   * is unavailable. It lives here rather than on the Models grid because it
   * is a routing decision, and having it in two places made it read like a
   * per-model attribute.
   */
  const currentDefault = (models ?? []).find((m) => m.isDefault)?.modelId ?? "";

  const saveDefault = async (modelId: string) => {
    if (!modelId || modelId === currentDefault) return;
    try {
      setSavingDefault(true);
      await ModelsService.update(modelId, { isDefault: true });
      ToastService.success(t("common.saved"));
      reload();
      reloadModels();
    } catch (err) {
      ToastService.error(getApiErrorMessage(err, t("common.failed")));
    } finally {
      setSavingDefault(false);
    }
  };

  /** Enabled coding-capable models, grouped by provider for the selects. */
  const grouped = useMemo(() => {
    const enabled = (models ?? []).filter((m) => m.enabled);
    const byProvider = new Map<string, AdminModel[]>();
    for (const m of enabled) {
      const list = byProvider.get(m.provider) ?? [];
      list.push(m);
      byProvider.set(m.provider, list);
    }
    for (const list of byProvider.values()) {
      list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    return Array.from(byProvider.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );
  }, [models]);

  const draftFor = (route: TaskRoute): Draft =>
    drafts[route.task] ?? toDraft(route);

  const patchDraft = (route: TaskRoute, patch: Partial<Draft>) =>
    setDrafts((prev) => ({
      ...prev,
      [route.task]: { ...draftFor(route), ...patch },
    }));

  const save = async (route: TaskRoute) => {
    const draft = draftFor(route);
    try {
      setSaving(route.task);
      await TaskRoutesService.update(route.task as RouterTaskName, {
        primaryModelId: draft.primaryModelId || null,
        fallbackModelIds: draft.fallbackModelIds,
        enforce: draft.enforce,
        enabled: draft.enabled,
      });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[route.task];
        return next;
      });
      ToastService.success(t("common.saved"));
      reload();
    } catch (err) {
      ToastService.error(getApiErrorMessage(err, t("common.failed")));
    } finally {
      setSaving(null);
    }
  };

  const modelSelect = (
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
    exclude: string[] = [],
  ) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
    >
      <option value="">{placeholder}</option>
      {grouped.map(([provider, list]) => (
        <optgroup key={provider} label={provider}>
          {list
            .filter((m) => !exclude.includes(m.modelId) || m.modelId === value)
            .map((m) => (
              <option key={m.modelId} value={m.modelId}>
                {m.displayName}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  );

  const resolvedBadge = (route: TaskRoute) => {
    if (!route.effectiveModelId) {
      return <Badge tone="danger">{t("taskRoutes.resolved.none")}</Badge>;
    }
    const tone =
      route.effectiveSource === "taskRoutePrimary"
        ? "success"
        : route.effectiveSource === "taskRouteFallback"
          ? "warning"
          : "info";
    return (
      <Badge tone={tone}>
        {t(`taskRoutes.source.${route.effectiveSource}`)} ·{" "}
        {route.effectiveModelId}
      </Badge>
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">{t("taskRoutes.title")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          {t("taskRoutes.subtitle")}
        </p>
      </div>

      {loading && (
        <Card>
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        </Card>
      )}

      <Card
        title={t("taskRoutes.globalDefault.title", {
          defaultValue: 'Global default ("Auto")',
        })}
      >
        <div className="space-y-2 text-sm">
          <p className="text-xs text-muted-foreground">
            {t("taskRoutes.globalDefault.hint", {
              defaultValue:
                "Used when a task has no route, or when every model in its chain is unavailable. Task routes above take precedence.",
            })}
          </p>
          <div className="max-w-md">
            {modelSelect(
              currentDefault,
              (v) => void saveDefault(v),
              t("taskRoutes.globalDefault.none", {
                defaultValue: "No global default",
              }),
            )}
          </div>
          {savingDefault && (
            <p className="text-xs text-muted-foreground">
              {t("common.loading")}
            </p>
          )}
        </div>
      </Card>

      {(routes ?? []).map((route) => {
        const draft = draftFor(route);
        const dirty = isDirty(route, draft);
        const chain = [draft.primaryModelId, ...draft.fallbackModelIds].filter(
          Boolean,
        );

        return (
          <Card
            key={route.task}
            title={
              <span className="flex items-center gap-2">
                <span className="font-mono text-sm">{route.task}</span>
                {route.enforce && (
                  <Badge tone="primary">{t("taskRoutes.enforced")}</Badge>
                )}
                {!route.enabled && (
                  <Badge tone="neutral">{t("taskRoutes.disabled")}</Badge>
                )}
              </span>
            }
            actions={resolvedBadge(route)}
          >
            <p className="mb-4 text-xs text-muted-foreground">
              {route.description}
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium">
                  {t("taskRoutes.primary")}
                </label>
                {modelSelect(
                  draft.primaryModelId,
                  (v) =>
                    patchDraft(route, {
                      primaryModelId: v,
                      // A model can't be both primary and a fallback.
                      fallbackModelIds: draft.fallbackModelIds.filter(
                        (id) => id !== v,
                      ),
                    }),
                  t("taskRoutes.notConfigured"),
                  draft.fallbackModelIds,
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium">
                  {t("taskRoutes.fallbacks")}
                </label>
                <div className="space-y-2">
                  {draft.fallbackModelIds.map((id, index) => (
                    <div key={`${id}-${index}`} className="flex items-center gap-1">
                      {modelSelect(
                        id,
                        (v) => {
                          const next = [...draft.fallbackModelIds];
                          next[index] = v;
                          patchDraft(route, { fallbackModelIds: next });
                        },
                        t("taskRoutes.pickModel"),
                        chain.filter((c) => c !== id),
                      )}
                      <button
                        type="button"
                        aria-label={t("taskRoutes.moveUp")}
                        disabled={index === 0}
                        onClick={() => {
                          const next = [...draft.fallbackModelIds];
                          [next[index - 1], next[index]] = [
                            next[index],
                            next[index - 1],
                          ];
                          patchDraft(route, { fallbackModelIds: next });
                        }}
                        className="rounded border border-border p-1 disabled:opacity-30"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        aria-label={t("taskRoutes.moveDown")}
                        disabled={index === draft.fallbackModelIds.length - 1}
                        onClick={() => {
                          const next = [...draft.fallbackModelIds];
                          [next[index], next[index + 1]] = [
                            next[index + 1],
                            next[index],
                          ];
                          patchDraft(route, { fallbackModelIds: next });
                        }}
                        className="rounded border border-border p-1 disabled:opacity-30"
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        type="button"
                        aria-label={t("taskRoutes.remove")}
                        onClick={() =>
                          patchDraft(route, {
                            fallbackModelIds: draft.fallbackModelIds.filter(
                              (_, i) => i !== index,
                            ),
                          })
                        }
                        className="rounded border border-border p-1"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {draft.fallbackModelIds.length < 5 && (
                    <button
                      type="button"
                      onClick={() =>
                        patchDraft(route, {
                          fallbackModelIds: [...draft.fallbackModelIds, ""],
                        })
                      }
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Plus size={12} />
                      {t("taskRoutes.addFallback")}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {route.candidates.some((c) => !c.available) && (
              <div className="mt-4 space-y-1 rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
                {route.candidates
                  .filter((c) => !c.available)
                  .map((c) => (
                    <p key={c.modelId} className="text-xs">
                      <span className="font-mono">{c.modelId}</span> —{" "}
                      {t(`taskRoutes.reason.${c.reason}`)}
                    </p>
                  ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={draft.enforce}
                    onChange={(e) =>
                      patchDraft(route, { enforce: e.target.checked })
                    }
                  />
                  <span title={t("taskRoutes.enforceHint")}>
                    {t("taskRoutes.enforceLabel")}
                  </span>
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={draft.enabled}
                    onChange={(e) =>
                      patchDraft(route, { enabled: e.target.checked })
                    }
                  />
                  <span>{t("taskRoutes.enabledLabel")}</span>
                </label>
              </div>
              <Button
                onClick={() => void save(route)}
                disabled={!dirty || saving === route.task}
              >
                {saving === route.task ? t("common.saving") : t("common.save")}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default TaskRoutesPage;
