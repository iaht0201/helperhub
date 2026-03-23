using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace WebTimViec.Api.Hubs
{
    public class ChatHub : Hub
    {
        public async Task JoinUserRoom(string userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, userId);
        }

        public async Task LeaveUserRoom(string userId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, userId);
        }
    }
}
