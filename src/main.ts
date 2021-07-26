import { Notice, parseYaml, Plugin, WorkspaceLeaf } from "obsidian";

import {
    DEFAULT_SETTINGS,
    INTIATIVE_TRACKER_VIEW,
    registerIcons
} from "./utils";
import type {
    HomebrewCreature,
    InitiativeTrackerData,
    SRDMonster
} from "../@types/index";

import InitiativeTrackerSettings from "./settings";

import { Creature } from "./utils/creature";

import { BESTIARY } from "./utils/srd-bestiary";

import Encounter from "./svelte/Encounter.svelte";

import TrackerView from "./view";
declare module "obsidian" {
    interface App {
        plugins: {
            plugins: {
                "obsidian-5e-statblocks": {
                    data: Map<string, SRDMonster>;
                };
                "obsidian-dice-roller": {
                    parseDice(text: string): Promise<{ result: number }>;
                };
            };
        };
    }
    interface WorkspaceItem {
        containerEl: HTMLElement;
    }
}
export default class InitiativeTracker extends Plugin {
    public data: InitiativeTrackerData;
    private _playercreatures: Creature[];
    private _homebrewcreatures: Creature[];
    get players(): Creature[] {
        if (
            !this._playercreatures ||
            this._playercreatures.length != this.data.players.length
        ) {
            this._playercreatures = this.data.players.map(
                (p) => new Creature({ ...p })
            );
        }
        return this._playercreatures;
    }
    set players(players) {
        this.data.players = players;
    }

    get canUseDiceRoller() {
        return "obsidian-dice-roller" in this.app.plugins.plugins;
    }

    get canUseStatBlocks() {
        return "obsidian-5e-statblocks" in this.app.plugins.plugins;
    }

    get statblock_creatures() {
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
            })
        ];
    }

    get homebrew() {
        if (
            !this._homebrewcreatures ||
            this._homebrewcreatures.length != this.data.homebrew.length
        ) {
            this._homebrewcreatures = this.data.homebrew.map(
                (p) => new Creature({ ...p })
            );
        }
        return [...this.statblock_creatures, ...this._homebrewcreatures];
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

        this.registerMarkdownCodeBlockProcessor("encounter", (src, el, ctx) => {
            const encounters = src.split("---") ?? [];
            const containerEl = el.createDiv("encounter-container");
            const empty = containerEl.createSpan({
                text: "No encounters created. Please check your syntax and try again."
            });

            for (let encounter of encounters) {
                try {
                    const params = parseYaml(encounter);
                    const rawMonsters = params.creatures ?? [];

                    let creatures: Creature[];
                    if (rawMonsters && rawMonsters instanceof Array) {
                        creatures = rawMonsters
                            .map((m) => {
                                try {
                                    let monster: string | string[] = m,
                                        number = 1;
                                    if (
                                        typeof m === "object" &&
                                        !(m instanceof Array)
                                    ) {
                                        number = Number(Object.keys(m).shift());
                                        monster = Object.values(
                                            m
                                        ).shift() as string[];
                                    } else if (typeof m === "string") {
                                        try {
                                            let [mon, num] = m
                                                .split(/:\s?/)
                                                .reverse();
                                            if (num && !isNaN(Number(num))) {
                                                number = Number(num);
                                            }
                                            monster = parseYaml(mon);
                                        } catch (e) {
                                            console.error(e);
                                            return;
                                        }
                                    }
                                    if (!monster.length) return;
                                    if (typeof monster == "string") {
                                        monster = [monster.split(",")].flat();
                                    }
                                    let creature: Creature;
                                    const bestiary = this.bestiary.find(
                                        (b) => b.name == monster[0]
                                    );
                                    if (bestiary) {
                                        creature = Creature.from(bestiary);
                                        creature.hp =
                                            monster[1] &&
                                            !isNaN(Number(monster[1]))
                                                ? Number(monster[1])
                                                : creature.hp;
                                        creature.ac =
                                            monster[2] &&
                                            !isNaN(Number(monster[2]))
                                                ? Number(monster[2])
                                                : creature.ac;
                                        creature.modifier =
                                            monster[3] &&
                                            !isNaN(Number(monster[3]))
                                                ? Number(monster[3])
                                                : creature.modifier;
                                    } else {
                                        creature = new Creature({
                                            name: monster[0],
                                            hp:
                                                monster[1] &&
                                                !isNaN(Number(monster[1]))
                                                    ? Number(monster[1])
                                                    : null,
                                            ac:
                                                monster[2] &&
                                                !isNaN(Number(monster[2]))
                                                    ? Number(monster[2])
                                                    : null,
                                            modifier:
                                                monster[3] &&
                                                !isNaN(Number(monster[3]))
                                                    ? Number(monster[3])
                                                    : null
                                        });
                                    }
                                    return [
                                        ...[...Array(number).keys()].map((k) =>
                                            Creature.from(creature)
                                        )
                                    ];
                                } catch (e) {
                                    new Notice(
                                        "Initiative Tracker: could not parse line: \n\n" +
                                            m
                                    );
                                }
                            })
                            .filter((c) => c)
                            .flat();
                    }

                    const encounterEl = containerEl.createDiv("encounter");

                    let players: boolean | string[] = true;
                    if (params.players) {
                        if (params.players === "none") {
                            players = false;
                        } else {
                            players = params.players;
                        }
                    }

                    const instance = new Encounter({
                        target: encounterEl,
                        props: {
                            ...(params.name ? { name: params.name } : {}),
                            players: players,
                            creatures: creatures
                        }
                    });

                    instance.$on("begin-encounter", async () => {
                        if (!this.view) {
                            await this.addTrackerView();
                        }
                        if (this.view) {
                            this.view?.newEncounter({
                                ...params,
                                creatures: creatures
                            });
                            this.app.workspace.revealLeaf(this.view.leaf);
                        } else {
                            new Notice(
                                "Could not find the Initiative Tracker. Try reloading the note!"
                            );
                        }
                    });
                    empty.detach();
                } catch (e) {
                    new Notice(
                        "Initiative Tracker: here was an issue parsing: \n\n" +
                            encounter
                    );
                }
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

        await this.saveSettings();
    }
    async saveMonster(monster: HomebrewCreature) {
        this.data.homebrew.push(monster);
        await this.saveSettings();
    }
    async deleteMonster(monster: HomebrewCreature) {
        this.data.homebrew = this.data.homebrew.filter((m) => m != monster);
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
