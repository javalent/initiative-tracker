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
    public current: number = 0;
    public players: Creature[] = [];
    public state: boolean = false;

    private _app: App;
    private _rendered: boolean = false;

    constructor(public leaf: WorkspaceLeaf, public plugin: InitiativeTracker) {
        super(leaf);

        this.players = [...this.plugin.players.map((p) => new Creature(p))];
        this.creatures = [...this.players];
    }

    get ordered() {
        const creatures = [...this.creatures];
        creatures.sort((a, b) => b.initiative - a.initiative);
        return creatures;
    }

    get enabled() {
        return this.ordered
            .map((c, i) => c.enabled && i)
            .filter((i) => typeof i === "number");
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
        for (let creature of creatures) {
            this.creatures = this.creatures.filter((c) => c != creature);
        }

        this.setAppState({
            creatures: this.ordered
        });
    }

    newEncounter() {
        this.creatures = [...this.players];

        for (let creature of this.creatures) {
            creature.hp = creature.max;
            creature.status = new Set();
            creature.enabled = true;
            creature.initiative =
                Math.floor(Math.random() * 19 + 1) + creature.modifier;
        }
        this.setAppState({
            creatures: this.ordered
        });
    }

    resetEncounter() {
        for (let creature of this.creatures) {
            creature.hp = creature.max;
            creature.status = new Set();
            creature.enabled = true;
        }

        this.current = this.enabled[0];

        this.setAppState({
            creatures: this.ordered
        });
    }

    rollInitiatives() {
        for (let creature of this.creatures) {
            creature.initiative =
                Math.floor(Math.random() * 19 + 1) + creature.modifier;
        }

        this.setAppState({
            creatures: this.ordered
        });
    }

    goToNext() {
        const current = this.enabled.indexOf(this.current);

        const next =
            (((current + 1) % this.enabled.length) + this.enabled.length) %
            this.enabled.length;

        this.current = this.enabled[next];

        this.setAppState({
            state: this.state,
            current: this.current
        });
    }
    goToPrevious() {
        const current = this.enabled.indexOf(this.current);
        const next =
            (((current - 1) % this.enabled.length) + this.enabled.length) %
            this.enabled.length;

        this.current = this.enabled[next];

        this.setAppState({
            state: this.state,
            current: this.current
        });
    }
    toggleState() {
        this.state = !this.state;

        if (this.state) {
            this.current = this.enabled[0];
        }

        this.setAppState({
            state: this.state,
            current: this.current
        });
    }
    addStatus(creature: Creature, tag: string) {
        creature.status.add(tag);
        this.setAppState({
            creatures: this.ordered
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
        if (initiative) {
            creature.initiative = Number(initiative);
        }
        if (name) {
            creature.name = name;
        }
        if (hp) {
            creature.hp += Number(hp);
        }
        if (ac) {
            creature.ac = ac;
        }

        this.setAppState({
            creatures: this.ordered
        });
    }
    setCreatureState(creature: Creature, enabled: boolean) {
        if (enabled) {
            this._enableCreature(creature);
        } else {
            this._disableCreature(creature);
        }
        if (!this.enabled.length) {
            this.current = null;
        }
        this.setAppState({
            creatures: this.ordered,
            current: this.current
        });
    }
    private _enableCreature(creature: Creature) {
        creature.enabled = true;

        if (this.enabled.length == 1) {
            this.current = this.enabled[0];
        }
    }
    private _disableCreature(creature: Creature) {
        if (this.ordered[this.current] == creature) {
            this.goToNext();
        }
        creature.enabled = false;
    }

    setAppState(state: { [key: string]: any }) {
        if (this._app && this._rendered) {
            this._app.$set(state);
        }
    }
    async onOpen() {
        this.creatures = [...this.plugin.players.map((p) => new Creature(p))];
        /*  */
        this._app = new App({
            target: this.contentEl,
            props: {
                view: this,
                creatures: this.ordered,
                show:
                    this.contentEl.getBoundingClientRect().width <
                    MIN_WIDTH_FOR_HAMBURGER,
                state: this.state,
                current: this.current
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
