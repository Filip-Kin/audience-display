namespace Models.Audience
{
    public class Alliance
    {
        public Alliance(int allianceNumber, int? team1, string? team1Name, int? team2, string? team2Name, int? team3, string? team3Name)
        {
            AllianceNumber = allianceNumber;
            AllianceName = "Alliance " + allianceNumber;
            AllianceNameShortUC = "ALLI";
            CaptainTeamNumber = team1;
            CaptainTeamNameShort = team1Name;
            FirstRoundTeamNumber = team2;
            FirstRoundTeamNameShort = team2Name;
            SecondRoundTeamNumber = team3;
            SecondRoundTeamNameShort = team3Name;
            CardEffectiveStatus = "None";
        }

        public Alliance(int allianceNumber, int? team1, string? team1Name, int? team2, string? team2Name, int? team3, string? team3Name, int? team4, string? team4Name) : this(allianceNumber, team1, team1Name, team2, team2Name, team3, team3Name)
        {
            AlternateTeamNumber = team4;
            AlternateTeamNameShort = team4Name;
        }

        public Alliance(int allianceNumber, int? team1, string? team1Name, int? team2, string? team2Name, int? team3, string? team3Name, int? team4, string? team4Name, string card) : this(allianceNumber, team1, team1Name, team2, team2Name, team3, team3Name, team4, team4Name)
        {
            CardEffectiveStatus = card;
        }

        public int AllianceNumber { get; set; }
        public string AllianceName { get; set; }
        public string AllianceNameShortUC { get; set; }
        public int? CaptainTeamNumber { get; set; }
        public string? CaptainTeamNameShort { get; set; }
        public int? FirstRoundTeamNumber { get; set; }
        public string? FirstRoundTeamNameShort { get; set; }
        public int? SecondRoundTeamNumber { get; set; }
        public string? SecondRoundTeamNameShort { get; set; }
        public int? AlternateTeamNumber { get; set; }
        public string? AlternateTeamNameShort { get; set; }
        public string CardEffectiveStatus { get; set; }
    }
}