using Hubs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using State;

namespace Controllers
{
    [ApiController]
    [Route("api/v1.0/settings")]
    public class SettingsController : Controller
    {

        private IHubContext<InfrastructureHub> infraHub { get; }

        public SettingsController(IHubContext<InfrastructureHub> hubContext)
        {
            infraHub = hubContext;
        }

        [HttpGet("get/Get_VideoSwitchOption")]
        public string GetVideoSwitch()
        {
            // I hate that this is how it gets sent, but here we are
            return $"\"{SettingsState.VideoSwitchOption}\"";
        }

        [HttpPost("set/Set_VideoSwitchOption")]
        public async void SetVideoSwitch([FromBody] string value)
        {
            SettingsState.VideoSwitchOption = value;
            await infraHub.Clients.All.SendAsync("SystemConfigValueChanged", "VideoSwitchOption");
        }
    }
}
