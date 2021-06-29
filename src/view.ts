import { ItemView, WorkspaceLeaf } from "obsidian";
import {
    BASE,
    PLAY,
    STOP,
    INTIATIVE_TRACKER_VIEW,
    MIN_WIDTH_FOR_HAMBURGER
} from "./utils";

import type InitiativeTracker from "./main";

/* import { createApp } from "vue";
import App from "./ui/App.vue"; */

import App from "./svelte/App.svelte";
import { Creature } from "./utils/creature";

export default class TrackerView extends ItemView {
    public creatures: Creature[] = [];
    public current: number;
    public players: Creature[] = [];
    public parentEl: HTMLElement;
    public state: boolean = false;

    private _app: App;
    private _rendered: boolean = false;

    constructor(public leaf: WorkspaceLeaf, public plugin: InitiativeTracker) {
        super(leaf);

        this.players = [...this.plugin.players];
        this.creatures = [...this.players];
    }

    get ordered() {
        const creatures = [...this.creatures];
        creatures.sort((a, b) => b.initiative - a.initiative);
        return creatures;
    }

    addCreatures(...creatures: Creature[]) {
        for (let creature of creatures) {
            this.creatures.push(creature);
        }

        this.setAppState({
            creatures: this.ordered
        });
    }

    removeCreature(...creatures: Creature[]) {
        console.log("🚀 ~ file: view.ts ~ line 52 ~ creatures", creatures);
        for (let creature of creatures) {
            this.creatures = this.creatures.filter((c) => c != creature);
        }
        console.log(
            "🚀 ~ file: view.ts ~ line 55 ~ this.creatures",
            this.creatures
        );

        this.setAppState({
            creatures: this.ordered
        });
    }
    goToNext() {}
    goToPrevious() {}
    toggleState() {
        this.state = !this.state;

        this.setAppState({
            state: this.state
        });
    }
    updateCreature(
        creature: Creature,
        {
            hp,
            ac,
            initiative,
            name
        }: { hp?: number; ac?: number; initiative?: number; name?: string }
    ) {
        creature.initiative = initiative;

        this.setAppState({
            creatures: this.ordered
        });
    }
    setCreatureState(creature: Creature, state: "enabled" | "disabled") {}

    setAppState(state: { [key: string]: any }) {
        if (this._app && this._rendered) {
            this._app.$set(state);
        }
    }
    async onOpen() {
        this.creatures = [...this.plugin.players.map((p) => new Creature(p))];
        this.parentEl = this.containerEl.parentElement;

        this._app = new App({
            target: this.contentEl,
            props: {
                view: this,
                creatures: this.creatures,
                show:
                    this.contentEl.getBoundingClientRect().width <
                    MIN_WIDTH_FOR_HAMBURGER
            }
        });

        this._app.$on("new-encounter", () => {
            this._app.creatures = [
                ...this.plugin.players.map((p) => new Creature(p))
            ];
        });
        this._rendered = true;
    }
    async onClose() {
        this._app.$destroy();
        this._rendered = false;
    }

    getViewType() {
        return INTIATIVE_TRACKER_VIEW;
    }
    getDisplayText() {
        return "Initiative Tracker";
    }
    getIcon() {
        return BASE;
    }
}
