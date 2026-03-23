using System;

namespace WebTimViec.Api.Helpers
{
    public static class VNTime
    {
        public static DateTime Now => DateTime.UtcNow.AddHours(7);
    }
}
