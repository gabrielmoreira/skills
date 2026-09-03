export class AppError extends Error {
  constructor(message, options = {}) {
    super(message, { cause: options.cause });
    this.name = this.constructor.name;
    this.code = options.code ?? "INTERNAL_ERROR";
    this.retryable = options.retryable ?? false;
    this.httpStatus = options.httpStatus ?? 500;
    this.details = options.details ?? {};
  }
}

/**
 * Raised during subscription renewal when the configured payment method
 * cannot be charged because it is expired, revoked, or invalid.
 * The failure semantics, HTTP status (402), retryability (false),
 * and metadata are settled.
 */
export class SubscriptionBillingPaymentMethodRevokedOrExpiredFailureException extends AppError {
  constructor(subscriptionId, paymentMethodId, declineReason, options = {}) {
    super(
      `Payment method ${paymentMethodId} for subscription ${subscriptionId} cannot be charged: ${declineReason}`,
      {
        code: "PAYMENT_METHOD_UNUSABLE",
        retryable: false,
        httpStatus: 402,
        cause: options.cause,
        details: {
          subscriptionId,
          paymentMethodId,
          declineReason,
        },
      },
    );
    this.subscriptionId = subscriptionId;
    this.paymentMethodId = paymentMethodId;
    this.declineReason = declineReason;
  }
}
