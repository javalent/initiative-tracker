import type { Condition, HomebrewCreature, SRDMonster } from "@types";
import { DEFAULT_UNDEFINED } from "./constants";

export class Creature {
    name: string;
    modifier: number;
    hp: number;
    ac: number;
    note: string;
    enabled: boolean = true;
    max: number;
    player: boolean;
    status: Set<Condition> = new Set();
    marker: string;
    private _initiative: number;
    source: string;
    constructor(creature: HomebrewCreature, initiative: number = 0) {
        this.name = creature.name;
        this._initiative = Number(initiative ?? 0);
        this.modifier = Number(creature.modifier ?? 0);

        this.max = creature.hp ? Number(creature.hp) : undefined;
        this.ac = creature.ac ? Number(creature.ac) : undefined;
        this.note = creature.note;
        this.player = creature.player;

        this.marker = creature.marker ?? "default";

        this.hp = this.max;
        this.source = creature.source;
    }
    get hpDisplay() {
        if (this.max) {
            return `${this.hp}/${this.max}`;
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
    }

    static from(creature: Creature | SRDMonster) {
        if (creature instanceof Creature) {
            delete creature.initiative;
            return new Creature({ ...creature });
        }

        return new Creature(
            {
                ...creature,
                modifier: Math.floor(((creature.stats[1] ?? 10) - 10) / 2)
            },
            0
        );
    }
}
