import { ExtraButtonComponent, ItemView, WorkspaceLeaf } from "obsidian";
import { BASE, PLAY, REMOVE, STOP, INTIATIVE_TRACKER_VIEW } from "./utils";

import type InitiativeTracker from "./main";

/* import { createApp } from "vue";
import App from "./ui/App.vue"; */

import App from "./svelte/App.svelte";

export default class TrackerView extends ItemView {
    public state: boolean = false;
    public creatures: Creature[] = [
        {
            name: "auto",
            initiative: Math.floor(20 * Math.random() + 1),
            hp: 20,
            ac: 15
        }
    ];

    private _app: App;

    constructor(public leaf: WorkspaceLeaf, private plugin: InitiativeTracker) {
        super(leaf);
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
    async onOpen() {
        //this._build();

        /* this._app = createApp(App, { plugin: this.plugin }).mount(this.contentEl); */
        this._app = new App({
            target: this.contentEl,
            props: {
                view: this,
                creatures: this.creatures
            }
        });
    }
    async onClose() {
        this._app.$destroy();
    }
}

export class Creature {
    constructor(
        public name?: string,
        public initiative?: number,
        public modifier?: number,
        public hp?: number,
        public ac?: number,
        public note?: string
    ) {}
}
