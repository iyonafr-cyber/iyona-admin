import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import Modal from "../../components/ui/Modal";
import Button from "../../components/button/Button";
import Badge from "../../components/ui/Badge";
import { useAsync } from "../../hooks/useAsync";
import {
  AuditService,
  type AuditLogRow,
} from "../../services/features/admin/AuditService";
import type { RootState } from "../../store/store";
import { formatShortDateTime } from "../../utils/formatDate";

const PAGE_SIZE = 25;

const TARGET_TYPES: AuditLogRow["targetType"][] = [
  "user",
  "project",
  "model",
  "credits",
  "system",
];

const AuditLogPage = () => {
  const { t } = useTranslation("admin");
  const lang = useSelector((s: RootState) => s.language.current);

  const [actorId, setActorId] = useState("");
  const [action, setAction] = useState("");
  const [targetType, setTargetType] = useState<
    AuditLogRow["targetType"] | ""
  >("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    actorId: "",
    action: "",
  });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AuditLogRow | null>(null);

  const { data, loading } = useAsync(
    () =>
      AuditService.list({
        actorId: appliedFilters.actorId || undefined,
        action: appliedFilters.action || undefined,
        targetType: targetType || undefined,
        from: from || undefined,
        to: to || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    [
      appliedFilters.actorId,
      appliedFilters.action,
      targetType,
      from,
      to,
      page,
    ],
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("audit.title")}</h1>

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setAppliedFilters({
              actorId: actorId.trim(),
              action: action.trim(),
            });
            setPage(1);
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Actor id</span>
            <input
              value={actorId}
              onChange={(e) => setActorId(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm min-w-[200px]"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Action</span>
            <input
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g. user.suspend"
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm min-w-[200px]"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Target type</span>
            <select
              value={targetType}
              onChange={(e) => {
                setTargetType(
                  e.target.value as AuditLogRow["targetType"] | "",
                );
                setPage(1);
              }}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            >
              <option value="">{t("users.filters.any")}</option>
              {TARGET_TYPES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">
              {t("credits.filter.from")}
            </span>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">
              {t("credits.filter.to")}
            </span>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-primary text-primary-foreground text-sm px-3 py-1.5 hover:bg-primary/90"
          >
            {t("common.search")}
          </button>
        </form>
      </Card>

      <Table<AuditLogRow>
        loading={loading}
        columns={[
          {
            key: "when",
            header: t("audit.columns.when"),
            render: (r) => formatShortDateTime(r.createdAt, lang),
          },
          {
            key: "actor",
            header: t("audit.columns.actor"),
            render: (r) => (
              <div>
                <div className="font-medium">{r.actorEmail || "—"}</div>
                <div className="text-[11px] text-muted-foreground">
                  {r.actorId}
                </div>
              </div>
            ),
          },
          {
            key: "action",
            header: t("audit.columns.action"),
            render: (r) => (
              <span className="font-mono text-xs">{r.action}</span>
            ),
          },
          {
            key: "target",
            header: t("audit.columns.target"),
            render: (r) => (
              <div className="flex items-center gap-2">
                <Badge tone="neutral">{r.targetType}</Badge>
                <span className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                  {r.targetId ?? "—"}
                </span>
              </div>
            ),
          },
          {
            key: "reason",
            header: t("audit.columns.reason"),
            render: (r) => (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {r.reason ?? "—"}
              </span>
            ),
          },
        ]}
        rows={data?.items ?? []}
        rowKey={(r) => r._id}
        onRowClick={(r) => setSelected(r)}
      />

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={data?.total ?? 0}
        onChange={setPage}
      />

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.action ?? ""}
        footer={<Button onClick={() => setSelected(null)}>{t("common.close")}</Button>}
      >
        {selected && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <InfoRow label="Actor" value={`${selected.actorEmail} (${selected.actorId})`} />
              <InfoRow label="Target" value={`${selected.targetType}/${selected.targetId ?? ""}`} />
              <InfoRow label={t("audit.detail.ip")} value={selected.ip ?? "—"} />
              <InfoRow
                label={t("audit.detail.userAgent")}
                value={selected.userAgent ?? "—"}
              />
              <InfoRow
                label="When"
                value={formatShortDateTime(selected.createdAt, lang)}
              />
              <InfoRow
                label={t("audit.columns.reason")}
                value={selected.reason ?? "—"}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DiffBlock
                label={t("audit.detail.before")}
                obj={selected.before ?? null}
              />
              <DiffBlock
                label={t("audit.detail.after")}
                obj={selected.after ?? null}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
      {label}
    </div>
    <div className="font-mono break-all">{value}</div>
  </div>
);

const DiffBlock = ({
  label,
  obj,
}: {
  label: string;
  obj: Record<string, unknown> | null;
}) => (
  <div>
    <div className="text-xs text-muted-foreground mb-1">{label}</div>
    <pre className="rounded-md bg-muted/50 border border-border p-2 text-[11px] overflow-auto max-h-64">
      {obj ? JSON.stringify(obj, null, 2) : "—"}
    </pre>
  </div>
);

export default AuditLogPage;
