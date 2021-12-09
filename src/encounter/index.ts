import { MarkdownPostProcessorContext, Notice, parseYaml } from "obsidian";
import type InitiativeTracker from "../main";
import { Creature } from "../utils/creature";

import EncounterUI from "./ui/Encounter.svelte";

type RawCreatureArray = string | Array<string | { [key: number]: string }>;
type RawCreature = string | { [key: number]: string };
type RawPlayers = boolean | "none" | string[];
interface EncounterParameters {
    name?: string;
    players?: RawPlayers;
    creatures?: RawCreatureArray;
    xp: number;
}
interface CreatureStats {
    name: string;
    ac: number;
    hp: number;
    modifier: number;
    xp: number;
}

export const equivalent = (
    creature: CreatureStats,
    existing: CreatureStats
) => {
    return (
        creature.name == existing.name &&
        creature.ac == existing.ac &&
        creature.hp == existing.hp &&
        creature.modifier == existing.modifier &&
        creature.xp == existing.xp
    );
};

export class Encounter {
    constructor(public plugin: InitiativeTracker) {}
    async postprocess(
        src: string,
        el: HTMLElement,
        ctx: MarkdownPostProcessorContext
    ) {
        const encounters = src.split("---") ?? [];
        const containerEl = el.createDiv("encounter-container");
        const empty = containerEl.createSpan({
            text: "No encounters created. Please check your syntax and try again."
        });

        for (let encounter of encounters) {
            if (!encounter?.trim().length) continue;
            try {
                const params: EncounterParameters = parseYaml(encounter);

                const name = params.name;
                const players: string[] = this.parsePlayers(params);
                const rawMonsters = params.creatures ?? [];

                let creatures = await this.parseRawCreatures(rawMonsters);

                const encounterEl = containerEl.createDiv("encounter");

                const xp = params.xp ?? null;
                const playerLevels = this.plugin.data.players
                    .map((p) => p.level)
                    .filter((p) => p);

                const instance = new EncounterUI({
                    target: encounterEl,
                    props: {
                        plugin: this.plugin,
                        name,
                        players,
                        playerLevels,
                        creatures,
                        xp
                    }
                });

                instance.$on("begin-encounter", async () => {
                    if (!this.plugin.view) {
                        await this.plugin.addTrackerView();
                    }
                    if (this.plugin.view) {
                        this.plugin.view?.newEncounter({
                            ...params,
                            players,
                            creatures: [],
                            xp
                        });
                        this.plugin.app.workspace.revealLeaf(
                            this.plugin.view.leaf
                        );
                    } else {
                        new Notice(
                            "Could not find the Initiative Tracker. Try reloading the note!"
                        );
                    }
                });
                empty.detach();
            } catch (e) {
                console.error(e);
                new Notice(
                    "Initiative Tracker: here was an issue parsing: \n\n" +
                        encounter
                );
            }
        }
    }

    buildEncounter() {}
    parsePlayers(params: EncounterParameters) {
        if (params.players == "none" || params.players == false) {
            params.players = [];
        } else if (!("players" in params) || params.players == true) {
            params.players = [...this.plugin.data.players.map((p) => p.name)];
        }
        return [
            ...params.players
                .map(
                    (p) =>
                        this.plugin.data.players.find(
                            (d) => d.name.toLowerCase() == p
                        )?.name
                )
                .filter((p) => p)
        ];
    }
    async parseRawCreatures(rawMonsters: RawCreatureArray) {
        const creatureMap: Array<[Creature, number | string]> = [];
        if (rawMonsters && Array.isArray(rawMonsters)) {
            for (const raw of rawMonsters) {
                const { creature, number } =
                    (await this.parseRawCreature(raw)) ?? {};

                const stats = {
                    name: creature.name,
                    ac: creature.ac,
                    hp: creature.hp,
                    modifier: creature.modifier,
                    xp: creature.xp
                };
                const existing = creatureMap.find(([c]) =>
                    equivalent(c, stats)
                );
                if (!existing) {
                    creatureMap.push([creature, number]);
                } else {
                    let amount;
                    if (!isNaN(Number(number)) && !isNaN(Number(existing[1]))) {
                        amount =
                            (Number(number) as number) +
                            (existing[1] as number);
                    } else {
                        amount = `${number} + ${existing[1]}`;
                    }

                    creatureMap.splice(creatureMap.indexOf(existing), 1, [
                        existing[0],
                        amount
                    ]);
                }
            }
        }
        return creatureMap;
    }
    async parseRawCreature(raw: RawCreature) {
        let monster: string,
            number = 1;
        if (typeof raw == "string") {
            const match = raw.match(/(\d+)?:?\s?(.+)/);
            number = isNaN(Number(match[1] ?? null))
                ? number
                : Number(match[1]);
            monster = match[2];
        } else if (typeof raw == "object") {
            let entries = Object.entries(raw).flat();
            number = entries[0];
            monster = entries[1];
        }

        if (!monster) return {};

        if (
            typeof number == "string" &&
            !this.plugin.canUseDiceRoller &&
            /\d+d\d+/.test(number)
        ) {
            number = 1;
        }
        if (!isNaN(Number(number))) number = Number(number);
        if (!number || (typeof number == "number" && number < 1)) number = 1;

        let name = monster.split(/,\s?/)[0];
        let [hp, ac, mod, xp] = monster
            .split(/,\s?/)
            .slice(1)
            .map((v) => (isNaN(Number(v)) ? null : Number(v)));
        if (!name) return {};

        let existing = this.plugin.bestiary.find((c) => c.name == name);
        let creature = existing
            ? Creature.from(existing)
            : new Creature({ name });

        creature.hp = hp ?? creature.hp;
        creature.ac = ac ?? creature.ac;
        creature.modifier = mod ?? creature.modifier;
        creature.xp = xp ?? creature.xp;

        let stats = {
            name: creature.name,
            hp: creature.hp,
            ac: creature.ac,
            modifier: creature.modifier,
            xp: creature.xp
        };

        return { creature, number };
        /* return [...Array(number).keys()].map((k) => Creature.from(creature)); */
    }
}
