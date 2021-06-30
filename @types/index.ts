export interface InputValidate {
    input: HTMLInputElement;
    validate: (i: HTMLInputElement) => boolean;
}

export interface InitiativeTrackerData {
    players: HomebrewCreature[];
    homebrew: HomebrewCreature[];
    version: string;
    sync: boolean;
}

export interface SRDMonster {
    name: string;
    size: string;
    type: string;
    subtype: string;
    alignment: string;
    ac: number;
    hp: number;
    hit_dice?: string;
    speed: string;
    stats: [number, number, number, number, number, number];
    saves?: { [K in ability]?: number }[];
    skillsaves?: { [key: string]: number }[];
    damage_vulnerabilities: string;
    damage_resistances: string;
    damage_immunities: string;
    condition_immunities: string;
    senses: string;
    languages: string;
    cr: string | number;
    traits?: Trait[];
    spells?: Spell[];
    actions?: Trait[];
    legendary_actions?: Trait[];
    reactions?: Trait[];
    monster?: string;
    source?: string;
}

export interface HomebrewCreature {
    name?: string;
    hp?: number;
    ac?: number;
    stats?: number[];
    source?: string;
    cr?: number | string;
    modifier?: number;
    note?: string;
    player?: boolean;
}

export type ability =
    | "strength"
    | "dexterity"
    | "constitution"
    | "intelligence"
    | "wisdom"
    | "charisma";

export type Spell = string | { [key: string]: string };

export interface Trait {
    name: string;
    desc: string;
    [key: string]: any;
}
