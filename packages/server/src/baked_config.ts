/**
 * Build-time-injected log sync credentials. This committed stub is empty; the
 * release workflow overwrites the file from repository secrets right before
 * compiling the exe, so the real values exist only in CI and in the shipped
 * binary, never in the repo.
 *
 * The baked account is the dedicated low-privilege `fms-logs` Nextcloud user:
 * zero personal quota, write-but-not-delete access to the "FMS Logs" group
 * folder and nothing else, so extracting it from the exe only lets someone
 * add files to that one folder.
 */
export const BAKED_LOG_SYNC: { user: string; pass: string; url: string } | null = null;
