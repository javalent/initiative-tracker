<script lang="ts">
    import { ExtraButtonComponent, Modal, Notice, Setting } from "obsidian";

    import Creature from "./Creature.svelte";
    import { Creature as CreatureCreator } from "../../../utils/creature";

    import { encounter } from "../../stores/encounter";
    import { START_ENCOUNTER } from "src/utils";
    import { getContext } from "svelte";

    const { players } = encounter;

    const plugin = getContext("plugin");

    $: items = [...$encounter.entries()];

    let startIcon: ExtraButtonComponent;
    const start = (node: HTMLElement) => {
        startIcon = new ExtraButtonComponent(node)
            .setIcon(START_ENCOUNTER)
            .onClick(() => {
                plugin.view.newEncounter({
                    creatures: [...$encounter.entries()]
                        .map((c) =>
                            [...Array(c[1]).keys()].map(() =>
                                CreatureCreator.from(c[0])
                            )
                        )
                        .flat(),
                    players: [...$players].map((p) => p.name)
                });
                app.workspace.revealLeaf(plugin.view.leaf);
            });
    };

    $: {
        if (startIcon) {
            if (!items.length) {
                startIcon.setDisabled(true);
                startIcon.setTooltip("");
            } else {
                startIcon.setDisabled(false);
                startIcon.setTooltip("Start Encounter");
            }
        }
    }
    let saveIcon: ExtraButtonComponent;
    const save = (node: HTMLElement) => {
        saveIcon = new ExtraButtonComponent(node)
            .setIcon("save")
            .onClick(() => {
                const modal = new Modal(app);
                modal.contentEl.createEl("h4", { text: "Save Encounter" });
                let name: string = `Encounter ${
                    Object.keys(plugin.data.encounters).length
                }`;
                new Setting(modal.contentEl)
                    .setName("Encounter Name")
                    .addText((t) => {
                        t.setPlaceholder(name).onChange((v) => (name = v));
                    });
                new Setting(modal.contentEl).addButton((b) =>
                    b.setButtonText("Save").onClick(() => {
                        if (name in plugin.data.encounters) {
                            new Notice(
                                "An encounter by that name already exists."
                            );
                            return;
                        }
                        const creatures = [
                            ...[...$players].map((p) =>
                                CreatureCreator.from(p)
                            ),
                            ...[...$encounter.entries()]
                                .map((c) =>
                                    [...Array(c[1]).keys()].map(() =>
                                        CreatureCreator.from(c[0])
                                    )
                                )
                                .flat()
                        ];
                        plugin.data.encounters[name] = {
                            creatures: [...creatures.map((c) => c.toJSON())],
                            state: false,
                            name,
                            round: 1,
                            logFile: null
                        };
                        modal.close();
                    })
                );
                modal.open();
            });
    };

    $: {
        if (saveIcon) {
            if (!items.length) {
                saveIcon.setDisabled(true);
                saveIcon.setTooltip("");
            } else {
                saveIcon.setDisabled(false);
                saveIcon.setTooltip("Save Encounter");
            }
        }
    }

    let exportIcon: ExtraButtonComponent;
    const exp = (node: HTMLElement) => {
        exportIcon = new ExtraButtonComponent(node).setIcon("code");
    };
    $: {
        if (exportIcon) {
            if (!items.length) {
                exportIcon.setDisabled(true);
                exportIcon.setTooltip("");
            } else {
                exportIcon.setDisabled(false);
                exportIcon.setTooltip("Export Encounter to Note");
            }
        }
    }

    const load = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon("import")
            .setTooltip("Load Encounter")
            .onClick(() => {});
    };
    const clear = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setIcon("eraser")
            .setTooltip("Clear Encounter");
    };
</script>

<div class="encounter-header">
    <h5 class="built-encounter">Encounter</h5>
    <div class="encounter-controls">
        <div use:start />
        <div use:save />
        <!-- <div use:exp /> -->
        <!-- <div use:load /> -->

        <div use:clear on:click={() => encounter.empty()} />
    </div>
</div>
{#if !items.length}
    <span>Add some creatures to get started!</span>
{:else}
    <div class="encounter-creatures">
        {#each items as [creature, count]}
            <Creature {creature} {count} />
        {/each}
    </div>
{/if}

<style scoped>
    .encounter-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .encounter-creatures {
        display: flex;
        gap: 0.5rem;
        flex-flow: column nowrap;
    }
    .encounter-header :global(.is-disabled) {
        cursor: not-allowed;
    }
    .encounter-controls {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }
</style>
