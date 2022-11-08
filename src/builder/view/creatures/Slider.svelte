<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import Thumb from "./Thumb.svelte";

    const dispatch = createEventDispatcher();

    let name: string[] = [];
    let range = false;
    let min = 0;
    let max = 100;
    let step = 1;
    let value = [min, max];
    let pos: number[];
    let active = false;
    let order = false;

    export { name, range, min, max, step, value, order };

    $: if (active) setValue(pos);
    $: if (!active) setPos(value);
    $: if (range && order && active) pos = checkPos(pos);
    $: min, max, clamp();
    $: progress = `
    left: ${range ? Math.min(pos[0], pos[1]) * 100 : 0}%;
    right: ${100 - Math.max(pos[0], range ? pos[1] : pos[0]) * 100}%;
  `;

    function setValue(pos: number[]) {
        const offset = min % step;
        const width = max - min;
        value = pos
            .map((v) => min + v * width)
            .map((v) => Math.round((v - offset) / step) * step + offset);
        dispatch("input", value);
    }

    function setPos(value: number[]) {
        pos = value
            .map((v) => Math.min(Math.max(v, min), max))
            .map((v) => (v - min) / (max - min));
    }

    function checkPos(pos: number[]) {
        return [Math.min(...pos), Math.max(...pos)];
    }

    function clamp() {
        setPos(value);
        setValue(pos);
    }
    function handleClick(evt: MouseEvent) {
        const target = evt.target as HTMLDivElement;
        const click = evt.offsetX / target.clientWidth;
        const distances = pos.map((p) => Math.abs(click - p));
        if (distances[1] > distances[0]) {
            pos = [click, pos[1]];
        } else {
            pos = [pos[0], click];
        }
        setValue(pos);
    }
</script>

<div class="track-container" on:click={handleClick}>
    <input type="number" value={value[0]} name={name[0]} />
    {#if range}
        <input type="number" value={value[1]} name={name[1]} />
    {/if}
    <div class="track">
        <div class="progress" style={progress} />
        <Thumb bind:pos={pos[0]} on:active={({ detail: v }) => (active = v)}>
            <div class="thumb" />
        </Thumb>
        {#if range}
            <Thumb
                bind:pos={pos[1]}
                on:active={({ detail: v }) => (active = v)}
            >
                <div class="thumb" />
            </Thumb>
        {/if}
    </div>
</div>

<style>
    input {
        display: none;
    }

    .track-container {
        width: calc(100% - 16px);
        height: 16px;
        display: flex;
        align-items: center;
    }

    .track {
        margin: 0 8px;
        position: relative;
        height: 4px;
        width: calc(100% - 16px);
        border-radius: 100vh;
        background: var(--background-modifier-form-field);
    }

    .progress {
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        border-radius: 100vh;
        background: var(--interactive-accent);
    }

    .thumb {
        width: 16px;
        height: 16px;
        border-radius: 100vh;
        background: var(--interactive-accent);
    }

    .thumb:hover,
    .thumb:active {
        background: var(--interactive-hover);
    }
</style>
