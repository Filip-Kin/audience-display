<script lang="ts">
	import { onMount } from "svelte";

	/** Which edge of the screen the confetti column hugs. */
	export let side: "left" | "right";
	/** Winning alliance; kept for API parity with the default profile's
	 * confetti (RR's palette is always the rainbow). */
	export const color: "red" | "blue" = "red";

	let canvas: HTMLCanvasElement;

	type Particle = {
		x: number;
		y: number;
		w: number;
		h: number;
		vy: number;
		phase: number;
		sway: number;
		rot: number;
		vr: number;
		fill: string;
	};

	onMount(() => {
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Rainbow Rumble: the champion confetti is the full rainbow (the winning
		// side still decides WHERE it falls via the `side` prop).
		const palette = [
			"#e0393c", // red
			"#f28c28", // orange
			"#f2cf3e", // yellow
			"#3fbf5a", // green
			"#3960e0", // blue
			"#7a3fe0", // purple
			"#e0399e", // magenta
			"#ffffff",
		];

		const resize = () => {
			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;
		};
		resize();
		const ro = new ResizeObserver(resize);
		ro.observe(canvas);

		const spawn = (anywhere: boolean): Particle => ({
			x: Math.random() * canvas.width,
			y: anywhere ? Math.random() * canvas.height : -20 - Math.random() * 60,
			w: 7 + Math.random() * 7,
			h: 10 + Math.random() * 8,
			vy: 1.6 + Math.random() * 2.6,
			phase: Math.random() * Math.PI * 2,
			sway: 0.6 + Math.random() * 1.2,
			rot: Math.random() * Math.PI,
			vr: (Math.random() - 0.5) * 0.2,
			fill: palette[Math.floor(Math.random() * palette.length)],
		});

		const particles = Array.from({ length: 130 }, () => spawn(true));

		let raf = 0;
		let t = 0;
		const loop = () => {
			t += 1 / 60;
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			for (let i = 0; i < particles.length; i++) {
				let p = particles[i];
				p.y += p.vy;
				p.x += Math.sin(t * 2.2 + p.phase) * p.sway;
				p.rot += p.vr;
				if (p.y > canvas.height + 24) {
					p = particles[i] = spawn(false);
				}
				ctx.save();
				ctx.translate(p.x, p.y);
				ctx.rotate(p.rot);
				// Squash height with a cosine for the paper-flutter look.
				const flutter = Math.max(0.15, Math.abs(Math.cos(t * 3 + p.phase)));
				ctx.fillStyle = p.fill;
				ctx.fillRect(-p.w / 2, (-p.h * flutter) / 2, p.w, p.h * flutter);
				ctx.restore();
			}
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);

		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
		};
	});
</script>

<canvas
	bind:this={canvas}
	class="fixed top-0 h-full w-[38%] pointer-events-none z-20 {side === 'left' ? 'left-0' : 'right-0'}"
></canvas>
