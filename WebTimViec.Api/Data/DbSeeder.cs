using System;
using System.Linq;
using System.Collections.Generic;
using WebTimViec.Api.Data;
using WebTimViec.Api.Entities;
using BCrypt.Net;
using WebTimViec.Api.Helpers;

namespace WebTimViec.Api.Data
{
    public static class DbSeeder
    {
        public static void Seed(AppDbContext context)
        {
            context.Database.EnsureCreated();

            // 1. Ensure basic demo setup exists
            
            foreach (var user in context.Users)
            {
                // Add default discovery preferences if missing
                if (string.IsNullOrEmpty(user.PreferredCategories))
                {
                    var demoCats = new[] { "IT", "Service", "Housekeeping", "Technical" };
                    user.PreferredCategories = string.Join(",", demoCats.OrderBy(x => Guid.NewGuid()).Take(2));
                    user.PreferredLocation = "Hồ Chí Minh";
                }
            }
            context.SaveChanges();

            string passwordHash = BCrypt.Net.BCrypt.HashPassword("Password123!");

            // 1. Đảm bảo có User Admin, Employers (Nhà tuyển dụng) và Workers
            var adminEmail = "admin@webtimviec.com";
            var adminUser = context.Users.FirstOrDefault(u => u.Email == adminEmail);
            if (adminUser == null)
            {
                adminUser = new User { Id = Guid.NewGuid(), Email = adminEmail, PasswordHash = passwordHash, Role = "Admin", WorkingRole = "Employer", FullName = "Quản trị viên Hệ thống", IsActive = true, IsEmailVerified = true };
                context.Users.Add(adminUser);
            }
            else
            {
                adminUser.Role = "Admin";
                adminUser.WorkingRole = "Employer"; // Internal role value is Employer, Display is Nhà tuyển dụng
                context.Users.Update(adminUser);
            }
            context.SaveChanges();

            var random = new Random();
            var employers = new List<User>();
            for (int i = 1; i <= 20; i++)
            {
                var email = $"employer_{i}@example.com";
                if (!context.Users.Any(u => u.Email == email))
                {
                    var user = new User { 
                        Id = Guid.NewGuid(), Email = email, PasswordHash = passwordHash, Role = "Employer", 
                        FullName = $"Nhà tuyển dụng {i}", Phone = $"090{random.Next(1000000, 9999999)}", 
                        Address = "Hồ Chí Minh", IsEmailVerified = true, CreatedAt = VNTime.Now.AddDays(-random.Next(1, 30))
                    };
                    context.Users.Add(user);
                    employers.Add(user);
                } else employers.Add(context.Users.First(u => u.Email == email));
            }

            var workers = new List<User>();
            for (int i = 1; i <= 50; i++)
            {
                var email = $"worker_{i}@example.com";
                if (!context.Users.Any(u => u.Email == email))
                {
                    var user = new User { 
                        Id = Guid.NewGuid(), Email = email, PasswordHash = passwordHash, Role = "Worker", 
                        FullName = $"Người lao động {i}", Phone = $"091{random.Next(1000000, 9999999)}", 
                        Address = "Hồ Chí Minh", IsEmailVerified = true, CreatedAt = VNTime.Now.AddDays(-random.Next(1, 30))
                    };
                    context.Users.Add(user);
                    workers.Add(user);
                } else workers.Add(context.Users.First(u => u.Email == email));
            }

            // 2. Định nghĩa các danh mục việc làm phổ thông đa dạng
            var categories = new[] {
                new { Type = "IT", Name = "IT / Phần mềm", Titles = new[] { "Tuyển lập trình viên ReactJS", "Tuyển nhân viên IT Support", "Junior .NET Developer", "Lập trình viên PHP/Laravel", "Tester/QA kiểm thử phần mềm" } },
                new { Type = "Architecture", Name = "Kiến trúc / Nội thất", Titles = new[] { "Tuyển kiến trúc sư công trình", "Họa viên kiến trúc 3D", "Nhân viên thiết kế nội thất", "Giám sát thi công nội thất", "Kiến trúc sư cảnh quan" } },
                new { Type = "Electrical", Name = "Điện / Điện dân dụng", Titles = new[] { "Tuyển thợ điện tòa nhà", "Lắp đặt điện mặt trời", "Thợ sửa điện gia dụng", "Kỹ thuật viên điện lạnh", "Thợ điện công nghiệp" } },
                new { Type = "Accounting", Name = "Kế toán", Titles = new[] { "Tuyển kế toán tổng hợp", "Kế toán kho Quận 12", "Thực tập sinh kế toán", "Kế toán thuế kinh nghiệm", "Nhân viên thu ngân siêu thị" } },
                new { Type = "Housekeeping", Name = "Giúp việc nhà", Titles = new[] { "Cần người giúp việc chung cư Quận 1", "Giúp việc sáng đi tối về Quận 7", "Tìm người dọn dẹp nhà cửa theo giờ", "Cần người nấu ăn gia đình", "Giúp việc ở lại bao ăn ở" } },
                new { Type = "Childcare", Name = "Trông trẻ", Titles = new[] { "Tuyển bảo mẫu chăm bé 2 tuổi", "Trông trẻ buổi tối tại nhà", "Tìm cô chăm bé kinh nghiệm", "Giáo viên mầm non trông trẻ tại nhà", "Bảo mẫu đưa đón bé đi học" } },
                new { Type = "Worker", Name = "Công nhân", Titles = new[] { "Tuyển công nhân may mặc lương cao", "Nam/Nữ đóng gói bánh kẹo", "Công nhân lắp ráp điện tử", "Thợ đứng máy sản xuất", "Công nhân chế biến thực phẩm" } },
                new { Type = "Driver", Name = "Tài xế / Giao hàng", Titles = new[] { "Tuyển tài xế xe tải bằng C", "Giao hàng xe máy nội thành", "Tài xế lái xe gia đình", "Tài xế container đường dài", "Nhân viên giao nhận kho vận" } },
                new { Type = "Security", Name = "Bảo vệ", Titles = new[] { "Tuyển bảo vệ tòa nhà", "Bảo vệ kho bãi 24/7", "Bảo vệ nhà hàng ca đêm", "Vệ sĩ riêng cho doanh nhân", "Nhân viên an ninh siêu thị" } },
                new { Type = "Sales", Name = "Bán hàng / Tư vấn", Titles = new[] { "Tuyển nhân viên bán hàng shop quần áo", "Tư vấn mỹ phẩm tại quầy", "Nhân viên trực quầy siêu thị", "Cộng tác viên bán hàng Online", "Nhân viên kinh doanh BĐS" } },
                new { Type = "Medical", Name = "Y tế / Chăm sóc", Titles = new[] { "Tuyển điều dưỡng chăm sóc tại nhà", "Nhân viên tư vấn dược phẩm", "Kỹ thuật viên vật lý trị liệu", "Y tá trực phòng khám", "Người chăm sóc bệnh nhân tại viện" } },
                new { Type = "Service", Name = "Nhà hàng / Dịch vụ", Titles = new[] { "Tuyển nhân viên phục vụ bàn", "Phụ bếp nhà hàng Á - Âu", "Nhân viên pha chế Cafe/Bartender", "Quản lý nhà hàng quy mô vừa", "Lễ tân khách sạn 3 sao" } },
                new { Type = "Technical", Name = "Thợ kỹ thuật", Titles = new[] { "Tìm thợ điện nước công trình", "Hỗ trợ lắp đặt máy lạnh", "Thợ phụ cơ khí lương ngày", "Thợ sửa chữa ô tô/xe máy", "Kỹ thuật viên bảo trì máy móc" } },
                new { Type = "Design", Name = "Thiết kế / Sáng tạo", Titles = new[] { "Tuyển Designer thiết kế Graphic", "Nhân viên Edit Video/Tiktok", "Thiết kế Banner/Quảng cáo", "Họa sĩ minh họa tự do", "Sáng tạo nội dung Content Creator" } }
            };

            var workerProfileTitles = new[] {
                new { Type = "IT", Titles = new[] { "Fullstack Developer (React/.NET) tìm việc", "IT Support kinh nghiệm 3 năm", "Nhận thiết kế Website, App mobile", "Lập trình viên Python tìm việc", "Nhận cài đặt phần mềm, sửa máy tính" } },
                new { Type = "Architecture", Titles = new[] { "KTS chuyên thiết kế nội thất chung cư", "Họa viên Revit/AutoCAD tìm việc", "Giám sát thi công hoàn thiện", "Thiết kế kiến trúc nhà phố đẹp" } },
                new { Type = "Electrical", Titles = new[] { "Thợ điện nước nhận thầu sửa chữa", "Thi công hệ thống điện thông minh", "Sửa chữa đồ gia dụng tại nhà", "Nhận lắp đặt camera, báo cháy" } },
                new { Type = "Accounting", Titles = new[] { "Kế toán trưởng tìm việc Part-time", "Nhận làm báo cáo thuế, sổ sách", "Kế toán kho/bán hàng kinh nghiệm", "Dịch vụ quyết toán thuế cuối năm" } },
                new { Type = "Housekeeping", Titles = new[] { "Nhận giúp việc dọn dẹp nhà cửa Q.1", "Giúp việc kinh nghiệm 5 năm", "Nam nhận dọn kho bãi, tạp vụ", "Nhận dọn nhà cuối tuần" } },
                new { Type = "Childcare", Titles = new[] { "Bảo mẫu kinh nghiệm chăm trẻ sơ sinh", "Nhận trông trẻ buổi tối tại nhà", "Giáo mầm non tìm việc trông trẻ", "Chăm bé theo giờ khu vực Quận 10" } },
                new { Type = "Driver", Titles = new[] { "Tài xế B2 tìm việc lái xe gia đình", "Shipper xe máy thông thuộc đường phố Q.3", "Tài xế xe tải tìm việc chạy đêm", "Nhận lái xe hộ người say" } },
                new { Type = "Design", Titles = new[] { "Designer nhận thiết kế Logo, Poster", "Dựng Video chuyên nghiệp cho Youtube", "Thiết kế 2D/3D theo yêu cầu" } },
                new { Type = "Technical", Titles = new[] { "Thợ điện nước nhận sửa chữa tại nhà", "Nhận thông tắc bồn cầu, ống nước", "Thợ phụ hồ, xây dựng cần tìm việc", "Thợ nhôm kính chuyên nghiệp" } }
            };
            
            var locations = new[] { "Quận 1, Hồ Chí Minh", "Quận 12, Hồ Chí Minh", "Cầu Giấy, Hà Nội", "Thanh Xuân, Hà Nội", "Hải Châu, Đà Nẵng", "Thuận An, Bình Dương", "TP. Biên Hòa, Đồng Nai" };
            var jobTypes = new[] { "Full-time", "Part-time", "Theo giờ", "Ở lại" };

            // 2. Seed Employer Jobs (100 tin) if empty
            if (!context.JobPosts.Any(j => !j.IsForWorker))
            {
                for (int i = 0; i < 100; i++)
            {
                var cat = categories[random.Next(categories.Length)];
                var location = locations[random.Next(locations.Length)];
                var jobType = jobTypes[random.Next(jobTypes.Length)];
                var title = cat.Titles[random.Next(cat.Titles.Length)];
                var salary = random.Next(5, 25) * 1000000 + random.Next(1, 10) * 100000;

                var catEntry = context.JobCategories.FirstOrDefault(c => c.Code == cat.Type);
                context.JobPosts.Add(new JobPost
                {
                    Id = Guid.NewGuid(),
                    UserId = employers[random.Next(employers.Count)].Id,
                    Title = title,
                    JobType = jobType,
                    ServiceType = cat.Type,
                    JobCategoryId = catEntry?.Id,
                    Salary = salary,
                    Location = location,
                    IsForWorker = false,
                    WorkingTime = "Linh hoạt ca",
                    CreatedAt = VNTime.Now.AddDays(-random.Next(0, 30)),
                    Description = $"Cần tuyển nhân sự vị trí {cat.Name} tại {location}. Môi trường làm việc chuyên nghiệp, đãi ngộ tốt.",
                    Skills = "Kinh nghiệm thực tế, Có trách nhiệm",
                    IsApproved = i < 95 // the last 5 are pending
                });
                }
            }

            // Sync categories for ANY jobs that don't have them yet
            var orphanJobs = context.JobPosts.Where(j => j.JobCategoryId == null).ToList();
            if (orphanJobs.Any())
            {
                var allCats = context.JobCategories.ToList();
                foreach (var job in orphanJobs)
                {
                    job.JobCategoryId = allCats.FirstOrDefault(c => c.Code == job.ServiceType || job.ServiceType.Contains(c.Code))?.Id;
                }
                context.SaveChanges();
            }

            // Seed Job Categories
            if (!context.JobCategories.Any())
            {
                context.JobCategories.AddRange(new List<JobCategory>
                {
                    new JobCategory { Id = Guid.NewGuid(), Code = "IT", Name = "IT / Phần mềm", IconName = "Cpu" },
                    new JobCategory { Id = Guid.NewGuid(), Code = "Architecture", Name = "Kiến trúc / Nội thất", IconName = "Compass" },
                    new JobCategory { Id = Guid.NewGuid(), Code = "Electrical", Name = "Điện / Điện dân dụng", IconName = "Zap" },
                    new JobCategory { Id = Guid.NewGuid(), Code = "Accounting", Name = "Kế toán / Kiểm toán", IconName = "BookOpen" },
                    new JobCategory { Id = Guid.NewGuid(), Code = "Housekeeping", Name = "Giúp việc nhà", IconName = "Home" },
                    new JobCategory { Id = Guid.NewGuid(), Code = "Childcare", Name = "Trông trẻ em", IconName = "User" },
                    new JobCategory { Id = Guid.NewGuid(), Code = "Worker", Name = "Công nhân SX", IconName = "Briefcase" },
                    new JobCategory { Id = Guid.NewGuid(), Code = "Driver", Name = "Tài xế / Giao hàng", IconName = "MapPinned" },
                    new JobCategory { Id = Guid.NewGuid(), Code = "Security", Name = "Bảo vệ / An ninh", IconName = "ShieldCheck" },
                    new JobCategory { Id = Guid.NewGuid(), Code = "Sales", Name = "Bán hàng / Tư vấn", IconName = "TrendingUp" },
                    new JobCategory { Id = Guid.NewGuid(), Code = "Medical", Name = "Y tế / Chăm sóc", IconName = "Hospital" },
                    new JobCategory { Id = Guid.NewGuid(), Code = "Service", Name = "Nhà hàng / Dịch vụ", IconName = "Coffee" },
                    new JobCategory { Id = Guid.NewGuid(), Code = "Technical", Name = "Thợ kỹ thuật", IconName = "Filter" },
                    new JobCategory { Id = Guid.NewGuid(), Code = "Janitor", Name = "Tạp vụ / Buồng phòng", IconName = "Filter" },
                    new JobCategory { Id = Guid.NewGuid(), Code = "Design", Name = "Thiết kế / Sáng tạo", IconName = "Layout" },
                    new JobCategory { Id = Guid.NewGuid(), Code = "Other", Name = "Lĩnh vực khác", IconName = "Plus" }
                });
                context.SaveChanges();
            }
            // 3. Seed Worker Jobs (50 tin) if empty
            if (!context.JobPosts.Any(j => j.IsForWorker))
            {
                for (int i = 0; i < 50; i++)
            {
                var cat = workerProfileTitles[random.Next(workerProfileTitles.Length)];
                var location = locations[random.Next(locations.Length)];
                var jobType = jobTypes[random.Next(jobTypes.Length)];
                var title = cat.Titles[random.Next(cat.Titles.Length)];
                var salary = random.Next(6, 20) * 1000000;

                context.JobPosts.Add(new JobPost
                {
                    Id = Guid.NewGuid(),
                    UserId = workers[random.Next(workers.Count)].Id,
                    Title = title,
                    JobType = jobType,
                    ServiceType = cat.Type,
                    Salary = salary,
                    Location = location,
                    IsForWorker = true,
                    WorkingTime = "Có thể làm ngay",
                    CreatedAt = VNTime.Now.AddDays(-random.Next(0, 20)),
                    Description = $"Tôi cần tìm việc {cat.Type} tại {location}. Có kinh nghiệm lâu năm, thật thà, nhanh nhẹn.",
                    Skills = "Kinh nghiệm thực tế, Có xe máy",
                    IsApproved = i < 45 // the rest are pending
                });
                }
            }

            // 3. Seed Service Packages (Revised to update instead of wipe)
            var currentPackages = context.ServicePackages.ToList();
            var packagesToSeed = new List<ServicePackage>
            {
                new ServicePackage { 
                    Id = Guid.Parse("b1111111-1111-1111-1111-111111111111"), Code = "BASIC", Name = "Gói Basic", 
                    Price = 0, Days = 30, Description = "Dành cho người dùng mới trải nghiệm. Xem 1 hồ sơ ứng tuyển & 1 hồ sơ tìm việc. Hỗ trợ 24/7.", 
                    MaxViews = 1, MaxApplications = 1, MaxJobPosts = 1, 
                    NeedsApproval = true, IsPriority = false, SupportLevel = "24/7 Support", AllowRoleSwitch = false,
                    CreatedAt = VNTime.Now 
                },
                new ServicePackage { 
                    Id = Guid.Parse("b2222222-2222-2222-2222-222222222222"), Code = "PRO", Name = "Gói Professional", 
                    Price = 199000, Days = 30, Description = "Xem 10 hồ sơ ứng tuyển & 10 hồ sơ tìm việc. Ưu tiên duyệt tin nhanh, hiển thị tin top. Hỗ trợ nhanh 24/7.", 
                    MaxViews = 20, MaxApplications = 10, MaxJobPosts = 10, 
                    NeedsApproval = true, IsPriority = true, SupportLevel = "Fast Support", AllowRoleSwitch = false,
                    CreatedAt = VNTime.Now 
                },
                new ServicePackage { 
                    Id = Guid.Parse("b3333333-3333-3333-3333-333333333333"), Code = "ENTERPRISE", Name = "Gói Enterprise", 
                    Price = 499000, Days = 30, Description = "Không giới hạn đăng bài, ứng tuyển và xem hồ sơ. Đăng không cần duyệt, hỗ trợ nhanh, chuyển vai trò linh hoạt.", 
                    MaxViews = -1, MaxApplications = -1, MaxJobPosts = -1, 
                    NeedsApproval = false, IsPriority = true, SupportLevel = "Premium Fast Support", AllowRoleSwitch = true,
                    CreatedAt = VNTime.Now 
                }
            };

            foreach (var pkg in packagesToSeed)
            {
                var existing = currentPackages.FirstOrDefault(p => p.Code == pkg.Code);
                if (existing == null) context.ServicePackages.Add(pkg);
                else 
                {
                    existing.Name = pkg.Name;
                    existing.Price = pkg.Price;
                    existing.Days = pkg.Days;
                    existing.Description = pkg.Description;
                    existing.MaxViews = pkg.MaxViews;
                    existing.MaxApplications = pkg.MaxApplications;
                    existing.MaxJobPosts = pkg.MaxJobPosts;
                    existing.NeedsApproval = pkg.NeedsApproval;
                    existing.IsPriority = pkg.IsPriority;
                    existing.AllowRoleSwitch = pkg.AllowRoleSwitch;
                    existing.IsActive = true;
                    context.ServicePackages.Update(existing);
                }
            }
            context.SaveChanges();

            // 5. Seed Subscriptions for demo users like "Nguyen Linh" if they have nothing
            var usersWithoutSub = context.Users.ToList();
            var basicPkg = context.ServicePackages.FirstOrDefault(p => p.Code == "BASIC");
            var proPkg = context.ServicePackages.FirstOrDefault(p => p.Code == "PRO");

            foreach (var user in usersWithoutSub)
            {
                if (!context.Subscriptions.Any(s => s.UserId == user.Id))
                {
                    // Add a default FREE/BASIC sub
                    context.Subscriptions.Add(new Subscription {
                        Id = Guid.NewGuid(), UserId = user.Id, ServicePackageId = basicPkg?.Id,
                        Tier = "FREE", Amount = 0, IsActive = true,
                        CreatedAt = VNTime.Now.AddDays(-30), ExpiredAt = VNTime.Now.AddDays(30)
                    });

                    // If it's Nguyen Linh, add some history
                    if (user.FullName.Contains("Nguyen Linh") || user.FullName.Contains("Linh"))
                    {
                        context.Subscriptions.Add(new Subscription {
                            Id = Guid.NewGuid(), UserId = user.Id, ServicePackageId = proPkg?.Id,
                            Tier = "PRO", Amount = 199000, TransactionId = "VNP12345678",
                            IsActive = false, CreatedAt = VNTime.Now.AddDays(-5), ExpiredAt = VNTime.Now.AddDays(25)
                        });
                        context.Subscriptions.Add(new Subscription {
                            Id = Guid.NewGuid(), UserId = user.Id, ServicePackageId = basicPkg?.Id,
                            Tier = "BASIC", Amount = 0, TransactionId = "FREE_INIT",
                            IsActive = true, CreatedAt = VNTime.Now.AddDays(-40), ExpiredAt = VNTime.Now.AddDays(-10)
                        });
                    }
                }
            }
            
            context.SaveChanges();
            Console.WriteLine("Successfully re-seeded 100 Job posts, 50 Workers, and Transaction History.");
        }
    }
}
