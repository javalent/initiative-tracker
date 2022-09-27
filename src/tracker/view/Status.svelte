<script lang="ts">
    import { ExtraButtonComponent } from "obsidian";
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    import type { Condition } from "@types";

    export let status: Condition;

    const deleteIcon = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon("cross-in-box");
    };
</script>

<!-- svelte-ignore a11y-unknown-aria-attribute -->
<div
    aria-label-classes="initiative-tracker-condition-tooltip"
    class="tag"
    aria-label={status.description?.length ? status.description : null}
>
    <span>{status.name}</span>
    <div use:deleteIcon on:click={() => dispatch("remove")} />
</div>

<style>
    .tag {
        display: flex;
        align-items: center;
        gap: 0.125rem;
        color: var(--text-muted);
        font-size: small;
        width: fit-content;
        border-radius: 0.25rem;
    }
    .tag :global(.clickable-icon) {
        margin: 0;
    }
</style>
