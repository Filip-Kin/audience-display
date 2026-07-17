/**
 * Svelte action: shrink an element's font size so its (up to two-line) text
 * fits inside a fixed height, then ellipsize the second line if it still
 * doesn't fit at the minimum size.
 *
 * Apply this to a text node whose PARENT reserves a fixed height (`maxHeight`).
 * Because the height is fixed and the font shrinks to fit it, a long name that
 * wraps to two lines occupies exactly the same vertical space as a short
 * one-line name, so the surrounding card never grows. Short names stay at
 * `max`; only names that would overflow the box are stepped down toward `min`.
 *
 * Pass `text` in the params so the action re-runs when the name changes (Svelte
 * only calls `update` when the params object identity changes).
 */
export type FitTwoLinesParams = {
	max: number;
	min: number;
	maxHeight: number;
	text?: string;
};

const LINE_HEIGHT = 1.15;

export function fitTwoLines(node: HTMLElement, params: FitTwoLinesParams) {
	function apply({ max, min, maxHeight }: FitTwoLinesParams) {
		node.style.lineHeight = String(LINE_HEIGHT);
		node.style.overflowWrap = "break-word";

		// Measure as a plain block (no clamp) so scrollHeight reports the true
		// wrapped content height; step the font down until it fits the box.
		node.style.display = "block";
		node.style.removeProperty("-webkit-line-clamp");
		let size = max;
		node.style.fontSize = `${size}px`;
		while (size > min && node.scrollHeight > maxHeight) {
			size -= 1;
			node.style.fontSize = `${size}px`;
		}

		// Clamp to two lines; ellipsizes line 2 if it still overflows at `min`.
		node.style.overflow = "hidden";
		node.style.display = "-webkit-box";
		node.style.setProperty("-webkit-box-orient", "vertical");
		node.style.setProperty("-webkit-line-clamp", "2");
	}

	apply(params);
	return {
		update: apply,
	};
}
