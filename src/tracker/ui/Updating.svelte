<script lang="ts">
    import type { Condition, UpdateLogMessage } from "@types";
    import { setIcon } from "obsidian";
    import type InitiativeTracker from "src/main";
    import { HP, REMOVE, TAG } from "src/utils";
    import { ConditionSuggestionModal } from "src/utils/suggester";
    import { getContext } from "svelte";

    import { tracker } from "../stores/tracker";
    const { updating } = tracker;

    const plugin = getContext<InitiativeTracker>("plugin");
    const hpIcon = (node: HTMLElement) => {
        setIcon(node, HP);
    };
    const tagIcon = (node: HTMLElement) => {
        setIcon(node, TAG);
    };
    const removeIcon = (node: HTMLElement) => {
        setIcon(node, REMOVE);
    };
    const checkIcon = (node: HTMLElement) => {
        setIcon(node, "check");
    };
    const cancelIcon = (node: HTMLElement) => {
        setIcon(node, "cross-in-box");
    };
    let damage: string = "";
    let status: Condition = null;

    let modal: ConditionSuggestionModal;
    const suggestConditions = (node: HTMLInputElement) => {
        modal = new ConditionSuggestionModal(plugin, node);
        modal.onClose = () => {
            status = modal.condition;
            node.focus();
        };
        modal.open();
    };
    function init(el: HTMLInputElement) {
        el.focus();
    }
    const performUpdate = (perform: boolean) => {
        if (perform) {
            tracker.doUpdate(damage ?? "", status);
        } else {
            tracker.clearUpdate();
        }
        damage = null;
        status = null;
        return;
    };
</script>

{#if $updating.size}
    <div class="updating-container">
        <div class="updating-hp">
            <!-- svelte-ignore a11y-autofocus -->
            <div class="hp-status">
                {#if plugin.data.beginnerTips}
                    <small class="label">
                        Apply damage, healing(-) or temp HP(t)
                    </small>
                {/if}
                <div class="input">
                    <tag
                        use:hpIcon
                        aria-label="Apply damage, healing(-) or temp HP(t)"
                        style="margin: 0 0.2rem 0 0.7rem"
                    />
                    <input
                        type="text"
                        bind:value={damage}
                        on:keydown={function (evt) {
                            if (evt.key == "Tab") {
                                return true;
                            }
                            if (evt.key == "Enter" || evt.key == "Escape") {
                                performUpdate(evt.key == "Enter");
                                return;
                            }
                            if (
                                !/^(t?-?\d*\.?\d*(Backspace|Delete|Arrow\w+)?)$/.test(
                                    this.value + evt.key
                                )
                            ) {
                                evt.preventDefault();
                                return false;
                            }
                        }}
                        use:init
                    />
                </div>
            </div>
            <div class="hp-status">
                {#if plugin.data.beginnerTips}
                    <small class="label">
                        Apply status effect to creatures that fail their saving
                        throw
                    </small>
                {/if}
                <div class="input">
                    <tag
                        use:tagIcon
                        aria-label="Apply status effect to creatures that fail their saving throw"
                        style="margin: 0 0.2rem 0 0.7rem"
                    />
                    <input
                        type="text"
                        on:focus={function (evt) {
                            suggestConditions(this);
                        }}
                        on:keydown={function (evt) {
                            if (["Enter", "Escape"].includes(evt.key)) {
                                performUpdate(evt.key == "Enter");
                            }
                        }}
                    />
                </div>
            </div>
        </div>
        <div class="updating-buttons">
            <span
                use:checkIcon
                on:click={() => performUpdate(true)}
                style="cursor:pointer"
                aria-label="Apply"
            />
            <span
                use:cancelIcon
                on:click={() => performUpdate(false)}
                style="cursor:pointer"
                aria-label="Cancel"
            />
        </div>
    </div>
    {#if plugin.data.beginnerTips}
        <div>
            <small>Multiple creatures can be selected at a time.</small>
        </div>
    {/if}
    <div style="margin: 0.5rem">
        <table class="updating-creature-table">
            <thead class="updating-creature-table-header">
                <th
                    style="padding:0 0.2rem 0 0; cursor:pointer"
                    class="left"
                    use:removeIcon
                    on:click={() => performUpdate(false)}
                />
                <th style="width:100%" class="left">Name</th>
                <th style="padding:0 0.2rem" class="center">Saved</th>
                <th style="padding:0 0.2rem" class="center">Resist</th>
                <th style="padding:0 0.2rem" class="center">Modifier</th>
            </thead>
            <tbody>
                {#each [...$updating.entries()] as [creature, update], i}
                    <tr class="updating-creature-table-row">
                        <td
                            use:removeIcon
                            on:click={function (evt) {
                                tracker.setUpdate(creature, evt);
                            }}
                            style="cursor:pointer"
                        />
                        <td>
                            <span>
                                {creature.name +
                                    (creature.number
                                        ? " " + creature.number
                                        : "")}
                            </span>
                        </td>
                        <td class="center">
                            <input
                                type="checkbox"
                                checked={update.saved}
                                on:click={function (evt) {
                                    update.saved = !update.saved;
                                }}
                            />
                        </td>
                        <td class="center">
                            <input
                                type="checkbox"
                                checked={update.resist}
                                on:click={function (evt) {
                                    update.resist = !update.resist;
                                }}
                            />
                        </td>
                        <td class="center">
                            <input
                                type="number"
                                class="center"
                                style="width:90%; height:80%; padding:0;"
                                bind:value={update.customMod}
                                on:keydown={function (evt) {
                                    if (evt.key === "Escape") {
                                        this.value = "1";
                                        return;
                                    }
                                    if (evt.key === "Enter") {
                                        evt.preventDefault();
                                        return;
                                    }
                                }}
                            />
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
{/if}

<style scoped>
    .input {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .left {
        text-align: left;
    }
    .center {
        text-align: center;
    }
    .updating-hp {
        display: flex;
        flex-flow: column;
        gap: 0.5rem;
    }
    .updating-container {
        display: flex;
        flex-flow: column nowrap;
        gap: 0.5rem;
    }
    .hp-status {
        display: flex;
        flex-flow: column;
    }
    .updating-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-right: 1.2rem;
    }
</style>
