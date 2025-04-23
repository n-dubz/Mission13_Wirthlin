using Microsoft.EntityFrameworkCore;
using Mission11_Wirthlin.API.Models;

namespace Mission11_Wirthlin.API.Data
{
    public class BookstoreContext : DbContext
    {
        public BookstoreContext(DbContextOptions<BookstoreContext> options) : base(options)
        {
        }

        public DbSet<Book> Books { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure the Book entity
            modelBuilder.Entity<Book>(entity =>
            {
                entity.HasKey(e => e.BookID);
                entity.Property(e => e.Title).IsRequired();
                entity.Property(e => e.Author).IsRequired();
                entity.Property(e => e.Publisher).IsRequired();
                entity.Property(e => e.ISBN).IsRequired();
                entity.Property(e => e.Classification).IsRequired();
                entity.Property(e => e.Category).IsRequired();
                entity.Property(e => e.PageCount).IsRequired();
                entity.Property(e => e.Price).IsRequired().HasColumnType("decimal(18,2)");
            });
        }
    }
}
