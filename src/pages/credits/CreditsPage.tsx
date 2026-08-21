import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import Badge from "../../components/ui/Badge";
import { useAsync } from "../../hooks/useAsync";
import {
  CreditsService,
  type LedgerRow,
  type LedgerType,
  type TopSpenderRow,
} from "../../services/features/admin/CreditsService";
import type { RootState } from "../../store/store";
import { formatShortDateTime } from "../../utils/formatDate";
import RouteNames from "../../utils/routing/RouteNames";

const PAGE_SIZE = 25;

const LEDGER_TYPES: LedgerType[] = [
  "grant_monthly",
  "grant_topup",
  "charge_usage",
  "refund_usage",
  "admin_adjust",
  "reset_monthly",
];

const CreditsPage = () => {
  const { t } = useTranslation("admin");
  const lang = useSelector((s: RootState) => s.language.current);
  const navigate = useNavigate();

  const { data: margin, loading: marginLoading } = useAsync(
    () => CreditsService.margin(30),
    [],
  );
  const { data: top, loading: topLoading } = useAsync(
    () => CreditsService.topSpenders(30, 10),
    [],
  );

  const [type, setType] = useState<LedgerType | "">("");
  const [userId, setUserId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [appliedUserId, setAppliedUserId] = useState("");

  const { data: ledger, loading: ledgerLoading } = useAsync(
    () =>
      CreditsService.ledger({
        userId: appliedUserId || undefined,
        type: type || undefined,
        from: from || undefined,
        to: to || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    [appliedUserId, type, from, to, page],
  );

  const currencyFmt = useMemo(
    () =>
      new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }),
    [lang],
  );
  const numberFmt = useMemo(
    () => new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-US"),
    [lang],
  );

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">{t("credits.title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={t("credits.margin.title")}>
          {marginLoading && !margin ? (
            <div className="text-sm text-muted-foreground">
              {t("common.loading")}
            </div>
          ) : margin ? (
            <dl className="space-y-2 text-sm">
              <Row label={t("dashboard.margin.creditsCharged")}>
                {numberFmt.format(margin.totalCreditsCharged)}
              </Row>
              <Row label={t("dashboard.margin.providerCost")}>
                {currencyFmt.format(margin.totalCostUsd)}
              </Row>
              <Row label={t("dashboard.margin.implied")}>
                {numberFmt.format(margin.creditsPerUsdImplied)}
              </Row>
            </dl>
          ) : (
            <div className="text-sm text-muted-foreground">
              {t("common.empty")}
            </div>
          )}
        </Card>
        <Card title={t("credits.topSpenders")} className="lg:col-span-2">
          {topLoading && !top ? (
            <div className="text-sm text-muted-foreground">
              {t("common.loading")}
            </div>
          ) : top && top.length > 0 ? (
            <ul className="divide-y divide-border -mx-5">
              {top.map((row: TopSpenderRow) => (
                <li
                  key={String(row.userId)}
                  className="flex items-center justify-between px-5 py-2 cursor-pointer hover:bg-muted/40"
                  onClick={() =>
                    navigate(RouteNames.USER_DETAIL(String(row.userId)))
                  }
                >
                  <div>
                    <div className="font-medium">{row.email ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {numberFmt.format(row.requests)} req ·{" "}
                      {currencyFmt.format(row.totalCostUsd)}
                    </div>
                  </div>
                  <Badge tone="primary">
                    {numberFmt.format(row.totalCreditsCharged)}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-muted-foreground">
              {t("common.empty")}
            </div>
          )}
        </Card>
      </div>

      <Card title={t("credits.ledger")}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setAppliedUserId(userId.trim());
            setPage(1);
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">
              {t("credits.filter.user")}
            </span>
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="user id"
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm min-w-[220px]"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">
              {t("credits.filter.type")}
            </span>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as LedgerType | "");
                setPage(1);
              }}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            >
              <option value="">{t("users.filters.any")}</option>
              {LEDGER_TYPES.map((v) => (
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

      <Table<LedgerRow>
        loading={ledgerLoading}
        columns={[
          {
            key: "when",
            header: t("credits.columns.when"),
            render: (r) => formatShortDateTime(r.createdAt, lang),
          },
          {
            key: "user",
            header: t("credits.columns.user"),
            render: (r) => (
              <div>
                <div className="font-medium">{r.userEmail ?? "—"}</div>
                <div className="text-[11px] text-muted-foreground">
                  {r.userId}
                </div>
              </div>
            ),
          },
          {
            key: "type",
            header: t("credits.columns.type"),
            render: (r) => <Badge tone="neutral">{r.type}</Badge>,
          },
          {
            key: "amount",
            header: t("credits.columns.amount"),
            align: "right",
            render: (r) => (
              <span
                className={
                  r.amount >= 0
                    ? "text-emerald-500 font-medium"
                    : "text-red-500 font-medium"
                }
              >
                {r.amount >= 0 ? "+" : ""}
                {numberFmt.format(r.amount)}
              </span>
            ),
          },
          {
            key: "reason",
            header: t("credits.columns.reason"),
            render: (r) => (
              <span className="text-xs text-muted-foreground">
                {r.reason ?? "—"}
              </span>
            ),
          },
        ]}
        rows={ledger?.items ?? []}
        rowKey={(r) => r._id}
      />
      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={ledger?.total ?? 0}
        onChange={setPage}
      />
    </div>
  );
};

const Row = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="font-medium">{children}</dd>
  </div>
);

export default CreditsPage;
