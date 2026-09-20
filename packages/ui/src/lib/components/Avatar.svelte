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
	/** Filler team in an FMS test match: never resolve this number to real art. */
	export let placeholder = false;
	let className = "";
	export { className as class };
	export let style = "";
	export let alt = "";

	const PLACEHOLDER = `data:image/png;base64,${defaultAvatar}`;

	$: storeOk = !!avatarStoreUrl;
	// A test match loads teams 1-6 whoever is at the event, so the number is not
	// an identity: drop both it and whatever art FMS attached to it.
	$: lookupTeam = placeholder ? undefined : team;
	$: teamVersion = lookupTeam != null ? $avatarState.teams.get(lookupTeam) : undefined;
	// A team is in the /avatars map iff the store has a CRISP upload for it at the
	// active event (event override or team default). Otherwise the store may still
	// serve a low-res TBA fallback, which we try only when FMS gives us nothing.
	$: hasCrispUpload = storeOk && lookupTeam != null && teamVersion !== undefined;
	// Note: `!!avatar` so an empty-string FMS avatar counts as "no avatar".
	$: hasFms = !placeholder && !!avatar;
	$: hasDefault = storeOk && $avatarState.default != null;

	// Shown immediately (no network wait): the FMS avatar if we have one, else the
	// built-in placeholder. Both are ~40px, so both render pixelated.
	$: instantSrc = hasFms ? `data:image/png;base64,${avatar}` : PLACEHOLDER;

	// Network sources we try to UPGRADE to, best first. A crisp upload always wins;
	// the TBA low-res fallback and the store's shared default only fill in when
	// there is no FMS avatar to show.
	$: upgrades = [
		hasCrispUpload ? avatarUrl(lookupTeam as number, teamVersion as number) : null,
		!hasFms && lookupTeam != null && storeOk
			? avatarUrl(lookupTeam as number, teamVersion ?? 0)
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
