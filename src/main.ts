import { addIcon, Plugin, WorkspaceLeaf } from "obsidian";

import {
    HAMBURGER,
    HAMBURGER_ICON,
    AC,
    AC_ICON,
    BACKWARD,
    BACKWARD_ICON,
    BASE,
    FORWARD,
    FORWARD_ICON,
    GRIP,
    GRIP_ICON,
    HP,
    HP_ICON,
    ICON,
    PLAY,
    PLAY_ICON,
    REMOVE,
    REMOVE_ICON,
    RESTART,
    RESTART_ICON,
    SAVE,
    SAVE_ICON,
    STOP,
    STOP_ICON,
    INTIATIVE_TRACKER_VIEW
} from "./utils";
import TrackerView from "./view";

import "./main.css";

export default class InitiativeTracker extends Plugin {
    private view: TrackerView;
    async onload() {
        console.log("Loading Initiative Tracker v" + this.manifest.version);
        this.registerIcons();

        await this.loadSettings();

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

    async loadSettings() {}

    async saveSettings() {}

    private registerIcons() {
        addIcon(BASE, ICON);

        addIcon(SAVE, SAVE_ICON);
        addIcon(REMOVE, REMOVE_ICON);
        addIcon(RESTART, RESTART_ICON);
        addIcon(PLAY, PLAY_ICON);
        addIcon(FORWARD, FORWARD_ICON);
        addIcon(BACKWARD, BACKWARD_ICON);
        addIcon(STOP, STOP_ICON);
        addIcon(GRIP, GRIP_ICON);
        addIcon(HP, HP_ICON);
        addIcon(AC, AC_ICON);
        addIcon(HAMBURGER, HAMBURGER_ICON);
    }
}
