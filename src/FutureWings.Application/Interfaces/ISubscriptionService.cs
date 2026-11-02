using FutureWings.Application.DTOs.Subscription;

namespace FutureWings.Application.Interfaces;

public interface ISubscriptionService
{
    IReadOnlyList<SubscriptionPlanDto> GetPlans();
    Task<SubscriptionStatusDto> GetStatusAsync(int userId);
    Task<CheckoutSessionDto> CreateCheckoutSessionAsync(int userId, string tier, string returnUrl);
    /// Applies a verified Stripe event. Returns true when it changed something.
    Task<bool> ApplyWebhookAsync(string payload, string signatureHeader);

    /// <summary>
    /// Grants a tier WITHOUT taking payment, for local development and demos.
    /// Implementations must refuse unless simulation is explicitly enabled.
    /// </summary>
    Task<SubscriptionStatusDto> SimulateUpgradeAsync(int userId, string tier);

    /// <summary>
    /// Demo-mode action to unlock Pro plan without real payment.
    /// Strictly refused in Production. Grants only Pro entitlements and is idempotent.
    /// </summary>
    Task<SubscriptionStatusDto> UnlockProDemoAsync(int userId);

    /// <summary>
    /// Demo-mode action to unlock Pro or Premium plan without real payment.
    /// Strictly refused in Production. Grants corresponding entitlements and is idempotent.
    /// </summary>
    Task<SubscriptionStatusDto> UnlockDemoPlanAsync(int userId, string tier);
}
