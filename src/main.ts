import { Notice, Plugin, WorkspaceLeaf } from "obsidian";

import type ObsidianLeafletPlugin from "../../obsidian-leaflet-plugin/src/main";
import type DiceRollerPlugin from "../../obsidian-dice-roller/src/main";

import {
    DEFAULT_SETTINGS,
    INTIATIVE_TRACKER_VIEW,
    registerIcons
} from "./utils";
import type {
    EventsOnArgs,
    HomebrewCreature,
    InitiativeTrackerData,
    SRDMonster
} from "../@types/index";

import InitiativeTrackerSettings from "./settings";
import { Encounter } from "./encounter";

import { Creature } from "./utils/creature";

import { BESTIARY } from "./utils/srd-bestiary";

import TrackerView from "./view";

interface AppPlugins {
    "obsidian-5e-statblocks": {
        data: Map<string, SRDMonster>;
    };
    "obsidian-dice-roller": DiceRollerPlugin;
    "obsidian-leaflet-plugin": ObsidianLeafletPlugin;
    "initiative-tracker": InitiativeTracker;
}

declare module "obsidian" {
    interface App {
        plugins: {
            getPlugin<T extends keyof AppPlugins>(plugin: T): AppPlugins[T];
            getPlugin(plugin: string): Plugin;
            plugins: { [key: string]: any };
        };
    }
    interface WorkspaceItem {
        containerEl: HTMLElement;
    }
    interface Workspace {
        on(...args: EventsOnArgs): EventRef;
    }
}

export default class InitiativeTracker extends Plugin {
    public data: InitiativeTrackerData;
    playerCreatures: Map<HomebrewCreature, Creature> = new Map();
    homebrewCreatures: Map<HomebrewCreature, Creature> = new Map();
    encounterHandler = new Encounter(this);
    async parseDice(text: string) {
        if (!this.canUseDiceRoller) return null;

        return await this.app.plugins.plugins["obsidian-dice-roller"].parseDice(
            text
        );
    }
    getRoller(str: string) {
        if (!this.canUseDiceRoller) return;
        const roller = this.app.plugins
            .getPlugin("obsidian-dice-roller")
            .getRoller(str, "statblock", true);
        return roller;
    }
    get canUseDiceRoller() {
        return "obsidian-dice-roller" in this.app.plugins.plugins;
    }

    get canUseStatBlocks() {
        return "obsidian-5e-statblocks" in this.app.plugins.plugins;
    }

    get canUseLeaflet() {
        return (
            "obsidian-leaflet-plugin" in this.app.plugins.plugins &&
            Number(
                this.app.plugins.plugins["obsidian-leaflet-plugin"].data
                    ?.version?.major >= 4
            )
        );
    }

    get leaflet() {
        if (this.canUseLeaflet) {
            return this.app.plugins.plugins["obsidian-leaflet-plugin"];
        }
    }

    get statblock_creatures() {
        if (!this.data.sync) return [];
        if (!this.app.plugins.plugins["obsidian-5e-statblocks"]) return [];

        return [
            ...Array.from(
                this.app.plugins.plugins["obsidian-5e-statblocks"].data.values()
            )
        ];
    }

    get homebrew() {
        return [...this.statblock_creatures, ...this.data.homebrew];
    }

    get bestiary() {
        return [...BESTIARY, ...this.homebrew];
    }

    get view() {
        const leaves = this.app.workspace.getLeavesOfType(
            INTIATIVE_TRACKER_VIEW
        );
        const leaf = leaves.length ? leaves[0] : null;
        if (leaf && leaf.view && leaf.view instanceof TrackerView)
            return leaf.view;
    }

    async onload() {
        registerIcons();

        await this.loadSettings();

        this.addSettingTab(new InitiativeTrackerSettings(this));

        this.registerView(
            INTIATIVE_TRACKER_VIEW,
            (leaf: WorkspaceLeaf) => new TrackerView(leaf, this)
        );

        this.addCommands();

        this.registerEvent(
            this.app.workspace.on(
                "initiative-tracker:should-save",
                async () => await this.saveSettings()
            )
        );
        this.registerEvent(
            this.app.workspace.on(
                "initiative-tracker:start-encounter",
                async (homebrews: HomebrewCreature[]) => {
                    try {
                        const creatures = homebrews.map((h) =>
                            Creature.from(h)
                        );
                        if (!this.view) {
                            await this.addTrackerView();
                        }
                        if (this.view) {
                            this.view?.newEncounter({
                                creatures
                            });
                            this.app.workspace.revealLeaf(this.view.leaf);
                        } else {
                            new Notice(
                                "Could not find the Initiative Tracker. Try reloading the note!"
                            );
                        }
                    } catch (e) {
                        new Notice(
                            "There was an issue launching the encounter.\n\n" +
                                e.message
                        );
                        console.error(e);
                        return;
                    }
                }
            )
        );

        this.registerMarkdownCodeBlockProcessor("encounter", (src, el, ctx) => {
            this.encounterHandler.postprocess(src, el, ctx);
        });

        this.playerCreatures = new Map(
            this.data.players.map((p) => [p, Creature.from(p)])
        );
        this.homebrewCreatures = new Map(
            this.bestiary.map((p) => [p, Creature.from(p)])
        );

        this.app.workspace.onLayoutReady(() => this.addTrackerView());

        console.log("Initiative Tracker v" + this.manifest.version + " loaded");
    }

    addCommands() {
        this.addCommand({
            id: "open-tracker",
            name: "Open Initiative Tracker",
            checkCallback: (checking) => {
                if (!this.view) {
                    if (!checking) {
                        this.addTrackerView();
                    }
                    return true;
                }
            }
        });

        this.addCommand({
            id: "toggle-encounter",
            name: "Toggle Encounter",
            checkCallback: (checking) => {
                if (this.view) {
                    if (!checking) {
                        this.view.toggleState();
                    }
                    return true;
                }
            }
        });

        this.addCommand({
            id: "next-combatant",
            name: "Next Combatant",
            checkCallback: (checking) => {
                if (this.view && this.view.state) {
                    if (!checking) {
                        this.view.goToNext();
                    }
                    return true;
                }
            }
        });

        this.addCommand({
            id: "prev-combatant",
            name: "Previous Combatant",
            checkCallback: (checking) => {
                if (this.view && this.view.state) {
                    if (!checking) {
                        this.view.goToPrevious();
                    }
                    return true;
                }
            }
        });
    }

    async onunload() {
        await this.saveSettings();
        this.app.workspace.trigger("initiative-tracker:unload");
        this.app.workspace
            .getLeavesOfType(INTIATIVE_TRACKER_VIEW)
            .forEach((leaf) => leaf.detach());
        console.log("Initiative Tracker unloaded");
    }

    async addTrackerView() {
        if (this.app.workspace.getLeavesOfType(INTIATIVE_TRACKER_VIEW).length) {
            return;
        }
        await this.app.workspace.getRightLeaf(false).setViewState({
            type: INTIATIVE_TRACKER_VIEW
        });
    }

    async saveMonsters(importedMonsters: HomebrewCreature[]) {
        this.data.homebrew.push(...importedMonsters);

        for (let monster of importedMonsters) {
            this.homebrewCreatures.set(monster, Creature.from(monster));
        }

        await this.saveSettings();
    }
    async saveMonster(monster: HomebrewCreature) {
        this.data.homebrew.push(monster);
        this.homebrewCreatures.set(monster, Creature.from(monster));
        await this.saveSettings();
    }
    async updatePlayer(existing: HomebrewCreature, player: HomebrewCreature) {
        if (!this.playerCreatures.has(existing)) {
            await this.savePlayer(player);
            return;
        }

        const creature = this.playerCreatures.get(existing);
        creature.update(player);

        this.data.players.splice(
            this.data.players.indexOf(existing),
            1,
            player
        );

        this.playerCreatures.set(player, creature);
        this.playerCreatures.delete(existing);

        if (this.view) {
            this.view.updateState();
        }

        await this.saveSettings();
    }
    async updateMonster(existing: HomebrewCreature, monster: HomebrewCreature) {
        if (!this.homebrewCreatures.has(existing)) {
            await this.saveMonster(monster);
            return;
        }

        const creature = this.homebrewCreatures.get(existing);
        creature.update(monster);

        this.data.homebrew.splice(
            this.data.homebrew.indexOf(existing),
            1,
            monster
        );

        this.homebrewCreatures.set(monster, creature);
        this.homebrewCreatures.delete(existing);

        if (this.view) {
            this.view.updateState();
        }

        await this.saveSettings();
    }
    async deleteMonster(monster: HomebrewCreature) {
        this.data.homebrew = this.data.homebrew.filter((m) => m != monster);
        this.homebrewCreatures.delete(monster);

        await this.saveSettings();
    }

    async savePlayer(player: HomebrewCreature) {
        this.data.players.push(player);
        this.playerCreatures.set(player, Creature.from(player));
        await this.saveSettings();
    }
    async savePlayers(...players: HomebrewCreature[]) {
        for (let monster of players) {
            this.data.players.push(monster);
            this.playerCreatures.set(monster, Creature.from(monster));
        }
        await this.saveSettings();
    }

    async deletePlayer(player: HomebrewCreature) {
        this.data.players = this.data.players.filter((p) => p != player);
        this.playerCreatures.delete(player);
        await this.saveSettings();
    }

    async loadSettings() {
        const data = Object.assign(
            {},
            { ...DEFAULT_SETTINGS },
            await this.loadData()
        );

        this.data = data;
        if (
            this.data.leafletIntegration &&
            !this.data.players.every((p) => p.marker)
        ) {
            this.data.players = this.data.players.map((p) => {
                p.marker = p.marker ?? this.data.playerMarker;
                return p;
            });
        }
    }

    async saveSettings() {
        if (
            this.data.leafletIntegration &&
            !this.data.players.every((p) => p.marker)
        ) {
            this.data.players = this.data.players.map((p) => {
                p.marker = p.marker ?? this.data.playerMarker;
                return p;
            });
        }

        await this.saveData(this.data);
    }
}
