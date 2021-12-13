import { Notice, Plugin, WorkspaceLeaf } from "obsidian";

import {
    DEFAULT_SETTINGS,
    INTIATIVE_TRACKER_VIEW,
    registerIcons
} from "./utils";
import type {
    EventsOnArgs,
    HomebrewCreature,
    InitiativeTrackerData
} from "../@types/index";

import InitiativeTrackerSettings from "./settings";
import { Encounter } from "./encounter";

import { Creature } from "./utils/creature";

import { BESTIARY } from "./utils/srd-bestiary";

import TrackerView from "./view";

import type { Plugins } from "../../obsidian-overload/index";
declare module "obsidian" {
    interface App {
        plugins: {
            getPlugin<T extends keyof Plugins>(plugin: T): Plugins[T];
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
    async parseDice(text: string) {
        if (!this.canUseDiceRoller) return null;

        return await this.app.plugins
            .getPlugin("obsidian-dice-roller")
            .parseDice(text, "initiative-tracker");
    }
    getRoller(str: string) {
        if (!this.canUseDiceRoller) return;
        const roller = this.app.plugins
            .getPlugin("obsidian-dice-roller")
            .getRoller(str, "statblock", true);
        return roller;
    }
    get canUseDiceRoller() {
        return this.app.plugins.getPlugin("obsidian-dice-roller") != null;
    }

    async getInitiativeValue(modifier: number = 0): Promise<number> {
        let initiative = Math.floor(Math.random() * 19 + 1) + modifier;
        if (this.canUseDiceRoller) {
            const num = await this.app.plugins
                .getPlugin("obsidian-dice-roller")
                .parseDice(
                    this.data.initiative.replace(/%mod%/g, `(${modifier})`),
                    "initiative-tracker"
                );

            initiative = num.result;
        }
        return initiative;
    }

    get canUseStatBlocks() {
        return this.app.plugins.getPlugin("obsidian-5e-statblocks") != null;
    }

    get canUseLeaflet() {
        return (
            this.app.plugins.getPlugin("obsidian-leaflet-plugin") != null &&
            Number(
                this.app.plugins.getPlugin("obsidian-leaflet-plugin").data
                    ?.version?.major >= 4
            )
        );
    }

    get leaflet() {
        if (this.canUseLeaflet) {
            return this.app.plugins.getPlugin("obsidian-leaflet-plugin");
        }
    }

    get statblock_creatures() {
        if (!this.data.sync) return [];
        if (!this.app.plugins.getPlugin("obsidian-5e-statblocks")) return [];

        return [
            ...Array.from(
                this.app.plugins
                    .getPlugin("obsidian-5e-statblocks")
                    .data.values()
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

        this.registerMarkdownCodeBlockProcessor("encounter", (src, el, ctx) => {
            const handler = new Encounter(this, src, el);
            ctx.addChild(handler);
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
                const view = this.view;
                if (view) {
                    if (!checking) {
                        view.toggleState();
                    }
                    return true;
                }
            }
        });

        this.addCommand({
            id: "next-combatant",
            name: "Next Combatant",
            checkCallback: (checking) => {
                const view = this.view;
                if (view && view.state) {
                    if (!checking) {
                        view.goToNext();
                    }
                    return true;
                }
            }
        });

        this.addCommand({
            id: "prev-combatant",
            name: "Previous Combatant",
            checkCallback: (checking) => {
                const view = this.view;
                if (view && view.state) {
                    if (!checking) {
                        view.goToPrevious();
                    }
                    return true;
                }
            }
        });
    }

    addEvents() {
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

                        const view = this.view;
                        if (!view) {
                            await this.addTrackerView();
                        }
                        if (view) {
                            view?.newEncounter({
                                creatures
                            });
                            this.app.workspace.revealLeaf(view.leaf);
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

        const view = this.view;
        if (view) {
            view.updateState();
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

        const view = this.view;
        if (view) {
            view.updateState();
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
