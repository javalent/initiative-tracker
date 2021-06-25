import { Plugin, WorkspaceLeaf } from "obsidian";

import { INTIATIVE_TRACKER_VIEW, registerIcons } from "./utils";
import TrackerView, { Creature } from "./view";
import type { InitiativeTrackerData } from "../@types/index";

import "./main.css";
import InitiativeTrackerSettings from "./settings";

export default class InitiativeTracker extends Plugin {
    private view: TrackerView;
    public data: InitiativeTrackerData;
    get players(): Creature[] {
        return this.data.players;
    }
    set players(players) {
        this.data.players = players;
    }
    async onload() {
        console.log("Loading Initiative Tracker v" + this.manifest.version);
        registerIcons();

        await this.loadSettings();

        this.addSettingTab(new InitiativeTrackerSettings(this));

        this.registerView(
            INTIATIVE_TRACKER_VIEW,
            (leaf: WorkspaceLeaf) => (this.view = new TrackerView(leaf, this))
        );

        this.addCommand({
            id: "open-tracker",
            name: "Open Initiative Tracker",
            checkCallback: (checking) => {
                if (checking)
                    return (
                        this.app.workspace.getLeavesOfType(
                            INTIATIVE_TRACKER_VIEW
                        ).length === 0
                    );
                this.addTrackerView();
            }
        });
        if (this.app.workspace.layoutReady) {
            this.addTrackerView();
        } else {
            this.registerEvent(
                this.app.workspace.on(
                    "layout-ready",
                    this.addTrackerView.bind(this)
                )
            );
        }
    }

    onunload() {
        this.app.workspace
            .getLeavesOfType(INTIATIVE_TRACKER_VIEW)
            .forEach((leaf) => leaf.detach());
        console.log("Initiative Tracker unloaded");
    }

    addTrackerView() {
        if (this.app.workspace.getLeavesOfType(INTIATIVE_TRACKER_VIEW).length) {
            return;
        }
        this.app.workspace.getRightLeaf(false).setViewState({
            type: INTIATIVE_TRACKER_VIEW,
            active: true //TODO: CHANGE BEFORE BUILD
        });
    }

    async loadSettings() {
        const data = Object.assign(
            {},
            { players: [], version: this.manifest.version },
            await this.loadData()
        );
        this.data = data;
    }

    async saveSettings() {
        await this.saveData(this.data);
    }
}
