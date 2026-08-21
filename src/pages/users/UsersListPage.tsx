import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import SearchInput from "../../components/ui/SearchInput";
import Badge from "../../components/ui/Badge";
import { UsersService } from "../../services/features/admin/UsersService";
import type { AdminUserListItem } from "../../services/features/admin/UsersService";
import { useAsync } from "../../hooks/useAsync";
import type { RootState } from "../../store/store";
import RouteNames from "../../utils/routing/RouteNames";
import { formatShortDate } from "../../utils/formatDate";

type RoleFilter = "" | "user" | "admin";
type StatusFilter = "" | "active" | "suspended" | "deleted" | "unverified";

const PAGE_SIZE = 25;

const UsersListPage = () => {
  const { t } = useTranslation("admin");
  const navigate = useNavigate();
  const lang = useSelector((s: RootState) => s.language.current);

  const [q, setQ] = useState("");
  const [role, setRole] = useState<RoleFilter>("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);

  const { data, loading } = useAsync(
    () =>
      UsersService.list({
        q: q.trim() || undefined,
        role: role || undefined,
        ...statusToFilters(status),
        page,
        pageSize: PAGE_SIZE,
      }),
    [q, role, status, page],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("users.title")}</h1>
      </div>
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder={t("users.search")}
            className="flex-1 min-w-[200px]"
          />
          <SelectFilter
            label={t("users.filters.role")}
            value={role}
            options={[
              ["", t("users.filters.any")],
              ["admin", t("users.filters.admin")],
              ["user", t("users.filters.user")],
            ]}
            onChange={(v) => {
              setRole(v as RoleFilter);
              setPage(1);
            }}
          />
          <SelectFilter
            label={t("users.filters.status")}
            value={status}
            options={[
              ["", t("users.filters.any")],
              ["active", t("users.filters.active")],
              ["suspended", t("users.filters.suspended")],
              ["deleted", t("users.filters.deleted")],
              ["unverified", t("users.filters.unverified")],
            ]}
            onChange={(v) => {
              setStatus(v as StatusFilter);
              setPage(1);
            }}
          />
        </div>
      </Card>

      <Table<AdminUserListItem>
        loading={loading}
        columns={[
          {
            key: "email",
            header: t("users.columns.email"),
            render: (r) => <span className="font-medium">{r.email}</span>,
          },
          {
            key: "role",
            header: t("users.columns.role"),
            render: (r) => (
              <Badge tone={r.role === "admin" ? "primary" : "neutral"}>
                {r.role}
              </Badge>
            ),
          },
          {
            key: "status",
            header: t("users.columns.status"),
            render: (r) => <UserStatusBadge row={r} />,
          },
          {
            key: "credits",
            header: t("users.columns.credits"),
            render: (r) =>
              `${r.credits ?? 0} / ${r.topUpCredits ?? 0}`,
            align: "right",
          },
          {
            key: "lastLogin",
            header: t("users.columns.lastLogin"),
            render: (r) =>
              r.lastLoginAt ? formatShortDate(r.lastLoginAt, lang) : "—",
          },
          {
            key: "createdAt",
            header: t("users.columns.createdAt"),
            render: (r) =>
              r.createdAt ? formatShortDate(r.createdAt, lang) : "—",
          },
        ]}
        rows={data?.items ?? []}
        rowKey={(r) => r._id}
        onRowClick={(r) => navigate(RouteNames.USER_DETAIL(r._id))}
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

function statusToFilters(status: StatusFilter): {
  isSuspended?: boolean;
  isDeleted?: boolean;
  isVerified?: boolean;
} {
  switch (status) {
    case "active":
      return { isSuspended: false, isDeleted: false, isVerified: true };
    case "suspended":
      return { isSuspended: true };
    case "deleted":
      return { isDeleted: true };
    case "unverified":
      return { isVerified: false, isDeleted: false };
    default:
      return {};
  }
}

const UserStatusBadge = ({ row }: { row: AdminUserListItem }) => {
  if (row.isDeleted) return <Badge tone="danger">deleted</Badge>;
  if (row.isSuspended) return <Badge tone="warning">suspended</Badge>;
  if (!row.isVerified) return <Badge tone="info">unverified</Badge>;
  return <Badge tone="success">active</Badge>;
};

interface SelectFilterProps {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (v: string) => void;
}

const SelectFilter = ({ label, value, options, onChange }: SelectFilterProps) => (
  <label className="flex items-center gap-2 text-xs">
    <span className="text-muted-foreground">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none"
    >
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  </label>
);

export default UsersListPage;
