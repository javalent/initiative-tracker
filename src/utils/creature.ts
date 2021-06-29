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
    status: Set<string> = new Set();
    private _initiative: number;
    constructor({
        name,
        initiative,
        modifier,
        hp,
        ac,
        note,
        player
    }: {
        name?: string;
        initiative?: number;
        modifier?: number;
        hp?: number;
        ac?: number;
        note?: string;
        player?: boolean;
    }) {
        this.name = name;
        this._initiative = Number(
            initiative ?? Math.floor(Math.random() * 19 + 1)
        );
        this.modifier = modifier ?? 0;

        this.max = hp;
        this.hp = this.max;
        this.ac = ac;
        this.note = note;

        this.player = player;
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
}
