using System.Security.Claims;
using FutureWings.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FutureWings.Web.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SubscriptionController(ISubscriptionService subscriptionService) : ControllerBase
{
    /// Public pricing information — no account needed to see what the plans cost.
    [AllowAnonymous]
    [HttpGet("plans")]
    public IActionResult GetPlans() => Ok(subscriptionService.GetPlans());

    /// The caller's own tier and feature entitlements.
    [HttpGet("me")]
    public async Task<IActionResult> GetMine()
    {
        try
        {
            return Ok(await subscriptionService.GetStatusAsync(GetUserId()));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("checkout")]
    public async Task<IActionResult> CreateCheckout(CheckoutRequest request)
    {
        try
        {
            var origin = $"{Request.Scheme}://{Request.Host}";
            var returnUrl = string.IsNullOrWhiteSpace(request.ReturnUrl) ? origin : request.ReturnUrl;
            return Ok(await subscriptionService.CreateCheckoutSessionAsync(GetUserId(), request.Tier, returnUrl));
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException exception)
        {
            // Stripe keys or price ids missing: the feature is unavailable rather than broken.
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = exception.Message });
        }
    }

    /// <summary>
    /// Development-only fake checkout. Grants the tier without taking payment.
    /// Returns 503 unless simulation is explicitly enabled and no real Stripe key exists,
    /// so this endpoint is inert in any environment configured for real payments.
    /// </summary>
    [HttpPost("simulate-checkout")]
    public async Task<IActionResult> SimulateCheckout(CheckoutRequest request)
    {
        try
        {
            return Ok(await subscriptionService.SimulateUpgradeAsync(GetUserId(), request.Tier));
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException exception)
        {
            return Problem(
                detail: exception.Message,
                statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Simulated Checkout Unavailable");
        }
    }

    /// <summary>
    /// Demo-mode action to unlock Pro or Premium tier without taking real payment.
    /// Strictly refused in Production with standard ProblemDetails.
    /// Idempotent: repeated calls do not create duplicate payments or conflicting entitlements.
    /// </summary>
    [HttpPost("demo-unlock")]
    public async Task<IActionResult> UnlockDemo([FromBody] DemoUnlockRequest request)
    {
        try
        {
            return Ok(await subscriptionService.UnlockDemoPlanAsync(GetUserId(), request.Tier));
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException exception)
        {
            return Problem(
                detail: exception.Message,
                statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Demo Mode Unavailable");
        }
    }

    /// <summary>
    /// Demo-mode action to unlock Pro tier and Roadmap entitlements without taking real payment.
    /// Strictly refused in Production with standard ProblemDetails.
    /// Idempotent: repeated calls do not create duplicate payments or conflicting entitlements.
    /// </summary>
    [HttpPost("demo-pro")]
    public async Task<IActionResult> UnlockProDemo()
    {
        try
        {
            return Ok(await subscriptionService.UnlockProDemoAsync(GetUserId()));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException exception)
        {
            return Problem(
                detail: exception.Message,
                statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Demo Mode Unavailable");
        }
    }

    /// <summary>
    /// Stripe calls this. Anonymous by necessity — Stripe has no bearer token — but the
    /// payload signature is verified against Stripe:WebhookSecret before anything is
    /// applied, so an unsigned request can never grant a tier.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook()
    {
        using var reader = new StreamReader(Request.Body);
        var payload = await reader.ReadToEndAsync();
        var signature = Request.Headers["Stripe-Signature"].ToString();

        try
        {
            var applied = await subscriptionService.ApplyWebhookAsync(payload, signature);
            return Ok(new { applied });
        }
        catch (InvalidOperationException exception)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = exception.Message });
        }
        catch (Stripe.StripeException)
        {
            // Signature verification failed.
            return BadRequest(new { message = "Invalid Stripe signature." });
        }
    }

    private int GetUserId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(value, out var userId)
            ? userId
            : throw new UnauthorizedAccessException("The authenticated user identifier is invalid.");
    }

    public sealed record CheckoutRequest(string Tier, string? ReturnUrl);
    public sealed record DemoUnlockRequest(string Tier);
}
