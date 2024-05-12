using Microsoft.AspNetCore.SignalR;

namespace Hubs
{
    public class InfrastructureHub : Hub
    {
        public async Task SendVideoSwitch()
        {
            await Clients.All.SendAsync("SystemConfigValueChanged", "VideoSwitchOption");
        }

        public async Task SendTimer(int time)
        {
            await Clients.All.SendAsync("MatchTimerChanged", time);
        }

        public async Task ShowMatchResult()
        {
            await Clients.All.SendAsync("AudienceShowMatchResult");
        }

        public async Task MatchStatusChanged()
        {
            await Clients.All.SendAsync("MatchStatusChanged");
        }
    }
}