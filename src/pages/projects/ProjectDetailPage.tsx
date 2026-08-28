import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { ArrowLeft, Lock, Unlock, ShieldOff, ShieldCheck, Trash2, ExternalLink, Database, Globe, Sparkles, Package } from "lucide-react";
import Card from "../../components/ui/Card";
import Button from "../../components/button/Button";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { useAsync } from "../../hooks/useAsync";
import {
  ProjectsService,
  type AdminBuildArtifact,
} from "../../services/features/admin/ProjectsService";
import type { RootState } from "../../store/store";
import { formatShortDateTime } from "../../utils/formatDate";
import { ToastService } from "../../services/toast";
import { getApiErrorMessage } from "../../api/getApiErrorMessage";
import RouteNames from "../../utils/routing/RouteNames";

type ActionKey = "takedown" | "revert" | "lock" | "unlock" | "delete" | null;

const ProjectDetailPage = () => {
  const { id = "" } = useParams<{ id: string }>();
  const { t } = useTranslation("admin");
  const navigate = useNavigate();
  const lang = useSelector((s: RootState) => s.language.current);

  const { data, loading, error, reload } = useAsync(
    () => ProjectsService.detail(id),
    [id],
  );

  const [action, setAction] = useState<ActionKey>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renameReason, setRenameReason] = useState("");
  const [busy, setBusy] = useState(false);
  // E5 — local UI state for the admin curation card. Initialized from
  // the loaded project so the inputs reflect current server state.
  const [tplCategoryDraft, setTplCategoryDraft] = useState("");

  if (loading && !data)
    return <div className="text-sm text-muted-foreground">{t("common.loading")}</div>;
  if (error || !data)
    return <div className="text-sm text-red-500">{error ?? t("common.failed")}</div>;

  const project = data.project;
  const locked = Boolean(project.locked);
  const deleted = Boolean(project.deletedAt);
  // Scaffold-mode metadata. When set, the project was materialized
  // from `<templateName>@<templateVersion>` and the AI's writes are
  // gated by that template's manifest path policy. Absent fields
  // imply a legacy, from-scratch project (pre-template-mode cutover).
  const templateName = project.templateName;
  const templateVersion = project.templateVersion;
  const scaffoldLabel =
    templateName && templateVersion
      ? `${templateName}@${templateVersion}`
      : templateName
        ? templateName
        : null;
  // E5 fields surfaced from the user-project doc.
  const isPublic = Boolean(project.isPublic);
  const isTemplate = Boolean(project.isTemplate);
  const publicSlug = (project.publicSlug as string | undefined) ?? undefined;
  const templateCategory = (project.templateCategory as string | undefined) ?? "";
  const remixCount = Number(project.remixCount ?? 0);
  const deployment = project.deployment as
    | { url?: string; status?: string; deployedAt?: string }
    | undefined;
  // E1 — Supabase block surfaced from the user-project doc.
  const supabase = project.supabase as
    | {
        status?: string;
        projectRef?: string;
        url?: string;
        region?: string;
        provisioningError?: string;
        readyAt?: string;
        lastSchemaError?: string;
        lastAppliedSchema?: Record<string, unknown>;
      }
    | undefined
    | null;

  const handlePatch = async (
    patch: Parameters<typeof ProjectsService.patch>[1],
    successMsg: string,
  ) => {
    try {
      setBusy(true);
      await ProjectsService.patch(id, patch);
      ToastService.success(successMsg);
      reload();
    } catch (err) {
      ToastService.error(getApiErrorMessage(err, t("common.failed")));
    } finally {
      setBusy(false);
      setAction(null);
    }
  };

  const handleDelete = async (reason: string) => {
    try {
      setBusy(true);
      await ProjectsService.softDelete(id, reason);
      ToastService.success(t("common.saved"));
      reload();
    } catch (err) {
      ToastService.error(getApiErrorMessage(err, t("common.failed")));
    } finally {
      setBusy(false);
      setAction(null);
    }
  };

  const handleRename = async () => {
    if (!renameValue.trim()) return;
    try {
      setBusy(true);
      await ProjectsService.patch(id, {
        name: renameValue.trim(),
        reason: renameReason.trim() || undefined,
      });
      ToastService.success(t("common.saved"));
      setRenameOpen(false);
      setRenameValue("");
      setRenameReason("");
      reload();
    } catch (err) {
      ToastService.error(getApiErrorMessage(err, t("common.failed")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate(RouteNames.PROJECTS)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} /> {t("projects.title")}
      </button>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">
            {(project.name as string) || "(untitled)"}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            {locked && <Badge tone="danger">locked</Badge>}
            {deleted && <Badge tone="danger">deleted</Badge>}
            <Badge tone="neutral">
              {(project.status as string) ?? "—"}
            </Badge>
            {scaffoldLabel && (
              <Badge tone="info">
                <span className="inline-flex items-center gap-1">
                  <Package size={11} /> {scaffoldLabel}
                </span>
              </Badge>
            )}
            <span className="text-muted-foreground">ID {project._id}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => { setRenameValue((project.name as string) ?? ""); setRenameOpen(true); }}>
            {t("projects.detail.rename")}
          </Button>
          {locked ? (
            <Button variant="secondary" onClick={() => setAction("unlock")}>
              <span className="inline-flex items-center gap-1">
                <Unlock size={14} /> {t("projects.detail.unlock")}
              </span>
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setAction("lock")}>
              <span className="inline-flex items-center gap-1">
                <Lock size={14} /> {t("projects.detail.lock")}
              </span>
            </Button>
          )}
          {deployment?.status === "failed" && locked ? (
            <Button
              onClick={() => setAction("revert")}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <span className="inline-flex items-center gap-1">
                <ShieldCheck size={14} /> {t("projects.detail.revert")}
              </span>
            </Button>
          ) : (
            <Button
              onClick={() => setAction("takedown")}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              <span className="inline-flex items-center gap-1">
                <ShieldOff size={14} /> {t("projects.detail.takedown")}
              </span>
            </Button>
          )}
          <Button
            onClick={() => setAction("delete")}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            <span className="inline-flex items-center gap-1">
              <Trash2 size={14} /> {t("projects.detail.softDelete")}
            </span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Owner">
          {data.owner ? (
            <div className="text-sm space-y-1">
              <div className="font-medium">{data.owner.email as string}</div>
              <div className="text-xs text-muted-foreground">
                {(data.owner.role as string) ?? "user"} · {data.owner._id}
              </div>
              <div className="mt-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    navigate(RouteNames.USER_DETAIL(data.owner!._id))
                  }
                >
                  Open owner
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">—</div>
          )}
        </Card>
        <Card title={t("projects.detail.deployment")} className="lg:col-span-2">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Field label="Status" value={deployment?.status ?? "—"} />
            <Field
              label="URL"
              value={
                deployment?.url ? (
                  <a
                    href={deployment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {deployment.url}
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <Field
              label="Deployed at"
              value={
                deployment?.deployedAt
                  ? formatShortDateTime(deployment.deployedAt, lang)
                  : "—"
              }
            />
            <Field
              label="Chats"
              value={data.counts.chats}
            />
            <Field
              label="Locked"
              value={locked ? "yes" : "no"}
            />
            <Field
              label="Deleted at"
              value={
                deleted && project.deletedAt
                  ? formatShortDateTime(project.deletedAt as string, lang)
                  : "—"
              }
            />
            <Field
              label="Scaffold"
              value={
                scaffoldLabel ? (
                  <span className="inline-flex items-center gap-1 font-mono text-xs">
                    <Package size={12} /> {scaffoldLabel}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    legacy (no template)
                  </span>
                )
              }
            />
          </dl>
        </Card>
      </div>

      <Card
        title={
          <span className="inline-flex items-center gap-2">
            <Sparkles size={14} /> Public visibility & templates
          </span>
        }
      >
        <div className="space-y-4 text-sm">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-3">
            <Field
              label="Public"
              value={
                <Badge tone={isPublic ? "success" : "neutral"}>
                  {isPublic ? "yes" : "no"}
                </Badge>
              }
            />
            <Field
              label="Template"
              value={
                <Badge tone={isTemplate ? "success" : "neutral"}>
                  {isTemplate ? "yes" : "no"}
                </Badge>
              }
            />
            <Field label="Remixes" value={remixCount} />
            <Field
              label="Slug"
              value={
                publicSlug ? (
                  <a
                    href={`/p/${publicSlug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    /p/{publicSlug}
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <Field label="Category" value={templateCategory || "—"} />
          </dl>

          <div className="flex flex-wrap items-end gap-2">
            <label className="block">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Set template category
              </span>
              <input
                value={tplCategoryDraft || templateCategory}
                onChange={(e) => setTplCategoryDraft(e.target.value)}
                placeholder="e.g. landing, dashboard, ecommerce"
                className="mt-1 w-64 rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() =>
                handlePatch(
                  {
                    isTemplate: true,
                    templateCategory: (tplCategoryDraft || templateCategory).trim() || undefined,
                  },
                  "Marked as template",
                )
              }
            >
              <span className="inline-flex items-center gap-1">
                <Sparkles size={14} /> Mark as template
              </span>
            </Button>
            {isTemplate && (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => handlePatch({ isTemplate: false }, "Removed from templates")}
              >
                Remove from templates
              </Button>
            )}
            {isPublic ? (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => handlePatch({ isPublic: false }, "Unpublished")}
              >
                <span className="inline-flex items-center gap-1">
                  <Globe size={14} /> Unpublish
                </span>
              </Button>
            ) : (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => handlePatch({ isPublic: true }, "Published")}
              >
                <span className="inline-flex items-center gap-1">
                  <Globe size={14} /> Publish
                </span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {supabase && (
        <Card
          title={
            <span className="inline-flex items-center gap-2">
              <Database size={14} /> Database (Supabase)
            </span>
          }
        >
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-3">
            <Field
              label="Status"
              value={
                <Badge
                  tone={
                    supabase.status === "ready"
                      ? "success"
                      : supabase.status === "failed"
                        ? "danger"
                        : "neutral"
                  }
                >
                  {supabase.status ?? "—"}
                </Badge>
              }
            />
            <Field label="Project ref" value={supabase.projectRef ?? "—"} />
            <Field label="Region" value={supabase.region ?? "—"} />
            <Field
              label="URL"
              value={
                supabase.url ? (
                  <a
                    href={supabase.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {supabase.url}
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <Field
              label="Ready at"
              value={
                supabase.readyAt
                  ? formatShortDateTime(supabase.readyAt, lang)
                  : "—"
              }
            />
            {supabase.provisioningError && (
              <Field
                label="Provisioning error"
                value={
                  <span className="text-red-500">
                    {supabase.provisioningError}
                  </span>
                }
              />
            )}
            {supabase.lastSchemaError && (
              <Field
                label="Schema error"
                value={
                  <span className="text-red-500">
                    {supabase.lastSchemaError}
                  </span>
                }
              />
            )}
            {supabase.lastAppliedSchema && (
              <Field
                label="Schema tables"
                value={
                  Array.isArray(
                    (supabase.lastAppliedSchema as { tables?: unknown[] })
                      ?.tables,
                  )
                    ? (
                        supabase.lastAppliedSchema as {
                          tables: { name: string }[];
                        }
                      ).tables
                        .map((t) => t.name)
                        .join(", ")
                    : "—"
                }
              />
            )}
          </dl>
        </Card>
      )}

      <BuildArtifactsCard projectId={id} lang={lang} />

      <ConfirmDialog
        open={action === "takedown"}
        onClose={() => setAction(null)}
        onConfirm={(reason) =>
          handlePatch({ takedown: true, reason }, t("common.saved"))
        }
        title={t("projects.detail.takedown")}
        description="This locks the project and flags the deployment as failed."
        requireReason
        destructive
        busy={busy}
      />
      <ConfirmDialog
        open={action === "revert"}
        onClose={() => setAction(null)}
        onConfirm={(reason) =>
          handlePatch({ takedown: false, reason }, t("common.saved"))
        }
        title={t("projects.detail.revert")}
        requireReason
        busy={busy}
      />
      <ConfirmDialog
        open={action === "lock"}
        onClose={() => setAction(null)}
        onConfirm={(reason) =>
          handlePatch({ locked: true, reason }, t("common.saved"))
        }
        title={t("projects.detail.lock")}
        requireReason
        busy={busy}
      />
      <ConfirmDialog
        open={action === "unlock"}
        onClose={() => setAction(null)}
        onConfirm={(reason) =>
          handlePatch({ locked: false, reason }, t("common.saved"))
        }
        title={t("projects.detail.unlock")}
        requireReason
        busy={busy}
      />
      <ConfirmDialog
        open={action === "delete"}
        onClose={() => setAction(null)}
        onConfirm={handleDelete}
        title={t("projects.detail.softDelete")}
        description="The project is soft-deleted and hidden from the product."
        requireReason
        destructive
        busy={busy}
      />

      <Modal
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        title={t("projects.detail.rename")}
        footer={
          <>
            <Button variant="secondary" onClick={() => setRenameOpen(false)}>
              {t("common.close")}
            </Button>
            <Button
              onClick={() => void handleRename()}
              disabled={busy || !renameValue.trim()}
            >
              {t("common.confirm")}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs text-muted-foreground">Name</span>
            <input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              autoFocus
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">
              {t("common.reason")}
            </span>
            <textarea
              rows={3}
              value={renameReason}
              onChange={(e) => setRenameReason(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>
      </Modal>
    </div>
  );
};

/**
 * The archived build instructions for a project: for each build, the plan the
 * LLM brain wrote and the exact prompt the Cursor agent received.
 *
 * Loaded on demand (a button, not on mount) because each record runs to tens
 * of KB and most visits to this page are not about diagnosing a build.
 */
const BuildArtifactsCard = ({
  projectId,
  lang,
}: {
  projectId: string;
  lang: string;
}) => {
  const [artifacts, setArtifacts] = useState<AdminBuildArtifact[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState<"brief" | "prompt">("brief");

  const load = async () => {
    try {
      setLoading(true);
      const data = await ProjectsService.buildArtifacts(projectId);
      setArtifacts(data);
      if (data.length > 0) setOpenId((prev) => prev ?? data[0].id);
    } catch (err) {
      ToastService.error(getApiErrorMessage(err, "Failed to load"));
    } finally {
      setLoading(false);
    }
  };

  const open = artifacts?.find((a) => a.id === openId) ?? null;
  const text = open ? (tab === "brief" ? open.brief : open.agentPrompt) : null;

  const copy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      ToastService.success("Copied");
    } catch {
      ToastService.error("Could not copy");
    }
  };

  return (
    <Card
      title="Build instructions"
      className="lg:col-span-2"
      actions={
        <Button variant="secondary" onClick={() => void load()} disabled={loading}>
          {loading ? "Loading…" : artifacts ? "Refresh" : "Load"}
        </Button>
      }
    >
      <p className="mb-3 text-xs text-muted-foreground">
        What the LLM planned and the exact prompt the Cursor agent received, per
        build. Use it to trace a disappointing app back to the instruction that
        produced it.
      </p>

      {!artifacts ? (
        <p className="text-sm text-muted-foreground">
          Not loaded — these records are large, so they are fetched on request.
        </p>
      ) : artifacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No builds recorded for this project.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {artifacts.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setOpenId(a.id)}
                className={`rounded-md border px-2 py-1 text-xs ${
                  a.id === openId
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {a.createdAt
                  ? formatShortDateTime(a.createdAt, lang)
                  : a.id.slice(-6)}
                {a.status ? ` · ${a.status}` : ""}
              </button>
            ))}
          </div>

          {open && (
            <>
              <div className="flex items-center gap-2">
                {(["brief", "prompt"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={`rounded-md px-2 py-1 text-xs ${
                      tab === key
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    {key === "brief" ? "Development plan" : "Agent prompt"}
                  </button>
                ))}
                <div className="ml-auto">
                  <Button variant="secondary" onClick={() => void copy()} disabled={!text}>
                    Copy
                  </Button>
                </div>
              </div>

              {text ? (
                <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed">
                  {text}
                </pre>
              ) : (
                // Builds from before this feature shipped have no archive —
                // say so, rather than showing an empty box that reads as a bug.
                <p className="text-sm text-muted-foreground">
                  Not recorded for this build (it ran before build instructions
                  were archived).
                </p>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
};

const Field = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex flex-col">
    <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
      {label}
    </dt>
    <dd className="font-medium break-all">{value}</dd>
  </div>
);

export default ProjectDetailPage;
