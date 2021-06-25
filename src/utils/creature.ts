export class Creature {
    name: string;
    initiative: number;
    modifier: number;
    hp: number;
    ac: number;
    note: string;
    constructor({
        name,
        initiative,
        modifier,
        hp,
        ac,
        note
    }: {
        name?: string;
        initiative?: number;
        modifier?: number;
        hp?: number;
        ac?: number;
        note?: string;
    }) {
        this.name = name;
        this.initiative = initiative ?? Math.floor(Math.random() * 19 + 1);
        this.modifier = modifier;
        this.hp = hp;
        this.ac = ac;
        this.note = note;
    }
    /*     get initiative() {
        return this._initiative ?? Math.floor(Math.random() * 19 + 1);
    }
    set initiative(x) {
        this._initiative = x;
    } */
    *[Symbol.iterator]() {
        yield this.name;
        yield this.initiative;
        yield this.modifier;
        yield this.hp;
        yield this.ac;
        yield this.note;
    }
}
