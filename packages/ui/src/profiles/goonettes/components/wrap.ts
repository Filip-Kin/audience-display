import type { ComponentType } from "svelte";
import Chrome from "./Chrome.svelte";

/**
 * Reuse a default screen unchanged, wrapped in the Goonettes chrome (fonts,
 * pill header, rounded panels - all CSS in goon.css). Used for the full-screen
 * pages whose layout and behaviour stay stock, so those screens keep every
 * default fix automatically instead of being copied.
 */
export function chrome(screen: ComponentType): ComponentType {
	return class extends Chrome {
		constructor(options: { target: Element; props?: Record<string, unknown> }) {
			super({ ...options, props: { ...(options.props ?? {}), screen } });
		}
	} as unknown as ComponentType;
}
