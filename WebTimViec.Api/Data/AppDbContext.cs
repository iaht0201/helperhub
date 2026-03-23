using Microsoft.EntityFrameworkCore;
using WebTimViec.Api.Entities;

namespace WebTimViec.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        [DbFunction("unaccent", IsBuiltIn = false)]
        public static string Unaccent(string text) => throw new NotSupportedException();

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<JobPost> JobPosts { get; set; }
        public DbSet<JobCategory> JobCategories { get; set; }
        public DbSet<Application> Applications { get; set; }
        public DbSet<Subscription> Subscriptions { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<ServicePackage> ServicePackages { get; set; } = null!;
        public DbSet<UserJobView> UserJobViews { get; set; } = null!;
        public DbSet<Notification> Notifications { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Any specific model configuration
            modelBuilder.Entity<JobPost>()
                .Property(p => p.Salary)
                .HasColumnType("decimal(18,2)");
                
            // Configure FK relations
            modelBuilder.Entity<Application>()
                .HasOne(a => a.JobPost)
                .WithMany()
                .HasForeignKey(a => a.JobPostId)
                .OnDelete(DeleteBehavior.Cascade);
                
            modelBuilder.Entity<Application>()
                .HasOne(a => a.Applicant)
                .WithMany()
                .HasForeignKey(a => a.ApplicantId)
                .OnDelete(DeleteBehavior.Cascade);
                
            modelBuilder.Entity<Subscription>()
                .HasOne(s => s.User)
                .WithMany(u => u.Subscriptions)
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
  
  
  
  
    }
}
