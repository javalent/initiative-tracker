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

/**
 * Describes a change to apply to a creature via the external API.
 *
 * HP semantics (external / sync context):
 *   - `hp`      — set current HP to this absolute value
 *   - `set_hp`  — alias for `hp` (explicit absolute set)
 *   - `temp`    — set / adjust temporary HP (positive: add, negative: subtract)
 *   - `max`     — adjust max HP by this delta (additive)
 *   - `set_max_hp` — set max HP to this absolute value
 *
 * Condition semantics:
 *   - `status`        — conditions to add; each entry may be a full Condition object
 *   - `remove_status` — conditions to remove (matched by `id`)
 */
export type CreatureUpdate = {
    hp?: number;
    ac?: number | string;
    current_ac?: number | string;
    initiative?: number;
    name?: string;
    marker?: string;
    temp?: number;
    /** Adjust max HP by this delta (additive). Prefer `set_max_hp` for absolute values. */
    max?: number;
    status?: Condition[];
    remove_status?: Condition[];
    hidden?: boolean;
    enabled?: boolean;
    /** Set current HP to this absolute value. */
    set_hp?: number;
    /** Set max HP to this absolute value. */
    set_max_hp?: number;
};
