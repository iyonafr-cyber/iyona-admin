import { httpClient } from "../../../api/httpClient";
import { API_ENDPOINTS } from "../../../api/endpoints";

/**
 * Plans the admin UI is allowed to grant manually. Mirrors
 * `GRANTABLE_PLAN_IDS` in iyona-backend's
 * `manual-subscriptions.controller.ts` (free is intentionally excluded).
 */
export type GrantablePlanId = "starter" | "builder" | "pro" | "elite";

export const GRANTABLE_PLAN_IDS: ReadonlyArray<GrantablePlanId> = [
  "starter",
  "builder",
  "pro",
  "elite",
];

/**
 * Per-plan monthly credit quota. Mirrors `PLANS[*].credits` in
 * iyona-backend's `src/credits/constants/plans.ts`. Used by the admin
 * UI to render the "grants N credits" preview without an extra fetch.
 *
 * Update both sides if a plan's credits change.
 */
export const PLAN_MONTHLY_CREDITS: Record<GrantablePlanId, number> = {
  starter: 120, // 100 message + floor(2000/100) = 120
  builder: 350, // 250 + 100
  pro: 700, // 500 + 200
  elite: 1700, // 1200 + 500
};

/** Currency whitelist mirrored from the backend DTO. */
export const ALLOWED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "PKR",
  "CAD",
  "AUD",
] as const;
export type AllowedCurrency = (typeof ALLOWED_CURRENCIES)[number];

export interface GrantManualSubscriptionPayload {
  planId: GrantablePlanId;
  months: number;
  amountPaidCents: number;
  currency?: AllowedCurrency;
  note?: string;
  /**
   * Required when the target user already has an active Stripe
   * subscription. The grant goes through but Stripe is NOT cancelled —
   * the operator is expected to handle that out-of-band.
   */
  overrideStripe?: boolean;
}

export interface ManualSubscriptionGrantResponse {
  planId: GrantablePlanId;
  startedAt: string;
  expiresAt: string;
  months: number;
  amountPaidCents: number;
  currency: string;
  grantedBy: string;
  note: string | null;
  creditsGranted: number;
}

export interface RevokeManualSubscriptionPayload {
  reason?: string;
}

/** Backend conflict shape when user already has an active Stripe sub. */
export interface ManualSubscriptionStripeConflict {
  code: "USER_HAS_ACTIVE_STRIPE_SUBSCRIPTION";
  message: string;
  stripeSubscriptionId: string;
}

export class ManualSubscriptionsService {
  static async grant(
    userId: string,
    payload: GrantManualSubscriptionPayload,
  ): Promise<ManualSubscriptionGrantResponse> {
    const res = await httpClient.post<{
      data: ManualSubscriptionGrantResponse;
    }>(API_ENDPOINTS.ADMIN.USER_MANUAL_SUBSCRIPTION(userId), payload);
    return res.data;
  }

  static async revoke(
    userId: string,
    payload: RevokeManualSubscriptionPayload = {},
  ): Promise<void> {
    // axios.delete supports a `data` body for endpoints that semantically
    // accept a payload (e.g. "reason for revocation").
    await httpClient.delete(
      API_ENDPOINTS.ADMIN.USER_MANUAL_SUBSCRIPTION(userId),
      { data: payload },
    );
  }
}
