<script lang="ts">
    import { ExtraButtonComponent } from "obsidian";
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();

    import type { Condition } from "@types";

    export let status: Condition;

    const deleteIcon = (node: HTMLElement) => {
        const icon = new ExtraButtonComponent(node)
            .setIcon("cross-in-box")
            .onClick(() => {
                dispatch("remove");
            });
        icon.extraSettingsEl.setAttr("style", "margin-left: 3px;");
    };
</script>

<!-- svelte-ignore a11y-unknown-aria-attribute -->
<div
    class="tag"
    aria-label={status.description.length
        ? status.description.join("\n\n")
        : null}
    aria-label-classes="initiative-tracker-condition-tooltip"
>
    <span>{status.name}</span>
    <div use:deleteIcon />
</div>

<style>
    .tag {
        display: flex;
        align-items: center;
        padding-right: 0px;
        margin-right: 0.125rem;
    }
</style>
