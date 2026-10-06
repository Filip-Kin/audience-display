import type { Server } from "bun";

/*
 * Optional Server-Sent Events channel at GET /api/events, used by the FIM AV
 * Assistant to react to changes instead of polling. The display works the same
 * with no client connected: the ping timer only exists while a client is
 * connected, and with zero clients a change costs one comparison.
 *
 * Wire format (shared with the other AV Assistant add-ons): one
 * `data: <json>\n\n` per message, no `event:` field, `: ping\n\n` every 15 s.
 * The first message is `hello` with the full current state.
 */

export const PROTOCOL_VERSION = 1;
export const PING_INTERVAL_MS = 15_000;

export type ProfileState = {
  id: string;
  name: string;
  source: "event" | "manual" | "default";
};
export type FmsState = { connected: boolean; eventCode: string | null };
export type CompanionState = { enabled: boolean };

type Client = { controller: ReadableStreamDefaultController<Uint8Array> };

const encoder = new TextEncoder();

export class AvEventHub {
  private clients = new Set<Client>();
  private pingTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private version: string,
    private profile: ProfileState,
    private fms: FmsState,
    private companion: CompanionState,
    /** Lasting problems, sent as `error` events right after each hello. */
    private standingErrors: () => string[] = () => []
  ) {}

  get clientCount(): number {
    return this.clients.size;
  }

  hello() {
    return {
      type: "hello",
      addon: "audience-display",
      protocol: PROTOCOL_VERSION,
      version: this.version,
      profile: { ...this.profile },
      fms: { ...this.fms },
      companion: { ...this.companion },
    };
  }

  setProfile(next: ProfileState): void {
    const p = this.profile;
    if (p.id === next.id && p.name === next.name && p.source === next.source) return;
    this.profile = { ...next };
    this.broadcast({ type: "profile", ...this.profile });
  }

  setFms(patch: Partial<FmsState>): void {
    const next = { ...this.fms, ...patch };
    if (next.connected === this.fms.connected && next.eventCode === this.fms.eventCode) return;
    this.fms = next;
    this.broadcast({ type: "fms", ...this.fms });
  }

  setCompanion(next: CompanionState): void {
    if (next.enabled === this.companion.enabled) return;
    this.companion = { enabled: next.enabled };
    this.broadcast({ type: "companion", ...this.companion });
  }

  error(message: string): void {
    this.broadcast({ type: "error", message });
  }

  /** Bun.serve handler for GET /api/events. */
  handle(request: Request, server: Server): Response {
    // Bun closes a connection idle for 10 s by default; the stream must outlive
    // the 15 s ping gap.
    // (server.timeout is newer than the pinned @types/bun.)
    (server as Server & { timeout?: (r: Request, seconds: number) => void }).timeout?.(request, 0);
    let client: Client | null = null;
    const drop = () => {
      if (!client || !this.clients.delete(client)) return;
      try {
        client.controller.close();
      } catch {}
      if (this.clients.size === 0) this.stopPing();
    };
    const stream = new ReadableStream<Uint8Array>({
      start: (controller) => {
        client = { controller };
        this.clients.add(client);
        if (!this.pingTimer) {
          this.pingTimer = setInterval(() => this.ping(), PING_INTERVAL_MS);
        }
        this.write(client, `data: ${JSON.stringify(this.hello())}\n\n`);
        for (const message of this.standingErrors()) {
          this.write(client, `data: ${JSON.stringify({ type: "error", message })}\n\n`);
        }
      },
      cancel: drop,
    });
    request.signal.addEventListener("abort", drop);
    return new Response(stream, {
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
        "x-accel-buffering": "no",
      },
    });
  }

  private stopPing(): void {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = null;
  }

  private ping(): void {
    for (const c of [...this.clients]) this.write(c, ": ping\n\n");
  }

  private write(c: Client, chunk: string): void {
    try {
      c.controller.enqueue(encoder.encode(chunk));
    } catch {
      this.clients.delete(c);
      if (this.clients.size === 0) this.stopPing();
    }
  }

  private broadcast(msg: object): void {
    if (this.clients.size === 0) return;
    const chunk = `data: ${JSON.stringify(msg)}\n\n`;
    for (const c of [...this.clients]) this.write(c, chunk);
  }
}
