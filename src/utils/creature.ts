import type {
    Condition,
    CreatureState,
    HomebrewCreature,
    SRDMonster
} from "@types";
import type InitiativeTracker from "src/main";
import { Conditions, XP_PER_CR } from ".";
import { DEFAULT_UNDEFINED } from "./constants";

export function getId() {
    return "ID_xyxyxyxyxyxy".replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0,
            v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export class Creature {
    active: boolean;
    name: string;
    modifier: number;
    hp: number;
    temp: number;
    ac: number;
    note: string;
    enabled: boolean = true;
    hidden: boolean = false;
    max: number;
    level: number;
    player: boolean;
    status: Set<Condition> = new Set();
    marker: string;
    private _initiative: number;
    source: string;
    id: string;
    xp: number;
    viewing: boolean = false;
    number = 0;
    display: string;
    "statblock-link": string;
    constructor(public creature: HomebrewCreature, initiative: number = 0) {
        this.name = creature.name;
        this.display = creature.display;
        this._initiative =
            "initiative" in creature
                ? (creature as Creature).initiative
                : Number(initiative ?? 0);
        this.modifier = Number(creature.modifier ?? 0);

        this.max = creature.hp ? Number(creature.hp) : undefined;
        this.ac = creature.ac ? Number(creature.ac) : undefined;
        this.note = creature.note;
        this.level = creature.level;
        this.player = creature.player;

        this.marker = creature.marker;

        this.hp = this.max;
        this.temp = 0;
        this.source = creature.source;

        if ("xp" in creature) {
            this.xp = creature.xp;
        } else if ("cr" in creature) {
            this.xp = XP_PER_CR[`${creature.cr}`];
        }
        this.id = creature.id ?? getId();
        if ("statblock-link" in creature) {
            this["statblock-link"] = (creature as any)[
                "statblock-link"
            ] as string;
        }
    }
    get hpDisplay() {
        if (this.max) {
            const tempMods =
                this.temp > 0
                    ? `aria-label="Temp HP: ${this.temp}" style="font-weight:bold"`
                    : "";
            return `
                <span ${tempMods}>${this.hp + this.temp}</span><span>/${
                this.max
            }</span>
            `;
        }
        return DEFAULT_UNDEFINED;
    }

    get initiative() {
        return this._initiative + this.modifier;
    }
    set initiative(x: number) {
        this._initiative = Number(x) - this.modifier;
    }

    *[Symbol.iterator]() {
        yield this.name;
        yield this.initiative;
        yield this.modifier;
        yield this.max;
        yield this.ac;
        yield this.note;
        yield this.id;
        yield this.marker;
        yield this.xp;
    }

    static new(creature: Creature) {
        return new Creature(
            {
                ...creature,
                id: getId()
            },
            creature._initiative
        );
    }

    static from(creature: HomebrewCreature | SRDMonster) {
        const modifier =
            "modifier" in creature
                ? creature.modifier
                : Math.floor(
                      (("stats" in creature && creature.stats.length > 1
                          ? creature.stats[1]
                          : 10) -
                          10) /
                          2
                  );
        return new Creature({
            ...creature,
            modifier: modifier
        });
    }

    update(creature: HomebrewCreature) {
        this.name = creature.name;
        this.modifier = Number(creature.modifier ?? 0);

        this.max = creature.hp ? Number(creature.hp) : undefined;

        if (this.hp > this.max) this.hp = this.max;

        this.ac = creature.ac ? Number(creature.ac) : undefined;
        this.note = creature.note;
        this.level = creature.level;
        this.player = creature.player;

        this.marker = creature.marker;
        this.source = creature.source;
    }

    toProperties() {
        return { ...this };
    }

    toJSON(): CreatureState {
        return {
            name: this.name,
            initiative: this.initiative - this.modifier,
            modifier: this.modifier,
            hp: this.max,
            ac: this.ac,
            note: this.note,
            id: this.id,
            marker: this.marker,
            currentHP: this.hp,
            tempHP: this.temp,
            status: Array.from(this.status).map((c) => c.name),
            enabled: this.enabled,
            level: this.level,
            player: this.player,
            xp: this.xp,
            active: this.active,
            hidden: this.hidden,
            "statblock-link": this["statblock-link"]
        };
    }

    static fromJSON(state: CreatureState) {
        const creature = new Creature(state, state.initiative);
        creature.enabled = state.enabled;

        creature.temp = state.tempHP ? state.tempHP : 0;
        creature.hp = state.currentHP;
        let statuses: Condition[] = [];
        for (const status of state.status) {
            const existing = Conditions.find(({ name }) => status == name);
            if (existing) {
                statuses.push(existing);
            } else {
                statuses.push({
                    name: status,
                    description: null
                });
            }
        }
        creature.status = new Set(statuses);
        creature.active = state.active;
        return creature;
    }
}
