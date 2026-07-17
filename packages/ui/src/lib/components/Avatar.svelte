<script lang="ts">
	import { defaultAvatar } from "@lib/avatar";
	import {
		avatarState,
		avatarStoreUrl,
		avatarUrl,
		defaultAvatarUrl,
	} from "@lib/avatarStore";

	/** Raw team avatar as base64 (no data: prefix). */
	export let avatar: string | undefined = undefined;
	/** Team number, used to look up a hand-made avatar in the avatar store. */
	export let team: number | undefined = undefined;
	let className = "";
	export { className as class };
	export let style = "";
	export let alt = "";

	// If a store image errors (e.g. a stale list), stop using the store here.
	let failed = false;
	$: {
		team; // reset the fallback whenever the team changes
		failed = false;
	}

	$: storeOk = !!avatarStoreUrl && !failed;
	$: teamVersion = team != null ? $avatarState.teams.get(team) : undefined;
	$: hasTeamUpload = storeOk && team != null && teamVersion !== undefined;
	// Note: `!!avatar` so an empty-string FMS avatar counts as "no avatar".
	$: hasFms = !!avatar;
	$: hasDefault = storeOk && $avatarState.default != null;

	// Priority: team upload (crisp) > FMS avatar (40px, pixelated) > store default
	// (crisp) > built-in placeholder (pixelated).
	$: usingStore = hasTeamUpload || (!hasFms && hasDefault);
	$: src = hasTeamUpload
		? avatarUrl(team as number, teamVersion as number)
		: hasFms
			? `data:image/png;base64,${avatar}`
			: hasDefault
				? defaultAvatarUrl($avatarState.default as number)
				: `data:image/png;base64,${defaultAvatar}`;
</script>

<img
	{src}
	class={className}
	class:pixelated={!usingStore}
	{style}
	{alt}
	on:error={() => (failed = true)}
	{...$$restProps}
/>
