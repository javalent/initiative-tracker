export interface CreatureState extends HomebrewCreature {
    status: string[];
    enabled: boolean;
    currentMaxHP: number;
    currentHP: number;
    tempHP: number;
    currentAC: number | string;
    initiative: number;
    static: boolean;
    player: boolean;
    xp: number;
    active: boolean;
    hit_dice: string;
}
export interface SRDMonster {
    name: string;
    ac: number;
    hp: number;
    hit_dice?: string;
    cr: string | number;
    monster?: string;
    friendly?: boolean;
    hidden?: boolean;
    bestiary?: boolean;
    player?: boolean;

    [key: string]: any;
}
export interface HomebrewCreature {
    name?: string;
    display?: string;
    hp?: number;
    ac?: number | string;
    stats?: number[];
    source?: string | string[];
    cr?: number | string;
    modifier?: number | number[];
    note?: string;
    path?: string;
    level?: number;
    player?: boolean;
    marker?: string;
    id?: string;
    xp?: number;
    hidden?: boolean;
    friendly?: boolean;
    active?: boolean;
    static?: boolean;
    rollHP?: boolean;
    "statblock-link"?: string;
}
export type Condition = {
    name: string;
    description: string;
    id: string;
    resetOnRound?: boolean;
    hasAmount?: boolean;
    startingAmount?: number;
    amount?: number;
} & (
    | {
          hasAmount: true;
          startingAmount: number;
          amount: number;
      }
    | {}
);
