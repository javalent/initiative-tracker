import { Plugin, WorkspaceLeaf } from "obsidian";

import {
    DEFAULT_SETTINGS,
    INTIATIVE_TRACKER_VIEW,
    registerIcons
} from "./utils";
import TrackerView from "./view";
import type {
    HomebrewCreature,
    InitiativeTrackerData,
    SRDMonster
} from "../@types/index";

import InitiativeTrackerSettings from "./settings";
import { Creature } from "./utils/creature";

import { BESTIARY } from "./utils/srd-bestiary";

declare module "obsidian" {
    interface App {
        plugins: {
            plugins: {
                "obsidian-5e-statblocks": {
                    data: Map<string, SRDMonster>;
                };
            };
        };
    }
}
export default class InitiativeTracker extends Plugin {
    deleteMonster(name: any) {
        throw new Error("Method not implemented.");
    }
    private view: TrackerView;
    public data: InitiativeTrackerData;
    private _playercreatures: Creature[];
    private _homebrewcreatures: Creature[];
    get players(): Creature[] {
        if (
            !this._playercreatures ||
            this._playercreatures.length != this.data.players.length
        ) {
            this._playercreatures = this.data.players.map(
                (p) => new Creature(p)
            );
        }
        return this._playercreatures;
    }
    set players(players) {
        this.data.players = players;
    }

    private get statblock_creatures() {
        if (!this.data.sync) return [];
        if (!this.app.plugins.plugins["obsidian-5e-statblocks"]) return [];

        return [
            ...Array.from(
                this.app.plugins.plugins["obsidian-5e-statblocks"].data.values()
            ).map((m) => {
                return new Creature({
                    name: m.name,
                    hp: m.hp,
                    ac: m.ac,
                    source: m.source,
                    modifier: Math.floor((m.stats[1] - 10) / 2)
                });
            }),
            ...this._homebrewcreatures
        ];
    }

    get homebrew() {
        if (
            !this._homebrewcreatures ||
            this._homebrewcreatures.length != this.data.homebrew.length
        ) {
            this._homebrewcreatures = this.data.homebrew.map(
                (p) => new Creature(p)
            );
        }
        return [...this.statblock_creatures, ...this._homebrewcreatures];
    }

    get bestiary() {
        return [...BESTIARY, ...this.homebrew];
    }

    async onload() {
        registerIcons();

        await this.loadSettings();

        /* if (this.data.sync) {
			this.loadFromStatblocks();
		} */

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

        this.addCommand({
            id: "toggle-encounter",
            name: "Toggle Encounter",
            checkCallback: (checking) => {
                if (checking) {
                    return (
                        this.app.workspace.getLeavesOfType(
                            INTIATIVE_TRACKER_VIEW
                        ).length != 0
                    );
                }
                this.view.toggleState();
            }
        });
        this.addCommand({
            id: "next-combatant",
            name: "Next Combatant",
            checkCallback: (checking) => {
                if (checking) {
                    return (
                        this.app.workspace.getLeavesOfType(
                            INTIATIVE_TRACKER_VIEW
                        ).length != 0 && this.view.state
                    );
                }
                this.view.goToNext();
            }
        });
        this.addCommand({
            id: "prev-combatant",
            name: "Previous Combatant",
            checkCallback: (checking) => {
                if (checking) {
                    return (
                        this.app.workspace.getLeavesOfType(
                            INTIATIVE_TRACKER_VIEW
                        ).length != 0 && this.view.state
                    );
                }
                this.view.goToPrevious();
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
        console.log("Initiative Tracker v" + this.manifest.version + " loaded");
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
            type: INTIATIVE_TRACKER_VIEW
        });
    }

    async saveMonsters(importedMonsters: HomebrewCreature[]) {
        this.data.homebrew.push(...importedMonsters);

        await this.saveSettings();
    }

    async loadSettings() {
        const data = Object.assign(
            {},
            { ...DEFAULT_SETTINGS },
            await this.loadData()
        );

        this.data = data;
    }

    async saveSettings() {
        await this.saveData(this.data);
    }
}
