<script lang="ts">
    const videoSwitch = (target: string) => {
        fetch("/api/v1.0/settings/set/set_VideoSwitchOption", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: `"${target}"`,
        });
    };
</script>

<main>
    <section class="flex flex-col">
        <h2>Video Switch</h2>
        <div class="flex flex-row gap-2">
            <button
                class="bg-blue-600 p-2 rounded"
                on:click={() => {
                    videoSwitch("VideoOnly");
                }}>Video Only</button
            >
            <button
                class="bg-blue-600 p-2 rounded"
                on:click={() => {
                    videoSwitch("MatchPreview");
                }}>Match Preview</button
            >
            <button
                class="bg-blue-600 p-2 rounded"
                on:click={() => {
                    videoSwitch("VideoAndScore");
                }}>Video And Score</button
            >
        </div>
    </section>
</main>
