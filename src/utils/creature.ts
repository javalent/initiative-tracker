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
    source: string;
    constructor({
        name,
        initiative,
        modifier,
        hp,
        ac,
        note,
        player,
        source
    }: {
        name?: string;
        initiative?: number;
        modifier?: number;
        hp?: number;
        ac?: number;
        note?: string;
        player?: boolean;
        source?: string;
    }) {
        this.name = name;
        this._initiative = Number(initiative ?? 0);
        this.modifier = Number(modifier ?? 0);

        this.max = hp ? Number(hp) : undefined;
        this.ac = ac ? Number(ac) : undefined;
        this.note = note;
        this.player = player;

        this.hp = this.max;
        this.source = source;
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
