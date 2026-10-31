import type { ComponentType } from "svelte";
import Chrome from "./Chrome.svelte";

/**
 * Reuse a default screen unchanged, with the Halloween layer around it. Layout
 * and behaviour stay stock, so these screens keep every default fix.
 *
 * "page": full-screen pages. The art sits BEHIND the screen, whose root is made
 * transparent in bot-bash.css, so it can never cover data.
 * "shutter": screens on the red/blue shutter. The shutter would hide anything
 * behind it, so only the corner webs and bats go in front.
 */
export function spooky(screen: ComponentType, variant: "page" | "shutter" = "page"): ComponentType {
	return class extends Chrome {
		constructor(options: { target: Element; props?: Record<string, unknown> }) {
			super({ ...options, props: { ...(options.props ?? {}), screen, variant } });
		}
	} as unknown as ComponentType;
}
