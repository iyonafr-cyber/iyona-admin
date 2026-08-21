import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import SearchInput from "../../components/ui/SearchInput";
import Badge from "../../components/ui/Badge";
import { ProjectsService } from "../../services/features/admin/ProjectsService";
import type { AdminProjectListItem } from "../../services/features/admin/ProjectsService";
import { useAsync } from "../../hooks/useAsync";
import type { RootState } from "../../store/store";
import RouteNames from "../../utils/routing/RouteNames";
import { formatShortDate } from "../../utils/formatDate";

const PAGE_SIZE = 25;

const ProjectsListPage = () => {
  const { t } = useTranslation("admin");
  const navigate = useNavigate();
  const lang = useSelector((s: RootState) => s.language.current);
  const [q, setQ] = useState("");
  const [deleted, setDeleted] = useState<"" | "true" | "false">("false");
  const [page, setPage] = useState(1);

  const { data, loading } = useAsync(
    () =>
      ProjectsService.list({
        q: q.trim() || undefined,
        deleted: (deleted || undefined) as "true" | "false" | undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    [q, deleted, page],
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("projects.title")}</h1>
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder={t("projects.search")}
            className="flex-1 min-w-[220px]"
          />
          <label className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">
              {t("projects.filters.deleted")}
            </span>
            <select
              value={deleted}
              onChange={(e) => {
                setDeleted(e.target.value as "" | "true" | "false");
                setPage(1);
              }}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none"
            >
              <option value="false">{t("projects.filters.hide")}</option>
              <option value="true">{t("projects.filters.only")}</option>
              <option value="">{t("projects.filters.any")}</option>
            </select>
          </label>
        </div>
      </Card>
      <Table<AdminProjectListItem>
        loading={loading}
        columns={[
          {
            key: "name",
            header: t("projects.columns.name"),
            render: (r) => (
              <div className="max-w-[260px]">
                <div className="font-medium truncate">
                  {r.name || "(untitled)"}
                </div>
                {r.initialPrompt && (
                  <div className="text-[11px] text-muted-foreground truncate">
                    {r.initialPrompt}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "owner",
            header: t("projects.columns.owner"),
            render: (r) => r.owner?.email ?? "—",
          },
          {
            key: "status",
            header: t("projects.columns.status"),
            render: (r) => {
              const status = r.status ?? "";
              const tone: "success" | "warning" | "danger" | "neutral" =
                status === "DEPLOYED"
                  ? "success"
                  : status === "BUILDING"
                  ? "warning"
                  : status === "FAILED"
                  ? "danger"
                  : "neutral";
              return <Badge tone={tone}>{status || "—"}</Badge>;
            },
          },
          {
            key: "stage",
            header: t("projects.columns.stage"),
            render: (r) => r.stage ?? "—",
          },
          {
            key: "locked",
            header: t("projects.columns.locked"),
            render: (r) =>
              r.locked ? (
                <Badge tone="danger">locked</Badge>
              ) : (
                <Badge tone="neutral">—</Badge>
              ),
          },
          {
            key: "deployed",
            header: t("projects.columns.deployed"),
            render: (r) => {
              const deploy = r.deployment?.status ?? "";
              if (deploy === "completed") {
                return <Badge tone="success">live</Badge>;
              }
              if (deploy === "in_progress") {
                return <Badge tone="warning">deploying</Badge>;
              }
              if (deploy === "failed") {
                return <Badge tone="danger">failed</Badge>;
              }
              return <Badge tone="neutral">{deploy || "—"}</Badge>;
            },
          },
          {
            key: "createdAt",
            header: t("projects.columns.createdAt"),
            render: (r) =>
              r.createdAt ? formatShortDate(r.createdAt, lang) : "—",
          },
        ]}
        rows={data?.items ?? []}
        rowKey={(r) => r._id}
        onRowClick={(r) => navigate(RouteNames.PROJECT_DETAIL(r._id))}
      />
      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={data?.total ?? 0}
        onChange={setPage}
      />
    </div>
  );
};

export default ProjectsListPage;
