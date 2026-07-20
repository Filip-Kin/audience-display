import { existsSync, readFileSync, writeFileSync, statSync, renameSync, mkdirSync } from 'fs';
import { homedir, platform } from 'os';
import { join } from 'path';
import { appDataDir } from './fms_logger';

const filePath = join(appDataDir(), 'customADTeams.json');
mkdirSync(appDataDir(), { recursive: true });

// The file used to live at the APPDATA root; adopt an existing one into the
// program's own folder so customized names survive the move.
const legacyAppData = process.env.APPDATA || (
    platform() === 'darwin'
        ? join(homedir(), 'Library', 'Application Support')
        : join(homedir(), '.config')
);
const legacyPath = join(legacyAppData, 'customADTeams.json');
if (existsSync(legacyPath) && !existsSync(filePath)) {
    try {
        renameSync(legacyPath, filePath);
    } catch {
        // Cross-device or locked; the default file gets created instead.
    }
}

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
