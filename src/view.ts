import { ExtraButtonComponent, ItemView, WorkspaceLeaf } from "obsidian";
import {
    INITIATIVE_TRACKER_BASE,
    INITIATIVE_TRACKER_PLAY,
    INITIATIVE_TRACKER_REMOVE,
    INITIATIVE_TRACKER_STOP,
    INTIATIVE_TRACKER_VIEW
} from "./utils";

import type InitiativeTracker from "./main";

/* import { createApp } from "vue";
import App from "./ui/App.vue"; */

import App from "./svelte/App.svelte";

export default class TrackerView extends ItemView {
    private readonly buttons: HTMLElement = createDiv(
        "initiative-tracker-buttons nav-buttons-container"
    );
    private readonly table: HTMLElement = createDiv("initiative-tracker-table");
    private state: boolean = false;

    public creatures: any[] = [];
    private _app: any;

    constructor(leaf: WorkspaceLeaf, private plugin: InitiativeTracker) {
        super(leaf);

        this._buildControls();
    }

    private get stateIcon() {
        return this.state ? INITIATIVE_TRACKER_STOP : INITIATIVE_TRACKER_PLAY;
    }
    private get stateMessage() {
        return this.state ? "End" : "Start";
    }

    getViewType() {
        return INTIATIVE_TRACKER_VIEW;
    }
    getDisplayText() {
        return "Initiative Tracker";
    }
    getIcon() {
        return INITIATIVE_TRACKER_BASE;
    }
    async onOpen() {
        //this._build();

        /* this._app = createApp(App, { plugin: this.plugin }).mount(this.contentEl); */
        this._app = new App({
            target: this.contentEl,
            props: {
                creatures: this.creatures
            }
        });
    }

    addNewCreature() {
        this.creatures.push(new Creature("test" + Math.random(), 1));
        this._buildTable();
    }

    private _build() {
        const contentEl = createDiv("obsidian-initiative-tracker");

        /** Add Control Buttons */
        this._buildControls();
        contentEl.appendChild(this.buttons);

        /** Add Creatures Table */
        this._buildTable();
        contentEl.appendChild(this.table);

        /** Add New Creature Button */
        const addEl = contentEl.createDiv("initiative-add-creature-container");
        const add = new ExtraButtonComponent(
            addEl.createDiv("initiative-add-creature-button")
        )
            .setTooltip("Add Creature")
            .setIcon("plus-with-circle")
            .onClick(() => {
                this.addNewCreature();
                console.log("Add New");
            });

        this.containerEl.replaceWith(contentEl);
        this.containerEl = contentEl;
    }

    private _buildControls() {
        this.buttons.empty();

        const state = new ExtraButtonComponent(this.buttons)
            .setIcon(this.stateIcon)
            .setTooltip(this.stateMessage)
            .setDisabled(this.creatures.length == 0 && !this.state)
            .onClick(() => {
                this.state = !this.state;
                this._buildControls();
            });
    }

    private _buildTable() {
        this.table.empty();

        if (!this.creatures.length) {
            this.table.addClass("no-creatures");
            this.table.createSpan({
                text: "Add a creature to get started!"
            });
            return;
        }
        this.table.removeClass("no-creatures");

        console.log(
            "🚀 ~ file: view.ts ~ line 120 ~ this.creatures",
            this.creatures
        );
        for (let creature of this.creatures) {
            const creatureEl = this.table.createDiv(
                "initiative-tracker-creature"
            );
            creatureEl.createSpan({
                text: creature.name
            });
            new ExtraButtonComponent(creatureEl)
                .setIcon(INITIATIVE_TRACKER_REMOVE)
                .setTooltip("Remove")
                .onClick(() => {
                    this.creatures = this.creatures.filter(
                        (c) => c != creature
                    );
                    this._buildTable();
                });
        }
    }
}

class Creature {
    constructor(public name?: string, public initiative?: number) {}
}
