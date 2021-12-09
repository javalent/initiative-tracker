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

                let creatures: Creature[] = [];

                if (rawMonsters && Array.isArray(rawMonsters)) {
                    for (const raw of rawMonsters) {
                        creatures.push(...(await this.parseRawCreature(raw)));
                    }
                }
                const encounterEl = containerEl.createDiv("encounter");

                const xp = params.xp ?? null;
                const playerLevels = this.plugin.data.players
                    .map((p) => p.level)
                    .filter((p) => p);

                const instance = new EncounterUI({
                    target: encounterEl,
                    props: {
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
                            creatures: creatures,
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

        if (!monster) return [];

        if (
            typeof number == "string" &&
            this.plugin.canUseDiceRoller &&
            /\d+d\d+/.test(number)
        ) {
            number = (await this.plugin.parseDice(number)).result ?? number;
        }
        if (typeof number == "string") number = Number(number);
        if (!number || typeof number != "number" || number < 1) number = 1;

        let name = monster.split(/,\s?/)[0];
        let [hp, ac, mod, xp] = monster
            .split(/,\s?/)
            .slice(1)
            .map((v) => (isNaN(Number(v)) ? null : Number(v)));
        if (!name) return [];

        let existing = this.plugin.bestiary.find((c) => c.name == name);
        let creature = existing
            ? Creature.from(existing)
            : new Creature({ name });

        creature.hp = hp ?? creature.hp;
        creature.ac = ac ?? creature.ac;
        creature.modifier = mod ?? creature.modifier;
        creature.xp = xp ?? creature.xp;
        return [...Array(number).keys()].map((k) => Creature.from(creature));
    }
}
