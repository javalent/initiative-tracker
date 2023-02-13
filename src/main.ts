import {
    FrontMatterCache,
    Notice,
    parseYaml,
    Plugin,
    TFile,
    WorkspaceLeaf
} from "obsidian";

import {
    CREATURE_TRACKER_VIEW,
    DEFAULT_SETTINGS,
    INTIATIVE_TRACKER_VIEW,
    registerIcons
} from "./utils";

import { PLAYER_VIEW_VIEW } from "./utils/constants";

import type {
    EventsOnArgs,
    HomebrewCreature,
    InitiativeTrackerData,
    SRDMonster
} from "../@types/index";

import InitiativeTrackerSettings from "./settings";
import { EncounterBlock, EncounterParser } from "./encounter";
import EncounterLine from "./encounter/ui/EncounterLine.svelte";

import { Creature } from "./utils/creature";

import { BESTIARY } from "./utils/srd-bestiary";

import TrackerView, { CreatureView } from "./view";

import type { Plugins } from "../../obsidian-overload/index";
import PlayerView from "./player-view/player-view";
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
    playerCreatures: Map<string, Creature> = new Map();
    homebrewCreatures: Map<string, Creature> = new Map();
    watchers: Map<TFile, HomebrewCreature> = new Map();
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
            .getRollerSync(str, "statblock", true);
        return roller;
    }
    get canUseDiceRoller() {
        if (this.app.plugins.getPlugin("obsidian-dice-roller") != null) {
            if (
                !this.app.plugins.getPlugin("obsidian-dice-roller")
                    .getRollerSync
            ) {
                new Notice(
                    "Please update Dice Roller to the latest version to use with Initiative Tracker."
                );
            } else {
                return true;
            }
        }
        return false;
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
    get statblocks() {
        return this.app.plugins.getPlugin("obsidian-5e-statblocks");
    }
    get statblockVersion() {
        return this.statblocks?.settings?.version ?? { major: 0 };
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
                    .data?.values() ?? []
            )
        ] as SRDMonster[];
    }

    get homebrew() {
        return [...this.statblock_creatures, ...this.data.homebrew];
    }

    get bestiary() {
        return [...(this.data.integrateSRD ? BESTIARY : []), ...this.homebrew];
    }

    get view() {
        const leaves = this.app.workspace.getLeavesOfType(
            INTIATIVE_TRACKER_VIEW
        );
        const leaf = leaves?.length ? leaves[0] : null;
        if (leaf && leaf.view && leaf.view instanceof TrackerView)
            return leaf.view;
    }
    get combatant() {
        const leaves = this.app.workspace.getLeavesOfType(
            CREATURE_TRACKER_VIEW
        );
        const leaf = leaves?.length ? leaves[0] : null;
        if (leaf && leaf.view && leaf.view instanceof CreatureView)
            return leaf.view;
    }

    get defaultParty() {
        return this.data.parties.find((p) => p.name == this.data.defaultParty);
    }

    async onload() {
        registerIcons();

        await this.loadSettings();

        this.addSettingTab(new InitiativeTrackerSettings(this));

        this.registerView(
            INTIATIVE_TRACKER_VIEW,
            (leaf: WorkspaceLeaf) => new TrackerView(leaf, this)
        );
        this.registerView(
            PLAYER_VIEW_VIEW,
            (leaf: WorkspaceLeaf) => new PlayerView(leaf, this)
        );
        this.registerView(
            CREATURE_TRACKER_VIEW,
            (leaf: WorkspaceLeaf) => new CreatureView(leaf, this)
        );

        this.addCommands();

        this.registerMarkdownCodeBlockProcessor("encounter", (src, el, ctx) => {
            const handler = new EncounterBlock(this, src, el);
            ctx.addChild(handler);
        });
        this.registerMarkdownCodeBlockProcessor(
            "encounter-table",
            (src, el, ctx) => {
                const handler = new EncounterBlock(this, src, el, true);
                ctx.addChild(handler);
            }
        );

        this.registerMarkdownPostProcessor(async (el, ctx) => {
            if (!el || !el.firstElementChild) return;

            const codeEls = el.querySelectorAll<HTMLElement>("code");
            if (!codeEls || !codeEls.length) return;

            const codes = Array.from(codeEls).filter((code) =>
                /^encounter:\s/.test(code.innerText)
            );
            if (!codes.length) return;

            for (const code of codes) {
                const definitions = code.innerText
                    .replace(`encounter:`, "");

                const creatures = parseYaml('[' + definitions.trim() + ']');
                const parser = new EncounterParser(this);
                const parsed = await parser.parse({ creatures });

                if (!parsed || !parsed.creatures || !parsed.creatures.size)
                    continue;

                const target = createSpan("initiative-tracker-encounter-line");
                new EncounterLine({
                    target,
                    props: {
                        ...parsed,
                        plugin: this
                    }
                });

                code.replaceWith(target);
            }
        });

        this.playerCreatures = new Map(
            this.data.players.map((p) => [p.name, Creature.from(p)])
        );
        this.homebrewCreatures = new Map(
            this.bestiary.map((p) => [p.name, Creature.from(p)])
        );

        this.app.workspace.onLayoutReady(async () => {
            this.addTrackerView();
            //Update players from < 7.2
            for (const player of this.data.players) {
                if (player.path) continue;
                if (!player.note) continue;
                const file = await this.app.metadataCache.getFirstLinkpathDest(
                    player.note,
                    ""
                );
                if (
                    !file ||
                    !this.app.metadataCache.getFileCache(file)?.frontmatter
                ) {
                    new Notice(
                        `Initiative Tracker: There was an issue with the linked note for ${player.name}.\n\nPlease re-link it in settings.`
                    );
                    continue;
                }
            }
            this.registerEvent(
                this.app.metadataCache.on("changed", (file) => {
                    if (!(file instanceof TFile)) return;
                    const players = this.data.players.filter(
                        (p) => p.path == file.path
                    );
                    if (!players.length) return;
                    const frontmatter: FrontMatterCache =
                        this.app.metadataCache.getFileCache(file)?.frontmatter;
                    if (!frontmatter) return;
                    for (let player of players) {
                        const { ac, hp, modifier, level, name } = frontmatter;
                        player.ac = ac;
                        player.hp = hp;
                        player.modifier = modifier;
                        player.level = level;
                        player.name = name ? name : player.name;
                        this.setStatblockLink(
                            player,
                            frontmatter["statblock-link"]
                        );

                        this.playerCreatures.set(
                            player.name,
                            Creature.from(player)
                        );
                        if (this.view) {
                            const creature = this.view.ordered.find(
                                (c) => c.name == player.name
                            );
                            if (creature) {
                                this.view.updateCreature(creature, {
                                    max: player.hp,
                                    ac: player.ac
                                });
                            }
                        }
                    }
                })
            );
            this.registerEvent(
                this.app.vault.on("rename", (file, old) => {
                    if (!(file instanceof TFile)) return;
                    const players = this.data.players.filter(
                        (p) => p.path == old
                    );
                    if (!players.length) return;
                    for (const player of players) {
                        player.path = file.path;
                        player.note = file.basename;
                    }
                })
            );
            this.registerEvent(
                this.app.vault.on("delete", (file) => {
                    if (!(file instanceof TFile)) return;
                    const players = this.data.players.filter(
                        (p) => p.path == file.path
                    );
                    if (!players.length) return;
                    for (const player of players) {
                        player.path = null;
                        player.note = null;
                    }
                })
            );
        });

        console.log("Initiative Tracker v" + this.manifest.version + " loaded");
    }

    setStatblockLink(player: HomebrewCreature, newValue: string) {
        if (newValue) {
            player["statblock-link"] = newValue.startsWith("#")
                ? `[${player.name}](${player.path}${newValue})`
                : newValue;
        }
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
        this.app.workspace
            .getLeavesOfType(CREATURE_TRACKER_VIEW)
            .forEach((leaf) => leaf.detach());
        console.log("Initiative Tracker unloaded");
    }

    async addTrackerView() {
        if (
            this.app.workspace.getLeavesOfType(INTIATIVE_TRACKER_VIEW)?.length
        ) {
            return;
        }
        await this.app.workspace.getRightLeaf(false).setViewState({
            type: INTIATIVE_TRACKER_VIEW
        });
    }

    async saveMonsters(importedMonsters: HomebrewCreature[]) {
        this.data.homebrew.push(...importedMonsters);

        for (let monster of importedMonsters) {
            this.homebrewCreatures.set(monster.name, Creature.from(monster));
        }

        await this.saveSettings();
    }
    async saveMonster(monster: HomebrewCreature) {
        this.data.homebrew.push(monster);
        this.homebrewCreatures.set(monster.name, Creature.from(monster));
        await this.saveSettings();
    }
    async updatePlayer(existing: HomebrewCreature, player: HomebrewCreature) {
        if (!this.playerCreatures.has(existing.name)) {
            await this.savePlayer(player);
            return;
        }

        const creature = this.playerCreatures.get(existing.name);
        creature.update(player);

        this.data.players.splice(
            this.data.players.indexOf(existing),
            1,
            player
        );

        this.playerCreatures.set(player.name, creature);
        this.playerCreatures.delete(existing.name);

        const view = this.view;
        if (view) {
            view.updateState();
        }

        await this.saveSettings();
    }
    async updateMonster(existing: HomebrewCreature, monster: HomebrewCreature) {
        if (!this.homebrewCreatures.has(existing.name)) {
            await this.saveMonster(monster);
            return;
        }

        const creature = this.homebrewCreatures.get(existing.name);
        creature.update(monster);

        this.data.homebrew.splice(
            this.data.homebrew.indexOf(existing),
            1,
            monster
        );

        this.homebrewCreatures.set(monster.name, creature);
        this.homebrewCreatures.delete(existing.name);

        const view = this.view;
        if (view) {
            view.updateState();
        }

        await this.saveSettings();
    }
    async deleteMonster(monster: HomebrewCreature) {
        this.data.homebrew = this.data.homebrew.filter((m) => m != monster);
        this.homebrewCreatures.delete(monster.name);

        await this.saveSettings();
    }

    async savePlayer(player: HomebrewCreature) {
        this.data.players.push(player);
        this.playerCreatures.set(player.name, Creature.from(player));
        await this.saveSettings();
    }
    async savePlayers(...players: HomebrewCreature[]) {
        for (let monster of players) {
            this.data.players.push(monster);
            this.playerCreatures.set(monster.name, Creature.from(monster));
        }
        await this.saveSettings();
    }

    async deletePlayer(player: HomebrewCreature) {
        this.data.players = this.data.players.filter((p) => p != player);
        this.playerCreatures.delete(player.name);
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
