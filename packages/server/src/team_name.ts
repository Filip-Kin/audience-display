import { existsSync, readFileSync, writeFileSync, statSync, mkdirSync } from 'fs';
import { join } from 'path';
import { appDataDir } from './fms_logger';

const filePath = join(appDataDir(), 'customADTeams.json');
mkdirSync(appDataDir(), { recursive: true });

interface TeamEntry {
    number: number;
    name: string;
}

let cachedTeams: TeamEntry[] = [];
let lastModified = 0;

function getCustomTeams(): TeamEntry[] {
    if (!existsSync(filePath)) {
        writeFileSync(filePath, JSON.stringify({
            alternativeTeamNames: [
                { number: 99999, name: "Team Name" }
            ]
        }, null, 2), 'utf-8');
    }

    const mtime = statSync(filePath).mtimeMs;
    if (mtime !== lastModified) {
        try {
            const data = JSON.parse(readFileSync(filePath, 'utf-8'));
            cachedTeams = Array.isArray(data.alternativeTeamNames)
                ? data.alternativeTeamNames
                : [];
        } catch {
            cachedTeams = [];
        }
        lastModified = mtime;
    }

    return cachedTeams;
}

export function getTeamName(teamNumber: number, defaultName: string): string {
    const customTeams = getCustomTeams();
    const match = customTeams.find(t => t.number === teamNumber);
    return match?.name ?? defaultName;
}
