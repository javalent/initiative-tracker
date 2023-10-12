import type { HomebrewCreature } from "obsidian-overload";
import type InitiativeTracker from "../main";
import { tracker } from "../tracker/stores/tracker";
import { type InitiativeViewState } from "../..";
import { Creature } from "src/utils/creature";

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
        this.#tracker.add(
            this.plugin,
            rollHP,
            ...creatures.map((c) => Creature.from(c))
        );
    }
    newEncounter(state?: InitiativeViewState) {
        if (state?.creatures) {
            state.creatures = state.creatures.map((c) =>
                Creature.from(c).toJSON()
            );
        }
        this.#tracker.new(this.plugin, state);
    }
}
