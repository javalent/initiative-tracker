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
    public state: boolean = false;
    public creatures: Creature[] = [];

    private _app: App;
    parentEl: HTMLElement;
    private _rendered: boolean = false;

    constructor(public leaf: WorkspaceLeaf, private plugin: InitiativeTracker) {
        super(leaf);
        this.creatures = [...this.plugin.players.map((p) => new Creature(p))];
    }

    get stateIcon() {
        return this.state ? STOP : PLAY;
    }
    get stateMessage() {
        return this.state ? "End" : "Start";
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
    addCreatures(...creatures: Creature[]) {
        for (let creature of creatures) {
            this.creatures.push(new Creature(creature));
        }
        if (this._app && this._rendered) {
            this._app.$set({
                creatures: this.creatures
            });
        }
    }
    async onOpen() {
        this.creatures = [...this.plugin.players.map((p) => new Creature(p))];
        this.parentEl = this.containerEl.parentElement;

        console.log(
            "🚀 ~ file: view.ts ~ line 59 ~ this.contentEl.getBoundingClientRect().width",
            this.parentEl.getBoundingClientRect().width <
                MIN_WIDTH_FOR_HAMBURGER
        );
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
        this._rendered = true;
    }
    async onClose() {
        this._app.$destroy();
        this._rendered = false;
    }
}
