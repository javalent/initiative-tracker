<script lang="ts">
    import type { SRDMonster } from "@types";
    import { ExtraButtonComponent, setIcon } from "obsidian";
    import { convertFraction, DEFAULT_UNDEFINED, XP_PER_CR } from "src/utils";
    import { encounter } from "../../stores/encounter";
    import Nullable from "../Nullable.svelte";

    const { players } = encounter;
    const { average } = players;

    const remove = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon("minus-circle");
    };
    const add = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon("plus-with-circle");
    };
    const del = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon("trash-2");
    };

    export let count: number;
    export let creature: SRDMonster;
    const convertedCR = (cr: string | number) => {
        if (cr == undefined) return DEFAULT_UNDEFINED;
        if (cr == "1/8") {
            return "⅛";
        }
        if (cr == "1/4") {
            return "¼";
        }
        if (cr == "1/2") {
            return "½";
        }
        return cr;
    };

    const insignificant = convertFraction(creature.cr) < $average - 3;

    const baby = (node: HTMLElement) => setIcon(node, "baby");
    const challenge = convertFraction(creature.cr) > $average + 3;

    const skull = (node: HTMLElement) => setIcon(node, "skull");
</script>

<div class="encounter-creature-container">
    <div class="encounter-creature-controls">
        <div use:remove on:click={() => encounter.remove(creature)} />
        <input
            type="number"
            min="1"
            bind:value={count}
            on:change={(evt) =>
                encounter.set(creature, Number(evt.currentTarget.value))}
        />
        <div use:add on:click={() => encounter.add(creature)} />
    </div>
    <div class="encounter-creature">
        <strong class="encounter-creature-name">
            {creature.name}
        </strong>
        {#if insignificant}
            <div
                class="contains-icon"
                use:baby
                aria-label={`${
                    count > 1 ? "These creatures are" : "This creature is"
                } significantly under the average party level and might not contribute much to the fight.`}
            />
        {/if}
        {#if challenge}
            <div
                class="contains-icon"
                use:skull
                aria-label={`${
                    count > 1 ? "These creatures are" : "This creature is"
                } significantly over the average party level and might prove a challenge.`}
            />
        {/if}
    </div>
    <div class="encounter-creature-context">
        <span>
            <Nullable str={`${convertedCR(creature.cr)} CR`} />
        </span>
    </div>
    <div class="encounter-creature-context">
        <span>
            <Nullable
                str={`${
                    XP_PER_CR[creature.cr]?.toLocaleString() ??
                    DEFAULT_UNDEFINED
                } XP`}
            />
        </span>
    </div>
    <div class="encounter-creature-controls">
        <div use:del on:click={() => encounter.delete(creature)} />
    </div>
</div>

<style scoped>
    .encounter-creature-container {
        display: grid;
        align-items: center;
        justify-content: center;
        grid-template-columns: min-content 1fr 10% 10% auto;
        gap: 0.5rem;
    }
    .encounter-creature {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .encounter-creature-context {
        text-align: right;
    }
    .encounter-creature-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    input {
        text-align: center;
        width: 40px;
    }
    .contains-icon {
        display: flex;
        align-items: center;
    }
</style>
