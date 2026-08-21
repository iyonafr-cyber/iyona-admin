import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  ShieldAlert,
  Ban,
  CheckCircle,
  LogOut,
  Mail,
  Trash2,
  Coins,
  CalendarClock,
  Gift,
} from "lucide-react";
import axios from "axios";
import Card from "../../components/ui/Card";
import Button from "../../components/button/Button";
import Badge from "../../components/ui/Badge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Modal from "../../components/ui/Modal";
import Table from "../../components/ui/Table";
import { useAsync } from "../../hooks/useAsync";
import { UsersService } from "../../services/features/admin/UsersService";
import { CreditsService } from "../../services/features/admin/CreditsService";
import {
  ManualSubscriptionsService,
  GRANTABLE_PLAN_IDS,
  ALLOWED_CURRENCIES,
  PLAN_MONTHLY_CREDITS,
  type GrantablePlanId,
  type AllowedCurrency,
} from "../../services/features/admin/ManualSubscriptionsService";
import type { RootState } from "../../store/store";
import RouteNames from "../../utils/routing/RouteNames";
import { formatShortDateTime } from "../../utils/formatDate";
import { ToastService } from "../../services/toast";
import { getApiErrorMessage } from "../../api/getApiErrorMessage";

type ActionKey =
  | "promote"
  | "demote"
  | "suspend"
  | "unsuspend"
  | "forceLogout"
  | "resendVerification"
  | "softDelete"
  | null;

const UserDetailPage = () => {
  const { id = "" } = useParams<{ id: string }>();
  const { t } = useTranslation("admin");
  const navigate = useNavigate();
  const lang = useSelector((s: RootState) => s.language.current);

  const { data, loading, error, reload } = useAsync(
    () => UsersService.detail(id),
    [id],
  );

  const [action, setAction] = useState<ActionKey>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustBucket, setAdjustBucket] = useState<"monthly" | "topup">("topup");
  const [adjustReason, setAdjustReason] = useState("");
  const [busy, setBusy] = useState(false);

  // ── Manual subscription state ────────────────────────────────
  // Form state lives at the page level so the modal can stay a thin
  // controlled component (matches the "Adjust credits" modal above).
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantPlan, setGrantPlan] = useState<GrantablePlanId>("pro");
  const [grantMonths, setGrantMonths] = useState("1");
  const [grantAmount, setGrantAmount] = useState("");
  const [grantCurrency, setGrantCurrency] = useState<AllowedCurrency>("USD");
  const [grantNote, setGrantNote] = useState("");
  const [grantOverride, setGrantOverride] = useState(false);

  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");

  if (loading && !data) {
    return <div className="text-sm text-muted-foreground">{t("common.loading")}</div>;
  }
  if (error || !data) {
    return (
      <div className="text-sm text-red-500">
        {error ?? t("common.failed")}
      </div>
    );
  }

  const user = data.user;
  const isAdmin = user.role === "admin";

  // Read manualSubscription off the loose user object (the detail
  // endpoint returns the full user document as Record<string, unknown>).
  const manualSub = user.manualSubscription as
    | {
        planId: string;
        startedAt: string;
        expiresAt: string;
        months: number;
        amountPaidCents: number;
        currency: string;
        grantedBy: string;
        note: string | null;
      }
    | null
    | undefined;
  const manualActive =
    !!manualSub && new Date(manualSub.expiresAt).getTime() > Date.now();

  const closeAction = () => setAction(null);

  const resetGrantForm = () => {
    setGrantPlan("pro");
    setGrantMonths("1");
    setGrantAmount("");
    setGrantCurrency("USD");
    setGrantNote("");
    setGrantOverride(false);
  };

  const handleGrantManualSub = async () => {
    const months = Number(grantMonths);
    const amountDecimal = Number(grantAmount);
    if (!Number.isFinite(months) || months < 1 || months > 36) {
      ToastService.error(t("users.manualSub.errors.monthsInvalid"));
      return;
    }
    if (!Number.isFinite(amountDecimal) || amountDecimal < 0) {
      ToastService.error(t("users.manualSub.errors.amountInvalid"));
      return;
    }
    try {
      setBusy(true);
      await ManualSubscriptionsService.grant(id, {
        planId: grantPlan,
        months,
        // Stored as integer cents on the backend.
        amountPaidCents: Math.round(amountDecimal * 100),
        currency: grantCurrency,
        note: grantNote.trim() || undefined,
        overrideStripe: grantOverride,
      });
      ToastService.success(t("users.manualSub.toast.granted"));
      setGrantOpen(false);
      resetGrantForm();
      reload();
    } catch (err) {
      // Backend returns 409 with { code: 'USER_HAS_ACTIVE_STRIPE_SUBSCRIPTION' }
      // when the user has an active Stripe sub and override wasn't ticked.
      const responseData = axios.isAxiosError(err)
        ? (err.response?.data as { code?: string } | undefined)
        : undefined;
      if (responseData?.code === "USER_HAS_ACTIVE_STRIPE_SUBSCRIPTION") {
        ToastService.error(t("users.manualSub.errors.stripeConflict"));
      } else {
        ToastService.error(getApiErrorMessage(err, t("common.failed")));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRevokeManualSub = async () => {
    try {
      setBusy(true);
      await ManualSubscriptionsService.revoke(id, {
        reason: revokeReason.trim() || undefined,
      });
      ToastService.success(t("users.manualSub.toast.revoked"));
      setRevokeOpen(false);
      setRevokeReason("");
      reload();
    } catch (err) {
      ToastService.error(getApiErrorMessage(err, t("common.failed")));
    } finally {
      setBusy(false);
    }
  };

  const handlePatch = async (
    patch: Parameters<typeof UsersService.patch>[1],
    successMsg: string,
  ) => {
    try {
      setBusy(true);
      await UsersService.patch(id, patch);
      ToastService.success(successMsg);
      reload();
    } catch (err) {
      ToastService.error(getApiErrorMessage(err, t("common.failed")));
    } finally {
      setBusy(false);
      closeAction();
    }
  };

  const handleForceLogout = async () => {
    try {
      setBusy(true);
      await UsersService.forceLogout(id);
      ToastService.success(t("users.detail.forceLogout"));
      reload();
    } catch (err) {
      ToastService.error(getApiErrorMessage(err, t("common.failed")));
    } finally {
      setBusy(false);
      closeAction();
    }
  };

  const handleResend = async () => {
    try {
      setBusy(true);
      const res = await UsersService.resendVerification(id);
      ToastService.success(
        res?.sent
          ? `Verification email sent to ${res.email}`
          : "Verification email sent",
      );
    } catch (err) {
      ToastService.error(getApiErrorMessage(err, t("common.failed")));
    } finally {
      setBusy(false);
      closeAction();
    }
  };

  const handleAdjust = async () => {
    const amt = Number(adjustAmount);
    if (!amt || !adjustReason.trim()) return;
    try {
      setBusy(true);
      await CreditsService.adjust({
        userId: id,
        amount: amt,
        bucket: adjustBucket,
        reason: adjustReason.trim(),
      });
      ToastService.success(t("common.saved"));
      setAdjustOpen(false);
      setAdjustAmount("");
      setAdjustReason("");
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
        onClick={() => navigate(RouteNames.USERS)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        {t("users.title")}
      </button>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{user.email}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <Badge tone={isAdmin ? "primary" : "neutral"}>{user.role}</Badge>
            {user.isSuspended && <Badge tone="warning">suspended</Badge>}
            {user.isDeleted && <Badge tone="danger">deleted</Badge>}
            {!user.isVerified && <Badge tone="info">unverified</Badge>}
            <span className="text-muted-foreground">ID {user._id}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setAdjustOpen(true)} variant="secondary">
            <span className="inline-flex items-center gap-1">
              <Coins size={14} /> {t("users.detail.adjustCredits")}
            </span>
          </Button>
          {!manualActive && (
            <Button onClick={() => setGrantOpen(true)} variant="secondary">
              <span className="inline-flex items-center gap-1">
                <Gift size={14} /> {t("users.manualSub.actions.grant")}
              </span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title={t("users.detail.profile")} className="lg:col-span-2">
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
            <Field label="Plan" value={user.planId ?? "—"} />
            <Field
              label="Credits"
              value={`${data.stats.creditsBalance} / ${data.stats.topUpCredits}`}
            />
            <Field label="Projects" value={data.stats.projectsCount} />
            <Field
              label="Created"
              value={
                user.createdAt ? formatShortDateTime(user.createdAt, lang) : "—"
              }
            />
            <Field
              label="Last login"
              value={
                user.lastLoginAt
                  ? formatShortDateTime(user.lastLoginAt, lang)
                  : "—"
              }
            />
            <Field
              label="Stripe sub"
              value={user.stripeSubscriptionId ?? "—"}
            />
          </dl>
        </Card>

        <Card title={t("users.detail.danger")}>
          <div className="flex flex-col gap-2">
            {isAdmin ? (
              <ActionButton
                icon={<ShieldAlert size={14} />}
                label={t("users.detail.demote")}
                onClick={() => setAction("demote")}
              />
            ) : (
              <ActionButton
                icon={<ShieldAlert size={14} />}
                label={t("users.detail.promote")}
                onClick={() => setAction("promote")}
              />
            )}
            <ActionButton
              icon={user.isSuspended ? <CheckCircle size={14} /> : <Ban size={14} />}
              label={
                user.isSuspended
                  ? t("users.detail.unsuspend")
                  : t("users.detail.suspend")
              }
              onClick={() =>
                setAction(user.isSuspended ? "unsuspend" : "suspend")
              }
            />
            <ActionButton
              icon={<LogOut size={14} />}
              label={t("users.detail.forceLogout")}
              onClick={() => setAction("forceLogout")}
            />
            <ActionButton
              icon={<Mail size={14} />}
              label={t("users.detail.resendVerification")}
              onClick={() => setAction("resendVerification")}
            />
            <ActionButton
              icon={<Trash2 size={14} />}
              label={t("users.detail.softDelete")}
              onClick={() => setAction("softDelete")}
              danger
            />
          </div>
        </Card>
      </div>

      {manualActive && manualSub && (
        <Card
          title={
            <span className="inline-flex items-center gap-2">
              <CalendarClock size={16} className="text-blue-500" />
              {t("users.manualSub.title")}
              <Badge tone="info">{t("users.manualSub.current")}</Badge>
            </span>
          }
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
              <Field label={t("users.manualSub.plan")} value={manualSub.planId} />
              <Field
                label={t("users.manualSub.expires")}
                value={formatShortDateTime(manualSub.expiresAt, lang)}
              />
              <Field
                label={t("users.manualSub.months")}
                value={String(manualSub.months)}
              />
              <Field
                label={t("users.manualSub.paid")}
                value={`${manualSub.currency} ${(manualSub.amountPaidCents / 100).toFixed(2)}`}
              />
              <Field
                label={t("users.manualSub.grantedBy")}
                value={manualSub.grantedBy}
              />
              {manualSub.note && (
                <Field
                  label={t("users.manualSub.note")}
                  value={manualSub.note}
                />
              )}
            </dl>
            <Button
              onClick={() => setRevokeOpen(true)}
              variant="secondary"
              className="bg-red-600/90 text-white hover:bg-red-700"
            >
              {t("users.manualSub.actions.revoke")}
            </Button>
          </div>
        </Card>
      )}

      <Card title={t("users.detail.projects")}>
        <Table<Record<string, unknown> & { _id: string }>
          columns={[
            {
              key: "name",
              header: "Name",
              render: (p) => (p.name as string) ?? "(untitled)",
            },
            {
              key: "status",
              header: "Status",
              render: (p) => (p.status as string) ?? "—",
            },
            {
              key: "stage",
              header: "Stage",
              render: (p) => (p.stage as string) ?? "—",
            },
            {
              key: "createdAt",
              header: "Created",
              render: (p) =>
                p.createdAt
                  ? formatShortDateTime(p.createdAt as string, lang)
                  : "—",
            },
          ]}
          rows={data.recentProjects as Array<Record<string, unknown> & { _id: string }>}
          rowKey={(p) => p._id}
        />
      </Card>

      <Card title={t("users.detail.ledger")}>
        <Table<Record<string, unknown> & { _id: string }>
          columns={[
            {
              key: "when",
              header: "When",
              render: (r) =>
                formatShortDateTime(r.createdAt as string, lang),
            },
            {
              key: "type",
              header: "Type",
              render: (r) => <Badge tone="neutral">{String(r.type)}</Badge>,
            },
            {
              key: "amount",
              header: "Amount",
              align: "right",
              render: (r) => Number(r.amount).toLocaleString(),
            },
            {
              key: "reason",
              header: "Reason",
              render: (r) => (r.reason as string) ?? "—",
            },
          ]}
          rows={data.recentLedger as Array<Record<string, unknown> & { _id: string }>}
          rowKey={(r) => r._id}
        />
      </Card>

      <ConfirmDialog
        open={action === "promote"}
        onClose={closeAction}
        onConfirm={(reason) =>
          handlePatch({ role: "admin", reason }, t("common.saved"))
        }
        title={t("users.detail.promote")}
        description={`Promote ${user.email} to admin.`}
        requireReason
        destructive
        confirmLabel={t("common.confirm")}
        busy={busy}
      />
      <ConfirmDialog
        open={action === "demote"}
        onClose={closeAction}
        onConfirm={(reason) =>
          handlePatch({ role: "user", reason }, t("common.saved"))
        }
        title={t("users.detail.demote")}
        description={`Demote ${user.email} to user.`}
        requireReason
        destructive
        confirmLabel={t("common.confirm")}
        busy={busy}
      />
      <ConfirmDialog
        open={action === "suspend"}
        onClose={closeAction}
        onConfirm={(reason) =>
          handlePatch({ isSuspended: true, reason }, t("common.saved"))
        }
        title={t("users.detail.suspend")}
        requireReason
        destructive
        busy={busy}
      />
      <ConfirmDialog
        open={action === "unsuspend"}
        onClose={closeAction}
        onConfirm={(reason) =>
          handlePatch({ isSuspended: false, reason }, t("common.saved"))
        }
        title={t("users.detail.unsuspend")}
        requireReason
        busy={busy}
      />
      <ConfirmDialog
        open={action === "forceLogout"}
        onClose={closeAction}
        onConfirm={handleForceLogout}
        title={t("users.detail.forceLogout")}
        busy={busy}
      />
      <ConfirmDialog
        open={action === "resendVerification"}
        onClose={closeAction}
        onConfirm={handleResend}
        title={t("users.detail.resendVerification")}
        busy={busy}
      />
      <ConfirmDialog
        open={action === "softDelete"}
        onClose={closeAction}
        onConfirm={(reason) =>
          handlePatch({ isDeleted: true, reason }, t("common.saved"))
        }
        title={t("users.detail.softDelete")}
        requireReason
        destructive
        busy={busy}
      />

      <Modal
        open={grantOpen}
        onClose={() => {
          setGrantOpen(false);
        }}
        title={t("users.manualSub.form.title")}
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setGrantOpen(false)}
              disabled={busy}
            >
              {t("users.manualSub.form.cancel")}
            </Button>
            <Button
              onClick={() => void handleGrantManualSub()}
              disabled={
                busy ||
                !grantMonths ||
                grantAmount === "" ||
                Number(grantMonths) < 1
              }
            >
              {t("users.manualSub.form.submit")}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-muted-foreground">
                {t("users.manualSub.form.plan")}
              </span>
              <select
                value={grantPlan}
                onChange={(e) =>
                  setGrantPlan(e.target.value as GrantablePlanId)
                }
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {GRANTABLE_PLAN_IDS.map((p) => (
                  <option key={p} value={p}>
                    {p} ({PLAN_MONTHLY_CREDITS[p]} cr/mo)
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">
                {t("users.manualSub.form.months")}
              </span>
              <input
                type="number"
                min={1}
                max={36}
                value={grantMonths}
                onChange={(e) => setGrantMonths(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">
                {t("users.manualSub.form.amount")}
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={grantAmount}
                onChange={(e) => setGrantAmount(e.target.value)}
                placeholder="49.00"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">
                {t("users.manualSub.form.currency")}
              </span>
              <select
                value={grantCurrency}
                onChange={(e) =>
                  setGrantCurrency(e.target.value as AllowedCurrency)
                }
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {ALLOWED_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-xs text-muted-foreground">
              {t("users.manualSub.form.note")}
            </span>
            <textarea
              rows={2}
              value={grantNote}
              onChange={(e) => setGrantNote(e.target.value)}
              placeholder={t("users.manualSub.form.notePlaceholder")}
              maxLength={500}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>

          {user.stripeSubscriptionId && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={grantOverride}
                  onChange={(e) => setGrantOverride(e.target.checked)}
                  className="mt-0.5"
                />
                <span className="space-y-1">
                  <span className="block font-medium">
                    {t("users.manualSub.form.override")}
                  </span>
                  <span className="block text-amber-700/80 dark:text-amber-300/80">
                    {t("users.manualSub.form.overrideHelp")}
                  </span>
                </span>
              </label>
            </div>
          )}

          {grantMonths && Number(grantMonths) > 0 && (
            <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {t("users.manualSub.form.preview", {
                credits: (
                  Number(grantMonths) * PLAN_MONTHLY_CREDITS[grantPlan]
                ).toLocaleString(),
                date: new Date(
                  new Date().setMonth(
                    new Date().getMonth() + Number(grantMonths),
                  ),
                ).toLocaleDateString(lang),
              })}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={revokeOpen}
        onClose={() => setRevokeOpen(false)}
        title={t("users.manualSub.revokeConfirm.title")}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setRevokeOpen(false)}
              disabled={busy}
            >
              {t("users.manualSub.revokeConfirm.cancel")}
            </Button>
            <Button
              onClick={() => void handleRevokeManualSub()}
              disabled={busy}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {t("users.manualSub.revokeConfirm.submit")}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground mb-3">
          {t("users.manualSub.revokeConfirm.body")}
        </p>
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">
            {t("users.manualSub.revokeConfirm.reason")}
          </span>
          <textarea
            rows={3}
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            maxLength={500}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/50"
          />
        </label>
      </Modal>

      <Modal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title={t("users.adjust.title")}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdjustOpen(false)}>
              {t("common.close")}
            </Button>
            <Button
              onClick={() => void handleAdjust()}
              disabled={busy || !adjustAmount || !adjustReason.trim()}
            >
              {t("users.adjust.submit")}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs text-muted-foreground">
              {t("users.adjust.amount")}
            </span>
            <input
              type="number"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">
              {t("users.adjust.bucket")}
            </span>
            <select
              value={adjustBucket}
              onChange={(e) =>
                setAdjustBucket(e.target.value as "monthly" | "topup")
              }
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="topup">{t("users.adjust.topup")}</option>
              <option value="monthly">{t("users.adjust.monthly")}</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">
              {t("users.adjust.reason")}
            </span>
            <textarea
              rows={3}
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>
      </Modal>
    </div>
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

const ActionButton = ({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-xs font-medium transition-colors ${
      danger
        ? "text-red-600 hover:bg-red-500/10 hover:border-red-500/40"
        : "text-foreground hover:bg-muted"
    }`}
  >
    <span className="inline-flex items-center gap-2">
      {icon}
      {label}
    </span>
  </button>
);

export default UserDetailPage;
