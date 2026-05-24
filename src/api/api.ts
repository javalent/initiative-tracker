import type { InitiativeViewState } from "src/tracker/view.types";
import type InitiativeTracker from "../main";
import { tracker } from "../tracker/stores/tracker";
import { type Condition, type CreatureState, type CreatureUpdate, type HomebrewCreature } from "src/types/creatures";
import { Creature, getId } from "src/utils/creature";
import { get } from "svelte/store";

declare module "obsidian" {
    interface Workspace {
        on(
            name: "initiative-tracker:should-save",
            callback: () => void
        ): EventRef;
        trigger(name: "initiative-tracker:should-save"): void;
        on(
            name: "initiative-tracker:save-state",
            callback: (state?: InitiativeViewState) => void
        ): EventRef;
        trigger(
            name: "initiative-tracker:save-state",
            state?: InitiativeViewState
        ): void;
        /** This event can be used to start an event by sending an object with a name, HP, AC, and initiative modifier at minimum. */
        on(
            name: "initiative-tracker:start-encounter",
            callback: (creatures: HomebrewCreature[]) => void
        ): EventRef;
        trigger(
            name: "initiative-tracker:start-encounter",
            creatures: HomebrewCreature[]
        ): void;
        on(
            name: "initiative-tracker:stop-viewing",
            callback: (creatures: HomebrewCreature[]) => void
        ): EventRef;
        trigger(name: "initiative-tracker:stop-viewing"): void;
        on(name: "initiative-tracker:unloaded", callback: () => void): EventRef;
        trigger(name: "initiative-tracker:unloaded"): void;
        /** Fired after one or more creatures are added. Payload: the IDs of the added creatures. */
        on(name: "initiative-tracker:creatures-added", callback: (ids: string[]) => void): EventRef;
        trigger(name: "initiative-tracker:creatures-added", ids: string[]): void;
        /** Fired after a creature is removed. Payload: the ID of the removed creature. */
        on(name: "initiative-tracker:creature-removed", callback: (id: string) => void): EventRef;
        trigger(name: "initiative-tracker:creature-removed", id: string): void;
        /** Fired after a creature is updated via the API. Payload: the creature ID and the applied change. */
        on(name: "initiative-tracker:creature-updated", callback: (id: string, change: CreatureUpdate) => void): EventRef;
        trigger(name: "initiative-tracker:creature-updated", id: string, change: CreatureUpdate): void;
    }
}

declare global {
    interface Window {
        InitiativeTracker?: API;
    }
}

export class API {
    #tracker = tracker;
    constructor(public plugin: InitiativeTracker) {
        (window["InitiativeTracker"] = this) &&
            this.plugin.register(() => delete window["InitiativeTracker"]);
    }

    addCreatures(
        creatures: HomebrewCreature[],
        rollHP: boolean = this.plugin.data.rollHP
    ) {
        if (!creatures || !Array.isArray(creatures) || !creatures.length) {
            throw new Error("Creatures must be an array.");
        }
        const instances = creatures.map((c) => Creature.from(c));
        this.#tracker.add(this.plugin, rollHP, ...instances);
        const ids = instances.map((c) => c.id);
        this.plugin.app.workspace.trigger("initiative-tracker:creatures-added", ids);
        return ids;
    }

    newEncounter(state?: InitiativeViewState) {
        if (state?.creatures) {
            state.creatures = state.creatures.map((c) =>
                Creature.from(c).toJSON()
            );
        }
        this.#tracker.new(this.plugin, state);
    }

    /** Returns the current state of all creatures in the encounter. */
    getCreatures(): CreatureState[] {
        return get(this.#tracker).map((c) => c.toJSON());
    }

    /** Returns the current state of a single creature by its ID, or null if not found. */
    getCreature(id: string): CreatureState | null {
        return get(this.#tracker).find((c) => c.id === id)?.toJSON() ?? null;
    }

    /**
     * Removes a creature from the encounter by its ID.
     * The ID is the value set in `HomebrewCreature.id` (or auto-generated at creation).
     */
    removeCreature(id: string) {
        const removed = this.#tracker.removeCreatureById(id);
        if (removed) this.plugin.app.workspace.trigger("initiative-tracker:creature-removed", id);
    }

    /** Removes multiple creatures from the encounter by their IDs. */
    removeCreatures(ids: string[]) {
        for (const id of ids) {
            this.removeCreature(id);
        }
    }

    /**
     * Updates a creature by its ID.
     *
     * HP fields are treated as **absolute** values in this context (not deltas).
     * Use `set_max_hp` to set max HP to an exact value; `max` adjusts by a delta.
     * Use `status` to add conditions and `remove_status` to remove them.
     */
    updateCreature(id: string, change: CreatureUpdate) {
        const updated = this.#tracker.updateCreatureById(id, change);
        if (updated) this.plugin.app.workspace.trigger("initiative-tracker:creature-updated", id, change);
    }

    /**
     * Adds a condition to a creature by its ID.
     * Accepts either a full `Condition` object or a condition name (string).
     * When a name is passed, the plugin's configured statuses are searched first;
     * if not found, a new condition with a generated ID is created.
     */
    addCondition(id: string, condition: Condition | string) {
        let cond: Condition;
        if (typeof condition === "string") {
            cond = this.plugin.data.statuses.find(
                (s) => s.name === condition
            ) ?? { name: condition, description: "", id: getId() };
        } else {
            cond = condition;
        }
        this.updateCreature(id, { status: [cond] });
    }

    /**
     * Removes a condition from a creature by its ID.
     * `conditionIdOrName` is matched against the condition's `id` first, then its `name`.
     * Does nothing if the creature or condition is not found.
     */
    removeCondition(id: string, conditionIdOrName: string) {
        const creature = get(this.#tracker).find((c) => c.id === id);
        if (!creature) return;
        const cond = [...creature.status].find(
            (s) => s.id === conditionIdOrName || s.name === conditionIdOrName
        );
        if (!cond) return;
        this.updateCreature(id, { remove_status: [cond] });
    }
}
