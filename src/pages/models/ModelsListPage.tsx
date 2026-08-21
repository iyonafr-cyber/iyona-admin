import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Badge from "../../components/ui/Badge";
import Button from "../../components/button/Button";
import Modal from "../../components/ui/Modal";
import { useAsync } from "../../hooks/useAsync";
import {
  ModelsService,
  MODEL_CATEGORIES,
  type AdminModel,
  type ModelCategory,
  type ModelProvider,
  type ModelTier,
  type RefreshSummary,
  type UpdateModelPayload,
} from "../../services/features/admin/ModelsService";
import { ToastService } from "../../services/toast";
import { getApiErrorMessage } from "../../api/getApiErrorMessage";
import {
  sortModels,
  modelStatus,
  MODEL_STATUS_FILTERS,
  PROVIDER_LABELS,
  PROVIDER_ORDER,
  type ModelStatusFilter,
} from "./modelSort";
import {
  AiProviderKeysService,
  type AiProviderKeyHealthStatus,
} from "../../services/features/admin/AiProviderKeysService";

const ModelsListPage = () => {
  const { t } = useTranslation("admin");
  const { data, loading, reload } = useAsync(() => ModelsService.list(), []);
  const { data: providerKeys, loading: providerKeysLoading } = useAsync(
    () => AiProviderKeysService.list(),
    [],
  );
  const [editing, setEditing] = useState<AdminModel | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshSummary, setRefreshSummary] = useState<RefreshSummary | null>(
    null,
  );
  const [categoryFilter, setCategoryFilter] = useState<ModelCategory | "all">(
    "all",
  );
  // Defaults to the models that can actually serve a request. The catalog
  // grows monotonically — refresh adds every id a provider still lists,
  // including years of legacy snapshots — so showing everything by default
  // buries the handful of rows that matter under dozens that never run.
  const [statusFilter, setStatusFilter] = useState<ModelStatusFilter>("active");

  const byCategory = useMemo(() => {
    const base = sortModels(data ?? []);
    if (categoryFilter === "all") return base;
    return base.filter((m) => (m.category ?? "coding") === categoryFilter);
  }, [data, categoryFilter]);

  // Counted after the category filter so the numbers always describe the list
  // the buttons would actually produce.
  const statusCounts = useMemo(() => {
    const counts = {
      active: 0,
      inactive: 0,
      deprecated: 0,
      all: byCategory.length,
    };
    for (const m of byCategory) counts[modelStatus(m)] += 1;
    return counts;
  }, [byCategory]);

  const sorted = useMemo(
    () =>
      statusFilter === "all"
        ? byCategory
        : byCategory.filter((m) => modelStatus(m) === statusFilter),
    [byCategory, statusFilter],
  );

  /**
   * Per-provider key health, mirroring the backend's routing rule: a provider
   * is usable when it has at least one key that is both active and healthy
   * (`loadRoutingSnapshot` filters on exactly that). Anything else means every
   * model under that provider is unreachable, however it's configured here.
   */
  const providerHealth = useMemo(() => {
    const map = new Map<
      ModelProvider,
      { healthy: boolean; hasKey: boolean; status: AiProviderKeyHealthStatus }
    >();
    for (const p of PROVIDER_ORDER) {
      map.set(p, { healthy: false, hasKey: false, status: "invalid" });
    }
    for (const k of providerKeys ?? []) {
      const entry = map.get(k.provider);
      if (!entry) continue;
      entry.hasKey = true;
      if (k.isActive && k.healthStatus === "healthy") {
        entry.healthy = true;
        entry.status = "healthy";
      } else if (!entry.healthy) {
        // Report the first non-healthy status we see; with one key per
        // provider (the common case) that is simply that key's status.
        entry.status = k.healthStatus;
      }
    }
    return map;
  }, [providerKeys]);

  const providersInCatalog = useMemo(
    () => new Set((data ?? []).map((m) => m.provider)),
    [data],
  );

  const groups = useMemo(
    () =>
      PROVIDER_ORDER.map((provider) => ({
        provider,
        rows: sorted.filter((m) => m.provider === provider),
      })).filter((g) => {
        if (g.rows.length > 0) return true;
        // Keep an unroutable provider on screen even when the status filter
        // empties its group: "no models match" must never be what hides
        // "this provider's key is dead".
        if (providerKeysLoading) return false;
        return (
          providersInCatalog.has(g.provider) &&
          !(providerHealth.get(g.provider)?.healthy ?? false)
        );
      }),
    [sorted, providersInCatalog, providerHealth, providerKeysLoading],
  );

  const categoryLabel = (c: ModelCategory) => t(`models.categories.${c}`);

  const toggleEnabled = async (m: AdminModel) => {
    try {
      await ModelsService.update(m.modelId, { enabled: !m.enabled });
      ToastService.success(t("common.saved"));
      reload();
    } catch (err) {
      ToastService.error(getApiErrorMessage(err, t("common.failed")));
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const summary = await ModelsService.refresh();
      setRefreshSummary(summary);
      reload();
    } catch (err) {
      ToastService.error(getApiErrorMessage(err, t("common.failed")));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t("models.title")}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <span>{t("models.filter.status")}</span>
            <div className="inline-flex rounded-md border border-border p-0.5">
              {MODEL_STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                    statusFilter === s
                      ? "bg-primary/20 font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t(`models.status.${s}`)}
                  <span className="ml-1 opacity-60">{statusCounts[s]}</span>
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{t("models.filter.category")}</span>
            <select
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as ModelCategory | "all")
              }
              className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
            >
              <option value="all">{t("models.filter.all")}</option>
              {MODEL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(c)}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="secondary"
            onClick={() => void handleRefresh()}
            disabled={refreshing}
          >
            <span className="inline-flex items-center gap-1">
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />
              {t("models.refresh")}
            </span>
          </Button>
        </div>
      </div>

      {groups.map((group) => {
        const health = providerHealth.get(group.provider);
        const isHealthy = health?.healthy ?? false;
        return (
          <Card
            key={group.provider}
            title={
              <span className="flex items-center gap-2">
                <span>{PROVIDER_LABELS[group.provider]}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {group.rows.length}
                </span>
              </span>
            }
            actions={
              isHealthy ? (
                <Badge tone="success">{t("models.providerHealth.ok")}</Badge>
              ) : (
                <Badge tone="danger">
                  <span className="inline-flex items-center gap-1">
                    <AlertTriangle size={11} />
                    {health?.hasKey
                      ? t(`models.providerHealth.status.${health.status}`)
                      : t("models.providerHealth.noKey")}
                  </span>
                </Badge>
              )
            }
          >
            {!isHealthy && (
              // The impact is not obvious from the status alone: an unhealthy
              // key removes the whole provider from routing, so every model
              // listed below is unreachable regardless of its Enabled toggle.
              <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs">
                <p className="font-medium">
                  {t("models.providerHealth.warningTitle", {
                    provider: PROVIDER_LABELS[group.provider],
                  })}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {health?.hasKey
                    ? t("models.providerHealth.warningBody")
                    : t("models.providerHealth.warningNoKey")}
                </p>
              </div>
            )}
            {group.rows.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {t("models.emptyForFilter")}
              </p>
            ) : (
              <Table<AdminModel>
                loading={loading}
                columns={[
              {
                key: "model",
                header: t("models.columns.model"),
                render: (r) => (
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.displayName}</span>
                      {r.deprecatedAt && (
                        <span
                          title={t("models.deprecatedHint", {
                            date: new Date(r.deprecatedAt).toLocaleDateString(),
                          })}
                        >
                          <Badge tone="danger">
                            {t("models.status.deprecated")}
                          </Badge>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {r.modelId}
                    </div>
                  </div>
                ),
              },
              {
                key: "released",
                header: t("models.columns.released"),
                // Shown because the list is ordered by it — an invisible sort
                // key just looks like an arbitrary order.
                render: (r) =>
                  r.releasedAt ? (
                    <span className="text-xs whitespace-nowrap">
                      {new Date(r.releasedAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  ) : (
                    <span
                      className="text-xs text-muted-foreground"
                      title={t("models.releasedUnknownHint")}
                    >
                      —
                    </span>
                  ),
              },
              {
                key: "tier",
                header: t("models.columns.tier"),
                render: (r) => (
                  <Badge
                    tone={
                      r.tier === "high"
                        ? "danger"
                        : r.tier === "medium"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {r.tier}
                  </Badge>
                ),
              },
              {
                key: "category",
                header: t("models.columns.category"),
                render: (r) => {
                  const c: ModelCategory = (r.category ?? "coding") as ModelCategory;
                  return (
                    <Badge
                      tone={
                        c === "coding"
                          ? "primary"
                          : c === "image"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {categoryLabel(c)}
                    </Badge>
                  );
                },
              },
              {
                key: "enabled",
                header: t("models.columns.enabled"),
                render: (r) => (
                  <label className="inline-flex items-center cursor-pointer gap-2">
                    <input
                      type="checkbox"
                      checked={r.enabled}
                      onChange={() => void toggleEnabled(r)}
                      />
                    <span
                      className={`text-xs ${
                        r.enabled && r.deprecatedAt ? "text-red-500" : ""
                      }`}
                      // Deprecation overrides the toggle server-side, so saying
                      // "on" here would be a straight lie about what happens.
                      title={
                        r.enabled && r.deprecatedAt
                          ? t("models.enabledBlockedHint")
                          : undefined
                      }
                    >
                      {r.enabled
                        ? r.deprecatedAt
                          ? t("models.enabledBlocked")
                          : "on"
                        : "off"}
                    </span>
                  </label>
                ),
              },
              {
                key: "input",
                header: t("models.columns.input"),
                render: (r) => `$${r.inputPerMillion.toFixed(2)}`,
                align: "right",
              },
              {
                key: "output",
                header: t("models.columns.output"),
                render: (r) => `$${r.outputPerMillion.toFixed(2)}`,
                align: "right",
              },
              {
                key: "actions",
                header: t("models.columns.actions"),
                render: (r) => (
                  <Button variant="secondary" onClick={() => setEditing(r)}>
                    {t("models.edit")}
                  </Button>
                ),
              },
                ]}
                rows={group.rows}
                rowKey={(r) => r.modelId}
              />
            )}
          </Card>
        );
      })}

      {editing && (
        <EditModelDialog
          model={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}

      <Modal
        open={refreshSummary !== null}
        onClose={() => setRefreshSummary(null)}
        title={t("models.diff.title")}
        footer={
          <Button onClick={() => setRefreshSummary(null)}>
            {t("common.close")}
          </Button>
        }
      >
        {refreshSummary && (
          <div className="space-y-3 text-sm">
            <DiffList label={t("models.diff.added")} items={refreshSummary.added} />
            <DiffList
              label={t("models.diff.updated")}
              items={refreshSummary.updatedLastSeen}
            />
            <DiffList
              label={t("models.diff.skipped")}
              items={refreshSummary.skipped}
            />
            <DiffList
              label={t("models.diff.deprecated")}
              items={refreshSummary.deprecated ?? []}
            />
            <DiffList
              label={t("models.diff.restored")}
              items={refreshSummary.restored ?? []}
            />
            {(refreshSummary.stale ?? []).length > 0 && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3">
                <DiffList
                  label={t("models.diff.stale")}
                  items={refreshSummary.stale}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("models.diff.staleHint")}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

const DiffList = ({ label, items }: { label: string; items: string[] }) => (
  <div>
    <div className="text-xs text-muted-foreground mb-1">
      {label} ({items.length})
    </div>
    {items.length === 0 ? (
      <div className="text-xs text-muted-foreground italic">—</div>
    ) : (
      <ul className="text-xs font-mono space-y-0.5">
        {items.map((id) => (
          <li key={id}>{id}</li>
        ))}
      </ul>
    )}
  </div>
);

interface EditModelDialogProps {
  model: AdminModel;
  onClose: () => void;
  onSaved: () => void;
}

const EditModelDialog = ({ model, onClose, onSaved }: EditModelDialogProps) => {
  const { t } = useTranslation("admin");
  const [form, setForm] = useState<UpdateModelPayload>({
    displayName: model.displayName,
    tier: model.tier,
    category: model.category ?? "coding",
    order: model.order,
    inputPerMillion: model.inputPerMillion,
    outputPerMillion: model.outputPerMillion,
    maxOutputTokens: model.maxOutputTokens,
    contextTokens: model.contextTokens,
    codingOptimized: model.codingOptimized,
  });
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    try {
      setBusy(true);
      await ModelsService.update(model.modelId, form);
      ToastService.success(t("common.saved"));
      onSaved();
    } catch (err) {
      ToastService.error(getApiErrorMessage(err, t("common.failed")));
    } finally {
      setBusy(false);
    }
  };

  const update = <K extends keyof UpdateModelPayload>(
    key: K,
    value: UpdateModelPayload[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <Modal
      open
      onClose={onClose}
      title={`${t("models.edit")} · ${model.displayName}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("common.close")}
          </Button>
          <Button onClick={() => void handleSave()} disabled={busy}>
            {t("common.confirm")}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 text-sm">
        <TextField
          label="Display name"
          value={form.displayName ?? ""}
          onChange={(v) => update("displayName", v)}
        />
        <SelectField
          label={t("models.form.tier")}
          value={form.tier ?? model.tier}
          options={["high", "medium", "low"] as const}
          onChange={(v) => update("tier", v as ModelTier)}
        />
        <SelectField
          label={t("models.form.category")}
          value={(form.category ?? model.category ?? "coding") as ModelCategory}
          options={MODEL_CATEGORIES}
          onChange={(v) => update("category", v as ModelCategory)}
          renderOption={(o) => t(`models.categories.${o}`)}
        />
        <NumberField
          label={t("models.form.order")}
          value={form.order ?? 0}
          onChange={(v) => update("order", v)}
        />
        <NumberField
          label="Input / 1M"
          value={form.inputPerMillion ?? 0}
          onChange={(v) => update("inputPerMillion", v)}
          step="0.01"
        />
        <NumberField
          label="Output / 1M"
          value={form.outputPerMillion ?? 0}
          onChange={(v) => update("outputPerMillion", v)}
          step="0.01"
        />
        <NumberField
          label="Max output tokens"
          value={form.maxOutputTokens ?? 0}
          onChange={(v) => update("maxOutputTokens", v)}
        />
        <NumberField
          label="Context tokens"
          value={form.contextTokens ?? 0}
          onChange={(v) => update("contextTokens", v)}
        />
        <label className="flex items-center gap-2 text-xs pt-5">
          <input
            type="checkbox"
            checked={Boolean(form.codingOptimized)}
            onChange={(e) => update("codingOptimized", e.target.checked)}
          />
          Coding optimized
        </label>
      </div>
    </Modal>
  );
};

const TextField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <label className="flex flex-col gap-1 text-xs col-span-2">
    <span className="text-muted-foreground">{label}</span>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-border bg-background px-3 py-1.5"
    />
  </label>
);

const NumberField = ({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: string;
}) => (
  <label className="flex flex-col gap-1 text-xs">
    <span className="text-muted-foreground">{label}</span>
    <input
      type="number"
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="rounded-md border border-border bg-background px-3 py-1.5"
    />
  </label>
);

const SelectField = <T extends string>({
  label,
  value,
  options,
  onChange,
  renderOption,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  renderOption?: (o: T) => string;
}) => (
  <label className="flex flex-col gap-1 text-xs">
    <span className="text-muted-foreground">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="rounded-md border border-border bg-background px-2 py-1.5"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {renderOption ? renderOption(o) : o}
        </option>
      ))}
    </select>
  </label>
);

export default ModelsListPage;
