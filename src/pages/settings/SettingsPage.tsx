import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Button from "../../components/button/Button";
import Badge from "../../components/ui/Badge";
import { useAsync } from "../../hooks/useAsync";
import {
  SettingsService,
  type AdminSettings,
} from "../../services/features/admin/SettingsService";
import {
  UsersService,
  type AdminUserListItem,
} from "../../services/features/admin/UsersService";
import { ToastService } from "../../services/toast";
import { getApiErrorMessage } from "../../api/getApiErrorMessage";
import { groupCursorModels } from "../../utils/groupCursorModels";
import RouteNames from "../../utils/routing/RouteNames";

const SettingsPage = () => {
  const { t } = useTranslation("admin");
  const navigate = useNavigate();

  const {
    data: settings,
    loading: settingsLoading,
    reload: reloadSettings,
  } = useAsync(() => SettingsService.get(), []);
  const {
    data: adminsData,
    loading: adminsLoading,
    reload: reloadAdmins,
  } = useAsync(
    () => UsersService.list({ role: "admin", pageSize: 100 }),
    [],
  );

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MaintenanceCard
          settings={settings}
          loading={settingsLoading}
          reload={reloadSettings}
        />
        <PromoteCard reload={reloadAdmins} />
        <CodingModelCard
          settings={settings}
          loading={settingsLoading}
          reload={reloadSettings}
        />
      </div>

      <Card title={t("settings.admins")}>
        <Table<AdminUserListItem>
          loading={adminsLoading}
          columns={[
            {
              key: "email",
              header: t("users.columns.email"),
              render: (r) => <span className="font-medium">{r.email}</span>,
            },
            {
              key: "status",
              header: t("users.columns.status"),
              render: (r) => (
                <div className="flex gap-1">
                  {r.isSuspended && <Badge tone="warning">suspended</Badge>}
                  {r.isDeleted && <Badge tone="danger">deleted</Badge>}
                  {!r.isSuspended && !r.isDeleted && (
                    <Badge tone="success">active</Badge>
                  )}
                </div>
              ),
            },
            {
              key: "actions",
              header: t("users.columns.actions"),
              render: (r) => (
                <Button
                  variant="secondary"
                  onClick={() => navigate(RouteNames.USER_DETAIL(r._id))}
                >
                  Open
                </Button>
              ),
            },
          ]}
          rows={adminsData?.items ?? []}
          rowKey={(r) => r._id}
        />
      </Card>
    </div>
  );
};

const MaintenanceCard = ({
  settings,
  loading,
  reload,
}: {
  settings: AdminSettings | null;
  loading: boolean;
  reload: () => void;
}) => {
  const { t } = useTranslation("admin");
  const [enabled, setEnabled] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (settings && !initialized) {
    setEnabled(Boolean(settings.maintenanceMode));
    setMessage(settings.maintenanceMessage ?? "");
    setInitialized(true);
  }

  const save = async () => {
    try {
      setBusy(true);
      await SettingsService.patch({
        maintenanceMode: enabled,
        maintenanceMessage: message.trim() || null,
      });
      ToastService.success(t("common.saved"));
      reload();
    } catch (err) {
      ToastService.error(getApiErrorMessage(err, t("common.failed")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title={t("settings.maintenance.title")}>
      {loading && !settings ? (
        <div className="text-sm text-muted-foreground">
          {t("common.loading")}
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <span>{t("settings.maintenance.enable")}</span>
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">
              {t("settings.maintenance.message")}
            </span>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <div>
            <Button onClick={() => void save()} disabled={busy}>
              {t("settings.maintenance.save")}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

/**
 * The model the Cursor agent writes code with.
 *
 * Deliberately NOT the "default model" on the Models page: that one drives
 * planning (validation, questionnaires, the build spec) through our own
 * catalogue, while Cursor authors the actual code and has its own model ids.
 * Sending a catalogue id like `gemini-3-1-high` here would fail the build,
 * so the options come straight from Cursor.
 */
const CodingModelCard = ({
  settings,
  loading,
  reload,
}: {
  settings: AdminSettings | null;
  loading: boolean;
  reload: () => void;
}) => {
  const { t } = useTranslation("admin");
  const [modelId, setModelId] = useState("");
  const [params, setParams] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const { data: models, loading: modelsLoading } = useAsync(
    () => SettingsService.cursorModels(),
    [],
  );

  if (settings && !initialized) {
    setModelId(settings.cursorAgentModelId ?? "");
    setParams(settings.cursorAgentModelParams ?? {});
    setInitialized(true);
  }

  const save = async () => {
    try {
      setBusy(true);
      // Only keep params with a chosen value; empty selects mean "model
      // default" and are not persisted. Params without a model make no sense.
      const cleaned = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v && v.trim()),
      );
      await SettingsService.patch({
        cursorAgentModelId: modelId || null,
        cursorAgentModelParams:
          modelId && Object.keys(cleaned).length > 0 ? cleaned : null,
      });
      ToastService.success(t("common.saved"));
      reload();
    } catch (err) {
      ToastService.error(getApiErrorMessage(err, t("common.failed")));
    } finally {
      setBusy(false);
    }
  };

  const catalogue = models ?? [];
  const ids = catalogue.map((m) => m.id);
  const selectedModel = catalogue.find((m) => m.id === modelId);
  const groups = groupCursorModels(catalogue);
  // Keep a previously-saved id selectable even if Cursor stops listing it,
  // otherwise opening this page would silently reset the saved value. It gets
  // its own group so it is obvious the id is no longer in Cursor's catalogue.
  const displayGroups =
    modelId && !ids.includes(modelId)
      ? [
          { label: "Saved (no longer listed by Cursor)", models: [{ id: modelId, parameters: [] }] },
          ...groups,
        ]
      : groups;

  const selectModel = (id: string) => {
    setModelId(id);
    // A different model has different valid params — never carry them over.
    setParams({});
  };

  return (
    <Card title={t("settings.codingModel.title", { defaultValue: "Coding model" })}>
      {loading && !settings ? (
        <div className="text-sm text-muted-foreground">
          {t("common.loading")}
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          <p className="text-xs text-muted-foreground">
            {t("settings.codingModel.hint", {
              defaultValue:
                "Used by the Cursor agent to write application code. The default model on the Models page drives planning only. Models and their effort options are fetched live from Cursor, so this list is always current.",
            })}
          </p>
          <label className="block">
            <span className="text-xs text-muted-foreground">
              {t("settings.codingModel.label", { defaultValue: "Model" })}
            </span>
            {displayGroups.length > 0 ? (
              <select
                value={modelId}
                onChange={(e) => selectModel(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">
                  {t("settings.codingModel.serverDefault", {
                    defaultValue: "Server default",
                  })}
                </option>
                {displayGroups.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.displayName ? `${m.displayName} (${m.id})` : m.id}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            ) : (
              // Cursor unreachable: don't block the page, take a typed id.
              <input
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                placeholder={
                  modelsLoading
                    ? t("common.loading")
                    : t("settings.codingModel.serverDefault", {
                        defaultValue: "Server default",
                      })
                }
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            )}
          </label>
          {selectedModel && selectedModel.parameters.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {selectedModel.parameters.map((param) => (
                <label key={param.id} className="block">
                  <span className="text-xs text-muted-foreground">
                    {param.displayName || param.id}
                  </span>
                  <select
                    value={params[param.id] ?? ""}
                    onChange={(e) =>
                      setParams((prev) => {
                        const next = { ...prev };
                        if (e.target.value) next[param.id] = e.target.value;
                        else delete next[param.id];
                        return next;
                      })
                    }
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">
                      {t("settings.codingModel.paramDefault", {
                        defaultValue: "Model default",
                      })}
                    </option>
                    {param.values.map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.displayName || v.value}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          )}
          <div>
            <Button onClick={() => void save()} disabled={busy}>
              {t("settings.maintenance.save")}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

const PromoteCard = ({ reload }: { reload: () => void }) => {
  const { t } = useTranslation("admin");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      setBusy(true);
      const res = await UsersService.list({ q: email.trim(), pageSize: 5 });
      const match = res.items.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
      );
      if (!match) {
        ToastService.error("User not found");
        return;
      }
      if (match.role === "admin") {
        ToastService.info("Already an admin");
        return;
      }
      await UsersService.patch(match._id, {
        role: "admin",
        reason: reason.trim() || undefined,
      });
      ToastService.success(t("common.saved"));
      setEmail("");
      setReason("");
      reload();
    } catch (err) {
      ToastService.error(getApiErrorMessage(err, t("common.failed")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title={t("settings.promote.title")}>
      <form onSubmit={(e) => void submit(e)} className="space-y-3 text-sm">
        <label className="block">
          <span className="text-xs text-muted-foreground">
            {t("settings.promote.email")}
          </span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
            type="email"
            required
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">
            {t("settings.promote.reason")}
          </span>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
          />
        </label>
        <Button type="submit" disabled={busy}>
          {t("settings.promote.submit")}
        </Button>
      </form>
    </Card>
  );
};

export default SettingsPage;
