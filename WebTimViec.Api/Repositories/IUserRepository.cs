using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using WebTimViec.Api.Entities;

namespace WebTimViec.Api.Repositories
{
    public interface IUserRepository
    {
        Task<User?> GetUserByIdAsync(Guid id);
        Task<User?> GetUserByEmailAsync(string email);
        Task<User> AddUserAsync(User user);
        Task<User> UpdateUserAsync(User user);
        Task<IEnumerable<User>> GetAllUsersAsync();
        Task<bool> DeleteUserAsync(Guid id);
    }
}
