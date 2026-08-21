import { useTranslation } from "react-i18next";
import {
  Users as UsersIcon,
  ShieldCheck,
  CreditCard,
  Folder,
  UserPlus,
  Coins,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Card from "../../components/ui/Card";
import KPITile from "../../components/ui/KPITile";
import StatusDot from "../../components/ui/StatusDot";
import Badge from "../../components/ui/Badge";
import { DashboardService } from "../../services/features/admin/DashboardService";
import { useAsync } from "../../hooks/useAsync";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import { formatShortDateTime } from "../../utils/formatDate";

const numberFmt = (n: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);

const DashboardPage = () => {
  const { t } = useTranslation("admin");
  const lang = useSelector((s: RootState) => s.language.current);
  const { data, loading, error } = useAsync(
    () => DashboardService.snapshot(),
    [],
  );

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
        {error}
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="text-sm text-muted-foreground">{t("common.loading")}</div>
    );
  }

  const providerEntries = Object.entries(data.providerHealth);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{t("dashboard.title")}</h1>
          <p className="text-xs text-muted-foreground">
            {new Date().toDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPITile
          label={t("dashboard.kpi.users")}
          value={numberFmt(data.totals.users)}
          icon={<UsersIcon size={16} />}
        />
        <KPITile
          label={t("dashboard.kpi.admins")}
          value={numberFmt(data.totals.admins)}
          icon={<ShieldCheck size={16} />}
        />
        <KPITile
          label={t("dashboard.kpi.activeSubscriptions")}
          value={numberFmt(data.totals.activeSubscriptions)}
          icon={<CreditCard size={16} />}
        />
        <KPITile
          label={t("dashboard.kpi.projects")}
          value={numberFmt(data.totals.projects)}
          hint={`${numberFmt(data.totals.deployedProjects)} ${t(
            "dashboard.kpi.deployedProjects",
          ).toLowerCase()}`}
          icon={<Folder size={16} />}
        />
        <KPITile
          label={t("dashboard.kpi.todaySignups")}
          value={numberFmt(data.today.signups)}
          icon={<UserPlus size={16} />}
        />
        <KPITile
          label={t("dashboard.kpi.todayCredits")}
          value={numberFmt(data.today.creditsConsumed)}
          icon={<Coins size={16} />}
        />
        <KPITile
          label={t("dashboard.kpi.todaySpend")}
          value={`$${numberFmt(data.today.providerSpendUsd)}`}
          icon={<DollarSign size={16} />}
        />
        <KPITile
          label="Failed generations today"
          value={numberFmt(data.today.failedGenerations)}
          icon={<AlertTriangle size={16} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SparkCard
          title={t("dashboard.chart.signups")}
          series={data.timeseries.signupsLast30d}
        />
        <SparkCard
          title={t("dashboard.chart.credits")}
          series={data.timeseries.creditsConsumedLast30d}
        />
        <SparkCard
          title={t("dashboard.chart.spend")}
          series={data.timeseries.providerSpendUsdLast30d}
          prefix="$"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card
          title={t("dashboard.margin.title")}
          className="lg:col-span-1"
        >
          {data.margin30d ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t("dashboard.margin.creditsCharged")}
                </dt>
                <dd className="font-medium">
                  {numberFmt(data.margin30d.totalCreditsCharged)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t("dashboard.margin.providerCost")}
                </dt>
                <dd className="font-medium">
                  ${numberFmt(data.margin30d.totalCostUsd)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t("dashboard.margin.implied")}
                </dt>
                <dd className="font-medium">
                  {numberFmt(data.margin30d.creditsPerUsdImplied)}
                </dd>
              </div>
            </dl>
          ) : (
            <div className="text-xs text-muted-foreground">
              {t("common.empty")}
            </div>
          )}
        </Card>
        <Card
          title={t("dashboard.providerHealth")}
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {providerEntries.map(([provider, h]) => {
              const healthy =
                h.successes24h > 0 && h.failures24h / Math.max(1, h.successes24h) < 0.5;
              const tone = healthy
                ? "success"
                : h.failures24h > 0
                  ? "danger"
                  : "neutral";
              return (
                <div
                  key={provider}
                  className="rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold capitalize">
                      {provider}
                    </div>
                    <StatusDot tone={tone} />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                    <div>{t("dashboard.provider.s24")}</div>
                    <div className="text-right text-foreground">
                      {h.successes24h}
                    </div>
                    <div>{t("dashboard.provider.f24")}</div>
                    <div className="text-right text-foreground">
                      {h.failures24h}
                    </div>
                    <div>{t("dashboard.provider.lastSuccess")}</div>
                    <div className="text-right text-foreground">
                      {h.lastSuccessAt
                        ? formatShortDateTime(h.lastSuccessAt, lang)
                        : "—"}
                    </div>
                    <div>{t("dashboard.provider.lastFailure")}</div>
                    <div className="text-right text-foreground">
                      {h.lastFailureAt
                        ? formatShortDateTime(h.lastFailureAt, lang)
                        : "—"}
                    </div>
                  </div>
                  <div className="mt-2">
                    <Badge tone={tone}>
                      {tone === "success"
                        ? "healthy"
                        : tone === "danger"
                          ? "degraded"
                          : "idle"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

interface SparkCardProps {
  title: string;
  series: Array<{ date: string; value: number }>;
  prefix?: string;
}

const SparkCard = ({ title, series, prefix = "" }: SparkCardProps) => {
  const total = series.reduce((acc, r) => acc + (r.value || 0), 0);
  return (
    <Card title={title}>
      <div className="text-2xl font-semibold mb-2">
        {prefix}
        {numberFmt(total)}
      </div>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickFormatter={(v: string) => v.slice(5)}
              stroke="currentColor"
              strokeOpacity={0.3}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "rgba(0,0,0,0.8)",
                border: "none",
                borderRadius: 6,
                fontSize: 11,
                color: "#fff",
              }}
              formatter={(v) => [
                `${prefix}${numberFmt(Number(v ?? 0))}`,
                title,
              ]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="currentColor"
              strokeOpacity={0.75}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default DashboardPage;
