import {
    FrontMatterCache,
    Notice,
    parseYaml,
    Plugin,
    TFile,
    WorkspaceLeaf
} from "obsidian";

import {
    BUILDER_VIEW,
    Conditions,
    CREATURE_TRACKER_VIEW,
    DEFAULT_SETTINGS,
    INITIATIVE_TRACKER_VIEW,
    registerIcons
} from "./utils";

import { PLAYER_VIEW_VIEW } from "./utils/constants";
import type {
    EventsOnArgs,
    HomebrewCreature,
    InitiativeTrackerData,
    InitiativeViewState,
    SRDMonster
} from "../index";
import type { Plugins, StackRoller } from "obsidian-overload";
import InitiativeTrackerSettings from "./settings/settings";
import { EncounterBlock, EncounterParser } from "./encounter";
import EncounterLine from "./encounter/ui/EncounterLine.svelte";
import { Creature, getId } from "./utils/creature";
import TrackerView, { CreatureView } from "./tracker/view";
import BuilderView from "./builder/view";
import PlayerView from "./tracker/player-view";
import { tracker } from "./tracker/stores/tracker";
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
    public tracker = tracker;
    playerCreatures: Map<string, Creature> = new Map();
    watchers: Map<TFile, HomebrewCreature> = new Map();
    getRoller(str: string) {
        if (!this.canUseDiceRoller) return;
        const roller = this.app.plugins
            .getPlugin("obsidian-dice-roller")
            .getRollerSync(str, "statblock");
        return roller as StackRoller;
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

    getInitiativeValue(modifier: number | number[] = 0): number {
        const defaultIfNoResult =
            Math.floor(Math.random() * 19 + 1) +
            [modifier].flat().reduce((a, b) => a + b, 0);
        if (!this.canUseDiceRoller) {
            return defaultIfNoResult;
        }
        let dice = this.data.initiative;
        if (typeof modifier == "number") {
            dice = dice.replace(/%mod\d?%/g, `${modifier}`);
        } else {
            for (let i = 0; i < modifier.length; i++) {
                dice = dice.replace(`%mod${i + 1}%`, `${modifier[i]}`);
            }
        }
        const roller = this.getRoller(dice);
        const initiative = roller.rollSync();
        if (isNaN(initiative)) return defaultIfNoResult;
        return initiative;
    }

    getPlayerByName(name: string) {
        if (!this.players.has(name)) return new Creature({ name });
        return Creature.from(this.players.get(name));
    }
    getPlayersForParty(party: string) {
        return (
            this.data.parties
                ?.find((p) => p.name == party)
                ?.players.map((p) => this.getPlayerByName(p))
                ?.filter((p) => p) ?? []
        );
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
        if (!this.app.plugins.getPlugin("obsidian-5e-statblocks")) return [];
        return [
            ...Array.from(
                this.app.plugins
                    .getPlugin("obsidian-5e-statblocks")
                    .bestiary?.values() ?? []
            )
        ] as SRDMonster[];
    }
    get bestiary() {
        return this.statblock_creatures.filter((p) => !p.player);
    }
    get view() {
        const leaves = this.app.workspace.getLeavesOfType(
            INITIATIVE_TRACKER_VIEW
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

    getBaseCreatureFromBestiary(name: string) {
        /** Check statblocks */
        try {
            if (this.canUseStatBlocks && this.statblocks.hasCreature(name)) {
                return this.statblocks.getCreatureFromBestiary(name);
            }
        } catch (e) {}
        return null;
    }
    getCreatureFromBestiary(name: string) {
        let creature = this.getBaseCreatureFromBestiary(name);
        if (creature) return Creature.from(creature);
    }
    get statblock_players() {
        return this.statblock_creatures
            .filter((p) => p.player)
            .map((p) => [p.name, Creature.from(p)] as [string, Creature]);
    }
    get players() {
        return new Map([
            ...this.playerCreatures.entries(),
            ...this.statblock_players
        ]);
    }

    async onload() {
        registerIcons();

        await this.loadSettings();

        this.setBuilderIcon();

        this.addSettingTab(new InitiativeTrackerSettings(this));

        this.registerView(
            INITIATIVE_TRACKER_VIEW,
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
        this.registerView(
            BUILDER_VIEW,
            (leaf: WorkspaceLeaf) => new BuilderView(leaf, this)
        );

        this.addCommands();
        this.addEvents();

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
                const definitions = code.innerText.replace(`encounter:`, "");

                const creatures = parseYaml("[" + definitions.trim() + "]");
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
                        player["statblock-link"] =
                            frontmatter["statblock-link"];

                        this.playerCreatures.set(
                            player.name,
                            Creature.from(player)
                        );
                        if (this.view) {
                            const creature = tracker
                                .getOrderedCreatures()
                                .find((c) => c.name == player.name);
                            if (creature) {
                                tracker.updateCreatures({
                                    creature,
                                    change: {
                                        max: player.hp,
                                        ac: player.ac
                                    }
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
            id: "open-builder",
            name: "Open Encounter Builder",
            checkCallback: (checking) => {
                if (!this.builder) {
                    if (!checking) {
                        this.addBuilderView();
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
                        tracker.toggleState();
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
                if (view && tracker.getState()) {
                    if (!checking) {
                        tracker.goToNext();
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
                if (view && tracker.getState()) {
                    if (!checking) {
                        tracker.goToPrevious();
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
            app.workspace.on(
                "initiative-tracker:save-state",
                async (state: InitiativeViewState) => {
                    this.data.state = state;
                    await this.saveSettings();
                }
            )
        );
        this.registerEvent(
            this.app.workspace.on(
                "initiative-tracker:start-encounter",
                async (homebrews: HomebrewCreature[]) => {
                    try {
                        const creatures = homebrews.map((h) =>
                            Creature.from(h).toJSON()
                        );

                        const view = this.view;
                        if (!view) {
                            await this.addTrackerView();
                        }
                        if (view) {
                            tracker?.new(this, {
                                creatures,
                                state: false,
                                name: null,
                                round: 1,
                                logFile: null,
                                roll: true
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
            .getLeavesOfType(INITIATIVE_TRACKER_VIEW)
            .forEach((leaf) => leaf.detach());
        this.app.workspace
            .getLeavesOfType(CREATURE_TRACKER_VIEW)
            .forEach((leaf) => leaf.detach());
        console.log("Initiative Tracker unloaded");
    }

    async addTrackerView() {
        if (
            this.app.workspace.getLeavesOfType(INITIATIVE_TRACKER_VIEW)?.length
        ) {
            return;
        }
        await this.app.workspace.getRightLeaf(false).setViewState({
            type: INITIATIVE_TRACKER_VIEW
        });
    }
    get builder() {
        const leaves = this.app.workspace.getLeavesOfType(BUILDER_VIEW);
        const leaf = leaves.length ? leaves[0] : null;
        if (leaf && leaf.view && leaf.view instanceof BuilderView)
            return leaf.view;
    }
    async addBuilderView() {
        if (this.app.workspace.getLeavesOfType(BUILDER_VIEW)?.length) {
            return;
        }
        await this.app.workspace.getLeaf(true).setViewState({
            type: BUILDER_VIEW
        });
        this.app.workspace.revealLeaf(this.builder.leaf);
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

        this.playerCreatures.delete(existing.name);
        this.playerCreatures.set(player.name, creature);

        const view = this.view;
        if (view) {
            tracker.updateState();
        }

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
        if (this.data.statuses?.some((c) => !c.id)) {
            for (const condition of this.data.statuses) {
                condition.id =
                    condition.id ??
                    Conditions.find((c) => c.name == condition.name)?.id ??
                    getId();
            }
            await this.saveSettings();
        }

        this.data.version = this.manifest.version
            .split(".")
            .map((n) => Number(n));
    }

    async saveSettings() {
        await this.saveData(this.data);
        tracker.setData(this.data);
    }
    async openCombatant(creature: Creature) {
        if (!this.canUseStatBlocks) return;
        const view = this.combatant;
        if (!view) {
            const leaf = this.app.workspace.getRightLeaf(true);
            await leaf.setViewState({
                type: CREATURE_TRACKER_VIEW
            });
        }

        await this.combatant.render(creature);
        this.app.workspace.revealLeaf(this.combatant.leaf);
    }
    private _builderIcon: HTMLElement;
    setBuilderIcon() {
        if (this.data.builder.sidebarIcon) {
            this._builderIcon = this.addRibbonIcon(
                BUILDER_VIEW,
                "Initiative Tracker Encounter Builder",
                () => {
                    this.addBuilderView();
                }
            );
        } else {
            this._builderIcon.detach();
        }
    }
}
