using Microsoft.AspNetCore.Mvc;
using Models.Audience;

namespace Controllers
{
    [ApiController]
    [Route("api/v1.0/audience")]
    public class AudienceController : Controller
    {
        [HttpGet("GetFMSVersion")]
        public string GetFMSVersion()
        {
            return "11.0.2402.1303";
        }
        [HttpGet("GetAlliances")]
        public List<Alliance> GetAlliances()
        {
            List<Alliance> alliances =
            [
                new Alliance(1, 1, "Team 1", 2, "Team 2", 3, "Team 3"),
                new Alliance(2, 4, "Team 4", 5, "Team 5", 6, "Team 6"),
                new Alliance(3, 7, "Team 7", 8, "Team 8", 9, "Team 9"),
                new Alliance(4, 10, "Team 10", 11, "Team 11", 12, "Team 12"),
                new Alliance(5, 13, "Team 13", 14, "Team 14", 15, "Team 15"),
                new Alliance(6, 16, "Team 16", 17, "Team 17", 18, "Team 18"),
                new Alliance(7, 19, "Team 19", 20, "Team 20", 21, "Team 21"),
                new Alliance(8, 22, "Team 22", 23, "Team 23", 24, "Team 24"),
            ];
            return alliances;
        }
    }
}