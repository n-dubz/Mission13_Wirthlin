using Microsoft.EntityFrameworkCore;
using Mission11_Wirthlin.API.Data;
using Mission11_Wirthlin.API.Models;

var builder = WebApplication.CreateBuilder(args);

/* ------------  SERVICES  ------------ */
builder.Services.AddControllers();

// Configure database path for Azure
var dbPath = builder.Configuration.GetConnectionString("BookstoreDB")!
    .Replace("%HOME%", Environment.GetEnvironmentVariable("HOME") ?? Directory.GetCurrentDirectory());

// Ensure data directory exists
var dataDirectory = Path.GetDirectoryName(dbPath)!;
Directory.CreateDirectory(dataDirectory); // Create if it doesn't exist

builder.Services.AddDbContext<BookstoreContext>(options =>
{
    options.UseSqlite($"Data Source={dbPath}");
});

builder.Services.AddCors(o =>
{
    o.AddDefaultPolicy(p => p.AllowAnyOrigin()
        .AllowAnyMethod()
        .AllowAnyHeader());
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

/* ------------  PIPELINE  ------------ */
app.UseDefaultFiles();   // index.html
app.UseStaticFiles();    // React build
app.UseRouting();
app.UseCors();
app.UseAuthorization();

app.MapControllers();               // /api/…
app.MapFallbackToFile("index.html");// SPA routes

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

/* ------------  DB  ------------ */
// Initialize database and seed data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    
    try
    {
        logger.LogInformation("Database path: {DbPath}", dbPath);
        var context = services.GetRequiredService<BookstoreContext>();
        
        // Ensure database exists
        logger.LogInformation("Creating database if it doesn't exist...");
        await context.Database.EnsureCreatedAsync();
        logger.LogInformation("Database check completed");

        // Check if we need to seed data
        if (!await context.Books.AnyAsync())
        {
            logger.LogInformation("Database is empty. Seeding initial data...");
            var initialBooks = new[]
            {
                new Book
                {
                    Title = "The Way of Kings",
                    Author = "Brandon Sanderson",
                    Publisher = "Tor Books",
                    ISBN = "978-0765326355",
                    Classification = "Fiction",
                    Category = "Fantasy",
                    PageCount = 1007,
                    Price = 24.99m
                },
                new Book
                {
                    Title = "Clean Code",
                    Author = "Robert C. Martin",
                    Publisher = "Prentice Hall",
                    ISBN = "978-0132350884",
                    Classification = "Non-Fiction",
                    Category = "Technology",
                    PageCount = 464,
                    Price = 44.99m
                },
                new Book
                {
                    Title = "The Hobbit",
                    Author = "J.R.R. Tolkien",
                    Publisher = "Houghton Mifflin",
                    ISBN = "978-0547928227",
                    Classification = "Fiction",
                    Category = "Fantasy",
                    PageCount = 300,
                    Price = 14.99m
                },
                new Book
                {
                    Title = "1984",
                    Author = "George Orwell",
                    Publisher = "Signet Classic",
                    ISBN = "978-0451524935",
                    Classification = "Fiction",
                    Category = "Classic",
                    PageCount = 328,
                    Price = 9.99m
                },
                new Book
                {
                    Title = "Dune",
                    Author = "Frank Herbert",
                    Publisher = "Ace",
                    ISBN = "978-0441172719",
                    Classification = "Fiction",
                    Category = "Science Fiction",
                    PageCount = 896,
                    Price = 19.99m
                }
            };

            await context.Books.AddRangeAsync(initialBooks);
            await context.SaveChangesAsync();
            logger.LogInformation("Initial data seeded successfully");
        }
        else
        {
            logger.LogInformation("Database already contains data, skipping seed");
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while initializing the database. Path: {DbPath}", dbPath);
        throw; // Rethrow to prevent the app from starting with a broken database
    }
}

app.Run();