import {
    addIcon,
    Plugin,
    WorkspaceLeaf,

} from "obsidian";



import { INITIATIVE_TRACKER_BACKWARD, INITIATIVE_TRACKER_BACKWARD_ICON, INITIATIVE_TRACKER_BASE, INITIATIVE_TRACKER_FORWARD, INITIATIVE_TRACKER_FORWARD_ICON, INITIATIVE_TRACKER_ICON, INITIATIVE_TRACKER_PLAY, INITIATIVE_TRACKER_PLAY_ICON, INITIATIVE_TRACKER_REMOVE, INITIATIVE_TRACKER_REMOVE_ICON, INITIATIVE_TRACKER_RESTART, INITIATIVE_TRACKER_RESTART_ICON, INITIATIVE_TRACKER_SAVE, INITIATIVE_TRACKER_SAVE_ICON, INITIATIVE_TRACKER_STOP, INITIATIVE_TRACKER_STOP_ICON, INTIATIVE_TRACKER_VIEW } from './utils';
import TrackerView from "./view";

import "./main.css";

export default class InitiativeTracker extends Plugin {
    private view: TrackerView;
    async onload() {
        console.log("loading plugin");

        await this.loadSettings();

        addIcon(INITIATIVE_TRACKER_BASE, INITIATIVE_TRACKER_ICON);

        addIcon(INITIATIVE_TRACKER_SAVE, INITIATIVE_TRACKER_SAVE_ICON);
        addIcon(INITIATIVE_TRACKER_REMOVE, INITIATIVE_TRACKER_REMOVE_ICON);
        addIcon(INITIATIVE_TRACKER_RESTART, INITIATIVE_TRACKER_RESTART_ICON);
        addIcon(INITIATIVE_TRACKER_PLAY, INITIATIVE_TRACKER_PLAY_ICON);
        addIcon(INITIATIVE_TRACKER_FORWARD, INITIATIVE_TRACKER_FORWARD_ICON);
        addIcon(INITIATIVE_TRACKER_BACKWARD, INITIATIVE_TRACKER_BACKWARD_ICON);
        addIcon(INITIATIVE_TRACKER_STOP, INITIATIVE_TRACKER_STOP_ICON);

        this.registerView(
            INTIATIVE_TRACKER_VIEW,
            (leaf: WorkspaceLeaf) => this.view = new TrackerView(leaf)
        );

        this.addCommand({
            id: 'open-tracker',
            name: 'Open Initiative Tracker',
            checkCallback: (checking) => {
                if (checking) return (
                    this.app.workspace.getLeavesOfType(INTIATIVE_TRACKER_VIEW).length === 0
                )
                this.addTrackerView();
            }
        })
        if (this.app.workspace.layoutReady) {
            this.addTrackerView();
        } else {
            this.registerEvent(
                this.app.workspace.on("layout-ready", this.addTrackerView.bind(this))
            );
        }
    }

    onunload() {
        this.app.workspace
            .getLeavesOfType(INTIATIVE_TRACKER_VIEW)
            .forEach((leaf) => leaf.detach());
    }

    addTrackerView() {
        if (this.app.workspace.getLeavesOfType(INTIATIVE_TRACKER_VIEW).length) {
            return;
        }
        this.app.workspace.getRightLeaf(false).setViewState({
            type: INTIATIVE_TRACKER_VIEW,
        })
    }

    async loadSettings() {
    }

    async saveSettings() {
    }
}
