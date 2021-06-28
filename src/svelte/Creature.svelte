<script lang="ts">
    import { createEventDispatcher, afterUpdate } from "svelte";

    import { ExtraButtonComponent, Menu } from "obsidian";
    import {
        DEFAULT_UNDEFINED,
        DISABLE,
        ENABLE,
        HAMBURGER,
        REMOVE,
        TAG
    } from "src/utils";
    import store from "./store";
    import type { Creature } from "src/utils/creature";
    import type TrackerView from "src/view";

    export let creature: Creature;

    const dispatch = createEventDispatcher();

    const updateName = (evt: FocusEvent) => {
        creature.name = (evt.target as HTMLInputElement).value;
        editing = null;
    };

    let current: Creature;
    store.current.subscribe((value) => {
        current = value;
    });

    let isActive: boolean = false;
    store.active.subscribe((value) => {
        isActive = value;
    });

    let show: boolean;
    store.show.subscribe((value) => {
        show = value;
    });

    let creatures: Creature[];
    store.creatures.subscribe((value) => {
        creatures = value;
    });

    let view: TrackerView;
    store.view.subscribe((value) => {
        view = value;
    });

    const deleteButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Remove")
            .setIcon(REMOVE)
            .onClick(() => {
                dispatch("remove", creature);
            });
    };

    const tagButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Add Status")
            .setIcon(TAG)
            .onClick(() => {
                dispatch("tag", creature);
            });
    };

    const enableButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Enable")
            .setIcon(ENABLE)
            .onClick(() => {
                creature.enabled = true;
            });
    };

    const disableButton = (node: HTMLElement) => {
        new ExtraButtonComponent(node)
            .setTooltip("Disable")
            .setIcon(DISABLE)
            .onClick(() => {
                creature.enabled = false;
                if (current == creature) {
                    const enabled = creatures.filter((c) => c.enabled);
                    const index = enabled.indexOf(current);
                    const c =
                        (((index + 1) % enabled.length) + enabled.length) %
                        enabled.length;
                    store.current.set(enabled[c]);
                }
            });
    };

    const hamburgerIcon = (node: HTMLElement) => {
        const hamburger = new ExtraButtonComponent(node).setIcon(HAMBURGER);
        hamburger.extraSettingsEl.onclick = (evt) => {
            const menu = new Menu(view.plugin.app);
            menu.addItem((item) => {
                item.setIcon(TAG)
                    .setTitle("Add Tag")
                    .onClick(() => {
                        dispatch("tag", creature);
                    });
            });
            if (creature.enabled) {
                menu.addItem((item) => {
                    item.setIcon(DISABLE)
                        .setTitle("Disable")
                        .onClick(() => {
                            creature.enabled = false;
                            if (current == creature) {
                                const enabled = creatures.filter(
                                    (c) => c.enabled
                                );
                                const index = enabled.indexOf(current);
                                const c =
                                    (((index + 1) % enabled.length) +
                                        enabled.length) %
                                    enabled.length;
                                store.current.set(enabled[c]);
                            }
                        });
                });
            } else {
                menu.addItem((item) => {
                    item.setIcon(ENABLE)
                        .setTitle("Enable")
                        .onClick(() => {
                            creature.enabled = true;
                        });
                });
            }
            menu.addItem((item) => {
                item.setIcon(REMOVE)
                    .setTitle("Remove")
                    .onClick(() => {
                        dispatch("remove", creature);
                    });
            });
            menu.showAtPosition(evt);
        };
    };

    $: statuses = Array.from(creature.status);
    const deleteIcon = (node: HTMLElement, status: string) => {
        const icon = new ExtraButtonComponent(node)
            .setIcon("cross-in-box")
            .onClick(() => {
                creature.status.delete(status);
                statuses = Array.from(creature.status);
            });
        icon.extraSettingsEl.setAttr("style", "margin-left: 3px;");
    };

    let editing: string = null;
    let initiativeInput: HTMLInputElement;

    afterUpdate(() => {
        initiativeInput.value = `${creature.initiative}`;
    });
</script>

<div
    class="initiative-tracker-creature"
    class:active={current == creature}
    class:disabled={!creature.enabled}
>
    <span class="active-holder">
        {#if current == creature}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                focusable="false"
                data-prefix="fas"
                data-icon="angle-right"
                class="svg-inline--fa fa-angle-right fa-w-8"
                role="img"
                viewBox="0 0 256 512"
                ><path
                    fill="currentColor"
                    d="M224.3 273l-136 136c-9.4 9.4-24.6 9.4-33.9 0l-22.6-22.6c-9.4-9.4-9.4-24.6 0-33.9l96.4-96.4-96.4-96.4c-9.4-9.4-9.4-24.6 0-33.9L54.3 103c9.4-9.4 24.6-9.4 33.9 0l136 136c9.5 9.4 9.5 24.6.1 34z"
                /></svg
            >
        {/if}
    </span>
    <input
        class="editable initiative tree-item-flair"
        bind:this={initiativeInput}
        on:click={function (evt) {
            this.select();
        }}
        on:blur={function (evt) {
            dispatch("initiative", { creature, value: this.value });
        }}
        on:keydown={function (evt) {
            if (evt.key === "Enter" || evt.key === "Tab") {
                evt.preventDefault();
                this.blur();
                return;
            }
            if (!/^(\d*\.?\d*|Backspace|Delete|Arrow\w+)$/.test(evt.key)) {
                evt.preventDefault();
                return;
            }
        }}
        bind:value={creature.initiative}
    />
    {#if creature.player}
        <small>{creature.name}</small>
    {:else}
        <input
            class="editable name"
            type="text"
            on:focus={function (evt) {
                this.select();
            }}
            on:blur={updateName}
            on:keydown={function (evt) {
                if (evt.key === "Enter" || evt.key === "Tab") {
                    evt.preventDefault();
                    this.blur();
                    return;
                }
            }}
            bind:value={creature.name}
        />
    {/if}

    <div class="center">
        <span
            class="editable"
            on:click={() => {
                /* if (creature.hp) */ dispatch("hp", creature);
            }}>{creature.hpDisplay}</span
        >
    </div>

    <span class="center">{creature.ac ?? DEFAULT_UNDEFINED}</span>
    <div class="controls">
        <div class="add-button icon" class:show use:hamburgerIcon />
        <div class="add-button tags" class:show={!show} use:tagButton />
        {#if creature.enabled}
            <div
                class="add-button enable"
                class:show={!show}
                use:disableButton
            />
        {:else}
            <div
                class="add-button enable"
                class:show={!show}
                use:enableButton
            />
        {/if}
        <div class="add-button delete" class:show={!show} use:deleteButton />
    </div>

    <!-- {#if creature.status.length} -->
    <span />
    <span />
    <div class="statuses">
        {#each statuses as status}
            <div class="status">
                <span>{status}</span>
                <div use:deleteIcon={status} />
            </div>
        {/each}
    </div>
    <!-- {/if} -->
</div>

<style>
    .initiative-tracker-creature {
        width: 100%;
        padding: 0.5rem 0;
        display: contents;
    }

    .initiative-tracker-creature.disabled * {
        color: var(--text-faint);
    }

    .active-holder {
        margin-left: -0.5rem;
    }
    .initiative-tracker-creature .initiative {
        display: block;
        padding: 0;
        width: 12px;
        text-align: right;
        white-space: nowrap;
        margin-left: -0.5rem;
        user-select: all;
        background-color: inherit;
        border: 0;
    }
    .initiative-tracker-creature .name {
        display: block;
        text-align: left;
        white-space: nowrap;
        user-select: all;
        background-color: inherit;
        border: 0;
        font-size: smaller;
        padding: 0;
        height: unset;
    }

    .statuses {
        grid-column: span 4;
        font-size: smaller;
        margin-bottom: 0.5rem;
        display: flex;
        flex-flow: row wrap;
    }
    .status {
        margin-right: 0.1rem;
        display: flex;
        align-items: center;
    }

    .status .clickable-icon {
        margin-left: 0;
    }
    .center {
        text-align: center;
    }

    .right {
        margin-left: auto;
    }
    .editable:not(.player) {
        cursor: pointer;
    }
    .controls {
        display: flex;
        justify-content: flex-end;
    }
    .add-button {
        display: none;
    }
    .show {
        display: block;
    }
</style>
