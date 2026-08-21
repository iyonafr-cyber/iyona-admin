import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, FlaskConical } from "lucide-react";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Button from "../../components/button/Button";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import { useAsync } from "../../hooks/useAsync";
import {
  AiProviderKeysService,
  type AdminProviderKey,
  type AiProviderKeyHealthStatus,
  type AiProviderKeyProvider,
} from "../../services/features/admin/AiProviderKeysService";
import { ToastService } from "../../services/toast";
import { getApiErrorMessage } from "../../api/getApiErrorMessage";

const PROVIDERS: AiProviderKeyProvider[] = ["openai", "anthropic", "google"];

const HEALTH_TONES: Record<
  AiProviderKeyHealthStatus,
  "success" | "warning" | "danger" | "neutral"
> = {
  healthy: "success",
  rate_limited: "warning",
  quota_exceeded: "warning",
  disabled: "danger",
  invalid: "danger",
};

const ProviderKeysPage = () => {
  const { t } = useTranslation("admin");
  const { data, loading, reload } = useAsync(
    () => AiProviderKeysService.list(),
    [],
  );
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminProviderKey | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    message: string;
    ok: boolean;
  } | null>(null);

  const sorted = useMemo(() => {
    return [...(data ?? [])].sort((a, b) => {
      if (a.provider !== b.provider) return a.provider.localeCompare(b.provider);
      return a.priority - b.priority || a.name.localeCompare(b.name);
    });
  }, [data]);

  const toggleActive = async (row: AdminProviderKey) => {
    try {
      await AiProviderKeysService.update(row._id, {
        isActive: !row.isActive,
      });
      ToastService.success(t("common.saved"));
      reload();
    } catch (err) {
      ToastService.error(getApiErrorMessage(err, t("common.failed")));
    }
  };

  const runTest = async (id: string) => {
    try {
      setTestingId(id);
      const res = await AiProviderKeysService.test(id);
      setTestResult({ message: res.message, ok: res.ok });
      reload();
    } catch (err) {
      ToastService.error(getApiErrorMessage(err, t("common.failed")));
    } finally {
      setTestingId(null);
    }
  };

  const remove = async (row: AdminProviderKey) => {
    if (
      !window.confirm(
        t("providerKeys.confirmDelete", { name: row.name }) as string,
      )
    ) {
      return;
    }
    try {
      await AiProviderKeysService.remove(row._id);
      ToastService.success(t("common.saved"));
      reload();
    } catch (err) {
      ToastService.error(getApiErrorMessage(err, t("common.failed")));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t("providerKeys.title")}</h1>
        <Button onClick={() => setCreating(true)}>
          <span className="inline-flex items-center gap-1">
            <Plus size={16} />
            {t("providerKeys.add")}
          </span>
        </Button>
      </div>

      <Card>
        <Table<AdminProviderKey>
          loading={loading}
          columns={[
            {
              key: "name",
              header: t("providerKeys.columns.name"),
              render: (r) => (
                <div>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {r.keyPreview}
                  </div>
                </div>
              ),
            },
            {
              key: "provider",
              header: t("providerKeys.columns.provider"),
              render: (r) => <Badge tone="neutral">{r.provider}</Badge>,
            },
            {
              key: "priority",
              header: t("providerKeys.columns.priority"),
              render: (r) => r.priority,
              align: "right",
            },
            {
              key: "health",
              header: t("providerKeys.columns.health"),
              render: (r) => (
                <button
                  type="button"
                  className="inline-flex h-auto cursor-pointer rounded-full border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={testingId === r._id}
                  onClick={() => void runTest(r._id)}
                  aria-label={t("providerKeys.checkHealth")}
                  title={t("providerKeys.checkHealthHint")}
                >
                  <Badge tone={HEALTH_TONES[r.healthStatus]}>
                    {t(`providerKeys.health.${r.healthStatus}`)}
                  </Badge>
                </button>
              ),
            },
            {
              key: "models",
              header: t("providerKeys.columns.models"),
              render: (r) =>
                r.supportedModels?.length
                  ? r.supportedModels.join(", ")
                  : t("providerKeys.allModels"),
            },
            {
              key: "usage",
              header: t("providerKeys.columns.usage"),
              render: (r) => (
                <span className="text-xs text-muted-foreground">
                  {t("providerKeys.usageLine", {
                    total: r.totalRequests,
                    day: r.requestsToday,
                    min: r.requestsThisMinute,
                  })}
                </span>
              ),
            },
            {
              key: "active",
              header: t("providerKeys.columns.active"),
              render: (r) => (
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={r.isActive}
                    onChange={() => void toggleActive(r)}
                  />
                </label>
              ),
            },
            {
              key: "actions",
              header: t("providerKeys.columns.actions"),
              render: (r) => (
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant="secondary"
                    onClick={() => void runTest(r._id)}
                    disabled={testingId === r._id}
                  >
                    <span className="inline-flex items-center gap-1">
                      <FlaskConical size={14} />
                      {t("providerKeys.test")}
                    </span>
                  </Button>
                  <Button variant="secondary" onClick={() => setEditing(r)}>
                    {t("models.edit")}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => void remove(r)}
                    className="text-destructive"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ),
            },
          ]}
          rows={sorted}
          rowKey={(r) => r._id}
        />
      </Card>

      {creating && (
        <CreateKeyDialog
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            reload();
          }}
        />
      )}

      {editing && (
        <EditKeyDialog
          keyRow={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}

      <Modal
        open={testResult !== null}
        onClose={() => setTestResult(null)}
        title={t("providerKeys.testTitle")}
        footer={
          <Button onClick={() => setTestResult(null)}>{t("common.close")}</Button>
        }
      >
        {testResult && (
          <div className="space-y-2 text-sm">
            <Badge tone={testResult.ok ? "success" : "danger"}>
              {testResult.ok ? t("providerKeys.testOk") : t("providerKeys.testFail")}
            </Badge>
            <p className="text-muted-foreground break-words">{testResult.message}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

const fieldClass =
  "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm";

const parseModelsInput = (raw: string): string[] | undefined => {
  const parts = raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : undefined;
};

const parseModelsInputRequired = (raw: string): string[] =>
  raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

const CreateKeyDialog = ({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) => {
  const { t } = useTranslation("admin");
  const [provider, setProvider] = useState<AiProviderKeyProvider>("openai");
  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [priority, setPriority] = useState(100);
  const [modelsRaw, setModelsRaw] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim() || !apiKey.trim()) return;
    try {
      setBusy(true);
      await AiProviderKeysService.create({
        provider,
        name: name.trim(),
        apiKey: apiKey.trim(),
        priority,
        supportedModels: parseModelsInput(modelsRaw),
        openaiBaseUrl:
          provider === "openai" && baseUrl.trim() ? baseUrl.trim() : undefined,
      });
      ToastService.success(t("common.saved"));
      onSaved();
    } catch (err) {
      ToastService.error(getApiErrorMessage(err, t("common.failed")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t("providerKeys.createTitle")}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t("common.close")}
          </Button>
          <Button onClick={() => void submit()} disabled={busy}>
            {t("providerKeys.save")}
          </Button>
        </div>
      }
    >
      <div className="space-y-3 text-sm max-w-md">
        <label className="block">
          <span className="text-xs text-muted-foreground">
            {t("providerKeys.form.provider")}
          </span>
          <select
            className={fieldClass}
            value={provider}
            onChange={(e) =>
              setProvider(e.target.value as AiProviderKeyProvider)
            }
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">
            {t("providerKeys.form.name")}
          </span>
          <input
            className={fieldClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">
            {t("providerKeys.form.apiKey")}
          </span>
          <input
            type="password"
            autoComplete="new-password"
            className={fieldClass}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </label>
        {provider === "openai" && (
          <label className="block">
            <span className="text-xs text-muted-foreground">
              {t("providerKeys.form.openaiBaseUrl")}
            </span>
            <input
              className={fieldClass}
              value={baseUrl}
              placeholder="https://api.openai.com/v1"
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </label>
        )}
        <label className="block">
          <span className="text-xs text-muted-foreground">
            {t("providerKeys.form.priority")}
          </span>
          <input
            type="number"
            className={fieldClass}
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">
            {t("providerKeys.form.models")}
          </span>
          <textarea
            rows={3}
            className={fieldClass}
            value={modelsRaw}
            onChange={(e) => setModelsRaw(e.target.value)}
            placeholder={t("providerKeys.form.modelsPlaceholder") as string}
          />
        </label>
      </div>
    </Modal>
  );
};

const HEALTH_OPTIONS: AiProviderKeyHealthStatus[] = [
  "healthy",
  "rate_limited",
  "quota_exceeded",
  "disabled",
  "invalid",
];

const EditKeyDialog = ({
  keyRow,
  onClose,
  onSaved,
}: {
  keyRow: AdminProviderKey;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const { t } = useTranslation("admin");
  const [name, setName] = useState(keyRow.name);
  const [priority, setPriority] = useState(keyRow.priority);
  const [modelsRaw, setModelsRaw] = useState(
    (keyRow.supportedModels ?? []).join("\n"),
  );
  const [baseUrl, setBaseUrl] = useState(keyRow.openaiBaseUrl ?? "");
  const [newKey, setNewKey] = useState("");
  const [health, setHealth] = useState<AiProviderKeyHealthStatus>(
    keyRow.healthStatus,
  );
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    try {
      setBusy(true);
      await AiProviderKeysService.update(keyRow._id, {
        name: name.trim(),
        priority,
        supportedModels: parseModelsInputRequired(modelsRaw),
        openaiBaseUrl:
          keyRow.provider === "openai" ? baseUrl.trim() || null : undefined,
        apiKey: newKey.trim() ? newKey.trim() : undefined,
        healthStatus: health,
      });
      ToastService.success(t("common.saved"));
      onSaved();
    } catch (err) {
      ToastService.error(getApiErrorMessage(err, t("common.failed")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t("providerKeys.editTitle", { name: keyRow.name })}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t("common.close")}
          </Button>
          <Button onClick={() => void submit()} disabled={busy}>
            {t("providerKeys.save")}
          </Button>
        </div>
      }
    >
      <div className="space-y-3 text-sm max-w-md">
        <p className="text-xs text-muted-foreground">
          {t("providerKeys.editHint")}
        </p>
        <label className="block">
          <span className="text-xs text-muted-foreground">
            {t("providerKeys.form.name")}
          </span>
          <input
            className={fieldClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">
            {t("providerKeys.form.priority")}
          </span>
          <input
            type="number"
            className={fieldClass}
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
          />
        </label>
        {keyRow.provider === "openai" && (
          <label className="block">
            <span className="text-xs text-muted-foreground">
              {t("providerKeys.form.openaiBaseUrl")}
            </span>
            <input
              className={fieldClass}
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </label>
        )}
        <label className="block">
          <span className="text-xs text-muted-foreground">
            {t("providerKeys.form.rotateKey")}
          </span>
          <input
            type="password"
            autoComplete="new-password"
            className={fieldClass}
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder={t("providerKeys.form.rotatePlaceholder") as string}
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">
            {t("providerKeys.form.models")}
          </span>
          <textarea
            rows={3}
            className={fieldClass}
            value={modelsRaw}
            onChange={(e) => setModelsRaw(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">
            {t("providerKeys.form.health")}
          </span>
          <select
            className={fieldClass}
            value={health}
            onChange={(e) =>
              setHealth(e.target.value as AiProviderKeyHealthStatus)
            }
          >
            {HEALTH_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {t(`providerKeys.health.${h}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </Modal>
  );
};

export default ProviderKeysPage;
