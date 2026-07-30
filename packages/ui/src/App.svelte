<script lang="ts">
	import MainPage from "./MainPage.svelte";
	import ScreenRouter from "./ScreenRouter.svelte";
	import { Router, Link, Route } from "svelte-routing";
	import { onMount } from "svelte";

	let url = "";

	// Scale the fixed 1920x1080 layout to fill whatever resolution the display is
	// rendered at, so 1080p / 1440p / 4K all look identical (see #app in app.css).
	onMount(() => {
		const app = document.getElementById("app");
		const fit = () => {
			const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
			app?.style.setProperty("--app-scale", String(s));
		};
		fit();
		window.addEventListener("resize", fit);
		return () => window.removeEventListener("resize", fit);
	});
</script>

<main class="w-full h-full">
	<Router {url}>
		<Route path="/display" component={ScreenRouter} />
		<Route path="/" component={MainPage} />
	</Router>
</main>
