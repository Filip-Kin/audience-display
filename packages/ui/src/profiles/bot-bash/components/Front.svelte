<script lang="ts">
	import { onMount } from "svelte";

	export let exit = false;

	// Same bat, wing beat and flight speeds as the win clips (draw() and bat() in
	// tools/bot-bash-win-animations/clip.html), kept to a band across the top so
	// they stay off the team cards, and spaced out so one or two are in view.
	const W = 1920;
	const H = 230;
	const WRAP = 3400;
	const bats = [
		{ x: 300, y: 70, size: 44, speed: 330, phase: 0.4 },
		{ x: 1250, y: 150, size: 32, speed: 250, phase: 2.1 },
		{ x: 2100, y: 110, size: 52, speed: 370, phase: 4.2 },
		{ x: 2900, y: 46, size: 28, speed: 210, phase: 5.6 },
	];

	let canvas: HTMLCanvasElement;

	function bat(cx: CanvasRenderingContext2D, x: number, y: number, s: number, flap: number) {
		const up = Math.sin(flap);
		const w = s * (0.55 + 0.45 * Math.abs(up));
		cx.beginPath();
		cx.moveTo(x, y - s * 0.12);
		cx.quadraticCurveTo(x - w * 0.5, y - s * 0.55 * up, x - w, y - s * 0.2 * up);
		cx.quadraticCurveTo(x - w * 0.6, y + s * 0.02, x - w * 0.42, y + s * 0.18);
		cx.quadraticCurveTo(x - w * 0.2, y + s * 0.02, x, y + s * 0.26);
		cx.quadraticCurveTo(x + w * 0.2, y + s * 0.02, x + w * 0.42, y + s * 0.18);
		cx.quadraticCurveTo(x + w * 0.6, y + s * 0.02, x + w, y - s * 0.2 * up);
		cx.quadraticCurveTo(x + w * 0.5, y - s * 0.55 * up, x, y - s * 0.12);
		cx.fill();
	}

	onMount(() => {
		const cx = canvas.getContext("2d")!;
		// A faint rim, so a dark bat still shows on the dark header.
		cx.fillStyle = "#05030a";
		cx.shadowColor = "rgba(255,255,255,.7)";
		cx.shadowBlur = 3;
		let frame = requestAnimationFrame(function tick(now) {
			const t = now / 1000;
			cx.clearRect(0, 0, W, H);
			for (const b of bats) {
				const x = ((b.x + t * b.speed) % WRAP) - 100;
				bat(cx, x, b.y + Math.sin(t * 2 + b.phase) * 26, b.size, t * 15 + b.phase);
			}
			frame = requestAnimationFrame(tick);
		});
		return () => cancelAnimationFrame(frame);
	});
</script>

<div class="bb-front" class:bb-front-out={exit} aria-hidden="true">
	<svg class="bb-web bb-web-l" viewBox="0 0 240 240">
		<g fill="none" stroke-linecap="round">
			<path d="M0 0L240 26M0 0L196 126M0 0L126 196M0 0L26 240" />
			<path d="M78 8Q62 34 64 41Q44 50 42 64Q24 66 8 78M142 15Q116 56 118 73Q84 92 80 118Q50 120 15 142M204 22Q166 80 170 104Q124 134 112 170Q72 176 22 204" />
		</g>
	</svg>
	<svg class="bb-web bb-web-r" viewBox="0 0 240 240">
		<g fill="none" stroke-linecap="round">
			<path d="M0 0L240 26M0 0L196 126M0 0L126 196M0 0L26 240" />
			<path d="M78 8Q62 34 64 41Q44 50 42 64Q24 66 8 78M142 15Q116 56 118 73Q84 92 80 118Q50 120 15 142M204 22Q166 80 170 104Q124 134 112 170Q72 176 22 204" />
		</g>
	</svg>
	<canvas class="bb-bats" bind:this={canvas} width={W} height={H}></canvas>
</div>
