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

	const PLACEHOLDER = `data:image/png;base64,${defaultAvatar}`;

	$: storeOk = !!avatarStoreUrl;
	$: teamVersion = team != null ? $avatarState.teams.get(team) : undefined;
	// A team is in the /avatars map iff the store has a CRISP upload for it at the
	// active event (event override or team default). Otherwise the store may still
	// serve a low-res TBA fallback, which we try only when FMS gives us nothing.
	$: hasCrispUpload = storeOk && team != null && teamVersion !== undefined;
	// Note: `!!avatar` so an empty-string FMS avatar counts as "no avatar".
	$: hasFms = !!avatar;
	$: hasDefault = storeOk && $avatarState.default != null;

	// Shown immediately (no network wait): the FMS avatar if we have one, else the
	// built-in placeholder. Both are ~40px, so both render pixelated.
	$: instantSrc = hasFms ? `data:image/png;base64,${avatar}` : PLACEHOLDER;

	// Network sources we try to UPGRADE to, best first. A crisp upload always wins;
	// the TBA low-res fallback and the store's shared default only fill in when
	// there is no FMS avatar to show.
	$: upgrades = [
		hasCrispUpload ? avatarUrl(team as number, teamVersion as number) : null,
		!hasFms && team != null && storeOk
			? avatarUrl(team as number, teamVersion ?? 0)
			: null,
		!hasFms && hasDefault ? defaultAvatarUrl($avatarState.default as number) : null,
	].filter((u): u is string => u !== null);

	// The visible image + whether to render it pixelated. Pixelated is decided by
	// the LOADED image's natural size: <= 48px is a low-res FMS/TBA avatar we must
	// not smooth-upscale; a crisp upload (padded to 160) renders smooth.
	let shownSrc = PLACEHOLDER;
	let pixelated = true;
	let walkToken = 0;

	function resolveSources(instant: string, ups: string[]): void {
		const mine = ++walkToken; // invalidate any in-flight walk when inputs change
		shownSrc = instant;
		pixelated = true;
		let i = 0;
		const tryNext = () => {
			if (mine !== walkToken || i >= ups.length) return;
			const url = ups[i++];
			const img = new Image();
			img.onload = () => {
				if (mine !== walkToken) return;
				shownSrc = url;
				pixelated = img.naturalWidth > 0 && img.naturalWidth <= 48;
			};
			img.onerror = () => {
				if (mine === walkToken) tryNext();
			};
			img.src = url;
		};
		tryNext();
	}

	$: resolveSources(instantSrc, upgrades);
</script>

<img
	src={shownSrc}
	class={className}
	class:pixelated
	{style}
	{alt}
	{...$$restProps}
/>
