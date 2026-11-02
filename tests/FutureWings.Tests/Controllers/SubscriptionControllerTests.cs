using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FutureWings.Application.DTOs.Subscription;
using FutureWings.Domain.Entities;
using FutureWings.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;

namespace FutureWings.Tests.Controllers;

public class SubscriptionControllerTests : IClassFixture<FutureWingsWebFactory>
{
    private readonly HttpClient _client;
    private readonly FutureWingsWebFactory _factory;

    public SubscriptionControllerTests(FutureWingsWebFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task UnlockProDemo_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.PostAsync("/api/subscription/demo-pro", null);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UnlockProDemo_WithAuthenticatedUser_ReturnsOkAndUnlocksPro()
    {
        // Seed user into database
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FutureWingsDbContext>();
            if (!db.Users.Any(u => u.Id == 77))
            {
                db.Users.Add(new User
                {
                    Id = 77,
                    Email = "evaluator77@test.com",
                    PasswordHash = "hash",
                    Role = "Student",
                    SubscriptionTier = "Free"
                });
                await db.SaveChangesAsync();
            }
        }

        var token = FutureWingsWebFactory.GenerateTestToken(userId: 77, email: "evaluator77@test.com");
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/subscription/demo-pro");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var status = await response.Content.ReadFromJsonAsync<SubscriptionStatusDto>();
        Assert.NotNull(status);
        Assert.Equal("Pro", status.Tier);
        Assert.Contains("roadmap", status.Features);
        Assert.DoesNotContain("aiInterview", status.Features);
    }

    [Fact]
    public async Task UnlockProDemo_InProduction_ReturnsServiceUnavailableWithProblemDetails()
    {
        using var prodFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Production");
            builder.UseSetting("ASPNETCORE_ENVIRONMENT", "Production");
        });

        using var prodClient = prodFactory.CreateClient();
        var token = FutureWingsWebFactory.GenerateTestToken(userId: 1, email: "student1@test.com");
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/subscription/demo-pro");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await prodClient.SendAsync(request);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);

        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(503, problem.Status);
        Assert.Contains("disabled", problem.Detail ?? problem.Title ?? "", StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task UnlockDemo_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.PostAsJsonAsync("/api/subscription/demo-unlock", new { Tier = "Premium" });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UnlockDemo_WithAuthenticatedUser_ForPremium_ReturnsOkAndUnlocksPremium()
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<FutureWingsDbContext>();
            if (!db.Users.Any(u => u.Id == 88))
            {
                db.Users.Add(new User
                {
                    Id = 88,
                    Email = "evaluator88@test.com",
                    PasswordHash = "hash",
                    Role = "Student",
                    SubscriptionTier = "Free"
                });
                await db.SaveChangesAsync();
            }
        }

        var token = FutureWingsWebFactory.GenerateTestToken(userId: 88, email: "evaluator88@test.com");
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/subscription/demo-unlock")
        {
            Content = JsonContent.Create(new { Tier = "Premium" })
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var status = await response.Content.ReadFromJsonAsync<SubscriptionStatusDto>();
        Assert.NotNull(status);
        Assert.Equal("Premium", status.Tier);
        Assert.Contains("roadmap", status.Features);
        Assert.Contains("aiInterview", status.Features);
    }

    [Fact]
    public async Task UnlockDemo_InProduction_ReturnsServiceUnavailableWithProblemDetails()
    {
        using var prodFactory = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Production");
            builder.UseSetting("ASPNETCORE_ENVIRONMENT", "Production");
        });

        using var prodClient = prodFactory.CreateClient();
        var token = FutureWingsWebFactory.GenerateTestToken(userId: 1, email: "student1@test.com");
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/subscription/demo-unlock")
        {
            Content = JsonContent.Create(new { Tier = "Premium" })
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await prodClient.SendAsync(request);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);

        var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.NotNull(problem);
        Assert.Equal(503, problem.Status);
        Assert.Contains("disabled", problem.Detail ?? problem.Title ?? "", StringComparison.OrdinalIgnoreCase);
    }
}
