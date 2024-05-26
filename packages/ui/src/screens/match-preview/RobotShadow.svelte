<script lang="ts">
    export let teamNumber: number;

    export let color: "red" | "blue";
</script>

<div class="drop-shadow-lg">
    <div
        class="w-96 aspect-square relative scale-125"
        style={`mask-image: url(teamPhotos/${teamNumber}mask.png); mask-size: contain; mask-repeat: no-repeat`}
    >
        <div
            class="absolute left-0 top-0 w-full h-full z-10"
            class:bg-red-950={color === "red"}
            class:bg-blue-950={color === "blue"}
        ></div>
        <img
            class="absolute left-0 top-0"
            src={`teamPhotos/${teamNumber}.jpg`}
            alt=""
        />
    </div>
</div>
