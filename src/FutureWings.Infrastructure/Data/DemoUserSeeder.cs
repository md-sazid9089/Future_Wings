using System.Text;
using FutureWings.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using DomainApplication = FutureWings.Domain.Entities.Application;

namespace FutureWings.Infrastructure.Data;

public static class DemoUserSeeder
{
    public static async Task SeedAsync(FutureWingsDbContext context, bool seedStaffAccounts = false)
    {
        // Privileged staff accounts (Admin / Agent) are only seeded when explicitly enabled.
        if (seedStaffAccounts)
        {
            // Seed Admin User
            var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "admin@futurewings.io");
            if (adminUser is null)
            {
                var adminHash = BCrypt.Net.BCrypt.HashPassword("Password123!");
                adminUser = new User
                {
                    Email = "admin@futurewings.io",
                    PasswordHash = adminHash,
                    Role = "Admin",
                    SubscriptionTier = "Premium",
                    SubscriptionRenewsAt = DateTimeOffset.UtcNow.AddYears(1),
                    Profile = new UserProfile
                    {
                        FirstName = "Sarah",
                        LastName = "Jenkins",
                        Major = "Higher Education Administration",
                        DegreeLevel = "Doctorate"
                    }
                };
                context.Users.Add(adminUser);
            }
            else
            {
                adminUser.Role = "Admin";
            }

            // Seed Country Agent User
            var agentUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "agent@futurewings.io");
            if (agentUser is null)
            {
                var agentHash = BCrypt.Net.BCrypt.HashPassword("Password123!");
                agentUser = new User
                {
                    Email = "agent@futurewings.io",
                    PasswordHash = agentHash,
                    Role = "Agent",
                    SubscriptionTier = "Pro",
                    SubscriptionRenewsAt = DateTimeOffset.UtcNow.AddYears(1),
                    Profile = new UserProfile
                    {
                        FirstName = "Marcus",
                        LastName = "Vance",
                        Major = "International Student Admissions",
                        DegreeLevel = "Master's"
                    }
                };
                context.Users.Add(agentUser);
            }
            else
            {
                agentUser.Role = "Agent";
            }
            await context.SaveChangesAsync();
        }

        const string demoEmail = "demo@futurewings.io";
        var demoUser = await context.Users
            .Include(u => u.Profile)
            .Include(u => u.Applications)
            .Include(u => u.Deadlines)
            .Include(u => u.SavedPrograms)
            .Include(u => u.Documents)
            .Include(u => u.Notifications)
            .Include(u => u.Payments)
            .FirstOrDefaultAsync(u => u.Email == demoEmail);

        if (demoUser is null)
        {
            // Bcrypt hash for "Password123!"
            var passwordHash = BCrypt.Net.BCrypt.HashPassword("Password123!");
            demoUser = new User
            {
                Email = demoEmail,
                PasswordHash = passwordHash,
                Role = "Student",
                SubscriptionTier = "Premium",
                SubscriptionRenewsAt = DateTimeOffset.UtcNow.AddMonths(1),
                StripeCustomerId = "cus_demo_alex_morgan",
                HasSeededDeadlines = true,
                Profile = new UserProfile
                {
                    FirstName = "Alex",
                    LastName = "Morgan",
                    Major = "Computer Science",
                    DegreeLevel = "Master's",
                    Cgpa = 3.88m,
                    BudgetUsd = 45000m
                }
            };
            context.Users.Add(demoUser);
            await context.SaveChangesAsync();
        }
        else
        {
            demoUser.SubscriptionTier = "Premium";
            demoUser.SubscriptionRenewsAt = DateTimeOffset.UtcNow.AddMonths(1);
            if (demoUser.Profile is null)
            {
                demoUser.Profile = new UserProfile
                {
                    UserId = demoUser.Id,
                    FirstName = "Alex",
                    LastName = "Morgan",
                    Major = "Computer Science",
                    DegreeLevel = "Master's",
                    Cgpa = 3.88m,
                    BudgetUsd = 45000m
                };
            }
            else
            {
                demoUser.Profile.FirstName = "Alex";
                demoUser.Profile.LastName = "Morgan";
                demoUser.Profile.Major = "Computer Science";
                demoUser.Profile.DegreeLevel = "Master's";
                demoUser.Profile.Cgpa = 3.88m;
                demoUser.Profile.BudgetUsd = 45000m;
            }
            await context.SaveChangesAsync();
        }

        var userId = demoUser.Id;

        // 1. Seed Applications in various states
        var states = await context.ApplicationStates.ToListAsync();
        var draftState = states.FirstOrDefault(s => s.Name == "Draft") ?? states.First();
        var submittedState = states.FirstOrDefault(s => s.Name == "Submitted") ?? draftState;
        var underReviewState = states.FirstOrDefault(s => s.Name == "Under Review") ?? submittedState;
        var acceptedState = states.FirstOrDefault(s => s.Name == "Accepted") ?? underReviewState;

        var programs = await context.Programs.Include(p => p.University).ToListAsync();
        var uOfTProgram = programs.FirstOrDefault(p => p.Name.Contains("Computer Science") && p.University.Name.Contains("Toronto"));
        var tumProgram = programs.FirstOrDefault(p => p.Name.Contains("Informatics") && p.University.Name.Contains("Munich"));
        var stanfordProgram = programs.FirstOrDefault(p => p.Name.Contains("Computer Science") && p.University.Name.Contains("Stanford"));
        var oxfordProgram = programs.FirstOrDefault(p => p.Name.Contains("Computer Science") && p.University.Name.Contains("Oxford"));
        var ethProgram = programs.FirstOrDefault(p => p.Name.Contains("Computer Science") && p.University.Name.Contains("ETH Zurich"));

        var appSeeds = new List<(Domain.Entities.Program? Program, ApplicationState State, int DaysAgo)>
        {
            (tumProgram, acceptedState, 25),
            (uOfTProgram, underReviewState, 18),
            (stanfordProgram, submittedState, 10),
            (oxfordProgram, draftState, 3),
            (ethProgram, draftState, 1)
        };

        foreach (var (prog, state, daysAgo) in appSeeds)
        {
            if (prog is null) continue;
            var existingApp = await context.Applications.FirstOrDefaultAsync(a => a.UserId == userId && a.ProgramId == prog.Id);
            if (existingApp is null)
            {
                context.Applications.Add(new DomainApplication
                {
                    UserId = userId,
                    ProgramId = prog.Id,
                    ApplicationStateId = state.Id,
                    SubmittedAt = DateTimeOffset.UtcNow.AddDays(-daysAgo)
                });
            }
            else
            {
                existingApp.ApplicationStateId = state.Id;
            }
        }
        await context.SaveChangesAsync();

        // 2. Seed Saved Programs
        var waterlooProg = programs.FirstOrDefault(p => p.University.Name.Contains("Waterloo"));
        var imperialProg = programs.FirstOrDefault(p => p.University.Name.Contains("Imperial"));
        var melbourneProg = programs.FirstOrDefault(p => p.University.Name.Contains("Melbourne"));
        var kthProg = programs.FirstOrDefault(p => p.University.Name.Contains("KTH"));

        var savedProgs = new[] { waterlooProg, imperialProg, melbourneProg, kthProg };
        foreach (var p in savedProgs)
        {
            if (p is null) continue;
            var existingSaved = await context.SavedPrograms.FirstOrDefaultAsync(sp => sp.UserId == userId && sp.ProgramId == p.Id);
            if (existingSaved is null)
            {
                context.SavedPrograms.Add(new SavedProgram
                {
                    UserId = userId,
                    ProgramId = p.Id
                });
            }
        }
        await context.SaveChangesAsync();

        // 3. Seed Deadlines
        var deadlineSeeds = new[]
        {
            ("Statement of Purpose Polish & Peer Review", "Documents", "Review Stanford & U of T SOP drafts with mentor", 4, false),
            ("Vanier Canada & DAAD Scholarship Submissions", "Scholarships", "Submit academic reference letters and research proposal", 8, false),
            ("IELTS Academic TRF Score Transmission", "Tests", "Official band 8.5 score report sent to universities", 15, true),
            ("Official Sealed Transcripts Verification", "Applications", "Request university registrar to verify electronic transcripts via WES", 22, false),
            ("Student Visa Financial Guarantee & Bank Statement", "Visa", "Prepare 12-month living expense proof for visa application", 35, false)
        };

        foreach (var (title, category, notes, dueInDays, isCompleted) in deadlineSeeds)
        {
            var existingDeadline = await context.Deadlines.FirstOrDefaultAsync(d => d.UserId == userId && d.Title == title);
            if (existingDeadline is null)
            {
                context.Deadlines.Add(new Deadline
                {
                    UserId = userId,
                    Title = title,
                    Category = category,
                    Notes = notes,
                    DueAt = DateTimeOffset.UtcNow.AddDays(dueInDays),
                    CreatedAt = DateTimeOffset.UtcNow.AddDays(-10),
                    CompletedAt = isCompleted ? DateTimeOffset.UtcNow.AddDays(-2) : null
                });
            }
        }
        await context.SaveChangesAsync();

        // 4. Seed Documents
        var storageRoot = Path.Combine(Directory.GetCurrentDirectory(), "App_Data", "documents");
        Directory.CreateDirectory(storageRoot);

        var docSeeds = new[]
        {
            ("Alex_Morgan_Academic_Transcript_Official.pdf", "application/pdf", 1845000L),
            ("Statement_of_Purpose_AI_Research_2026.pdf", "application/pdf", 432000L),
            ("Letter_of_Recommendation_Prof_Hamilton.pdf", "application/pdf", 285000L),
            ("Resume_Alex_Morgan_Software_Engineer.pdf", "application/pdf", 312000L),
            ("IELTS_Academic_Score_Report_8.5.pdf", "application/pdf", 548000L)
        };

        foreach (var (fileName, contentType, size) in docSeeds)
        {
            var existingDoc = await context.Documents.FirstOrDefaultAsync(d => d.UserId == userId && d.FileName == fileName);
            if (existingDoc is null)
            {
                var storedFileName = $"{Guid.NewGuid():N}.pdf";
                var fullFilePath = Path.Combine(storageRoot, storedFileName);
                if (!File.Exists(fullFilePath))
                {
                    var dummyContent = Encoding.UTF8.GetBytes($"%PDF-1.4 Mock PDF Document Content for {fileName} - FutureWings Student Vault");
                    await File.WriteAllBytesAsync(fullFilePath, dummyContent);
                }

                context.Documents.Add(new Document
                {
                    UserId = userId,
                    FileName = fileName,
                    FilePath = storedFileName,
                    ContentType = contentType,
                    SizeBytes = size,
                    UploadedAt = DateTimeOffset.UtcNow.AddDays(-Random.Shared.Next(2, 20))
                });
            }
        }
        await context.SaveChangesAsync();

        // 5. Seed Notifications
        var notifSeeds = new[]
        {
            ("?? Congratulations! Your application to Technical University of Munich is Accepted!", false),
            ("?? University of Toronto has updated your application status to Under Review.", false),
            ("? Reminder: Statement of Purpose Polish is due in 4 days.", true),
            ("?? Welcome to FutureWings Pro! All AI and premium tools are active.", true)
        };

        foreach (var (message, isRead) in notifSeeds)
        {
            var existingNotif = await context.Notifications.FirstOrDefaultAsync(n => n.UserId == userId && n.Message == message);
            if (existingNotif is null)
            {
                context.Notifications.Add(new Notification
                {
                    UserId = userId,
                    Message = message,
                    IsRead = isRead
                });
            }
        }
        await context.SaveChangesAsync();

        // 6. Seed Payments
        var existingPayment = await context.Payments.FirstOrDefaultAsync(p => p.UserId == userId);
        if (existingPayment is null)
        {
            context.Payments.Add(new Payment
            {
                UserId = userId,
                Amount = 9.00m,
                Currency = "usd",
                Status = "Succeeded",
                Reference = "ch_demo_alex_morgan_pro_tier",
                CreatedAt = DateTimeOffset.UtcNow.AddDays(-15)
            });
            await context.SaveChangesAsync();
        }
    }
}
