<script lang="ts">
    import type { SRDMonster } from "@types";
    import { ExtraButtonComponent, HoverPopover } from "obsidian";
    import { DEFAULT_UNDEFINED } from "src/utils";
    import { getContext } from "svelte";
    import { encounter } from "../../stores/encounter";
    import Nullable from "../Nullable.svelte";

    const plugin = getContext("plugin");
    export let creature: SRDMonster;
    const add = (node: HTMLElement) => {
        new ExtraButtonComponent(node).setIcon("plus-with-circle");
    };
    function stringify(
        property: Record<string, any> | string | any[] | number | boolean,
        depth: number = 0,
        joiner: string = " ",
        parens = true
    ): string {
        const ret = [];
        if (depth == 5) {
            return "";
        }
        if (property == null) return ``;
        if (typeof property == "string") return property;
        if (typeof property == "number") return `${property}`;
        if (Array.isArray(property)) {
            ret.push(
                `${parens ? "(" : ""}${property
                    .map((p) => stringify(p, depth++))
                    .join(joiner)}${parens ? ")" : ""}`
            );
        } else if (typeof property == "object") {
            for (const value of Object.values(property)) {
                ret.push(stringify(value, depth++));
            }
        }
        return ret.join(" ");
    }

    function getSource(source: string | string[]): string {
        if (!Array.isArray(source)) return source;
        let sliced = source.slice(0, 2);
        if (source.length > 2) {
            sliced.push(`and ${source.length - 2} more`);
        }

        return stringify(sliced, 0, ", ", false);
    }
    function getTooltip(source: string | string[]): string {
        if (!Array.isArray(source)) return "";
        return stringify(source, 0, ", ", false);
    }

    function show(node: HTMLElement) {
        if (plugin.canUseStatBlocks && plugin.statblockVersion?.major >= 2) {
            const statblockNode = createDiv();
            const statblock = plugin.statblocks.render(creature, statblockNode);
            if (statblock) {
                const popover = new HoverPopover({ hoverPopover: null }, node);
                popover.hoverEl.appendChild(statblockNode);
            }
        }
    }
</script>

<tr class="creature">
    <td class="creature-name creature-40">
        <div class="creature-name-container">
            <div use:add on:click={() => encounter.add(creature)} />
            <!-- svelte-ignore a11y-mouse-events-have-key-events -->
            <div
                class="setting-item-name"
                on:mouseover={(evt) => show(evt.currentTarget)}
            >
                {creature.name}
            </div>
            <div class="setting-item-description">
                {#if creature.source?.length}
                    <span aria-label={getTooltip(creature.source)}>
                        {getSource(creature.source)}
                    </span>
                {/if}
            </div>
            <!-- <div class="creature-name">
            </div> -->
            <!-- svelte-ignore a11y-mouse-events-have-key-events -->
        </div>
    </td>
    <td class="creature-cr creature-15"><Nullable str={creature.cr ?? 0} /></td>
    <td class="creature-type creature-15"
        ><Nullable str={creature.type ?? DEFAULT_UNDEFINED} /></td
    >
    <td class="creature-size creature-15"
        ><Nullable str={creature.size ?? DEFAULT_UNDEFINED} /></td
    >
    <td class="creature-alignment creature-15">
        <Nullable str={creature.alignment ?? DEFAULT_UNDEFINED} />
    </td>
</tr>

<style scoped>
    .creature-name-container {
        /* display: flex;
        align-items: center;
        gap: 0.5rem; */
        display: grid;
        grid-template-areas:
            "add name"
            ". desc";
        justify-content: flex-start;
        align-items: center;
        grid-template-columns: auto 1fr;
    }
    .setting-item-description {
        grid-area: desc;
    }
    /* .creature-name > div {
        display: flex;
        align-items: center;
    } */
    .creature-40 {
        width: 40%;
    }
    .creature-15 {
        width: 15%;
    }
</style>
