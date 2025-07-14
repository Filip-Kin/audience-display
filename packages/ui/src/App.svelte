<script lang="ts">
	import MainPage from "./MainPage.svelte";
	import ScreenRouter from "./screens/ScreenRouter.svelte";
	import { Router, Link, Route } from "svelte-routing";

	let url = "";
</script>

<main class="w-full h-full">
	<Router {url}>
		<Route path="/display" component={ScreenRouter} />
		<Route path="/" component={MainPage} />
	</Router>
</main>
