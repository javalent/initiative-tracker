import "obsidian";
import type Creature__SvelteComponent_ from "src/svelte/Creature.svelte";
import type { Creature } from "src/utils/creature";

//      CUSTOM EVENTS
// ------------------------
// Convert tuple to arguments of Event.on
type OnArgs<T> = T extends [infer A, ...infer B]
    ? A extends string
        ? [name: A, callback: (...args: B) => any]
        : never
    : never;
export type TrackerEvents =
    | [name: "initiative-tracker:state-change", state: TrackerViewState]
    | [name: "initiative-tracker:players-updated", pcs: Creature[]]
    | [name: "initiative-tracker:creatures-added", npcs: Creature[]]
    | [
          name: "initiative-tracker:creature-added-at-location",
          creature: Creature,
          latlng: L.LatLng
      ]
    | [name: "initiative-tracker:add-creature-here", latlng: L.LatLng]
    | [name: "initiative-tracker:creature-updated", creature: Creature]
    | [
          name: "initiative-tracker:creature-updated-in-settings",
          creature: Creature
      ]
    | [name: "initiative-tracker:creatures-removed", npcs: Creature[]]
    | [name: "initiative-tracker:new-encounter", state: TrackerViewState]
    | [name: "initiative-tracker:reset-encounter", state: TrackerViewState]
    | [name: "initiative-tracker:active-change", creature: Creature]
    | [name: "initiative-tracker:unload"]
    | [name: "initiative-tracker:apply-damage", creature: Creature]
    | [name: "initiative-tracker:add-status", creature: Creature]
    | [
          name: "initiative-tracker:enable-disable",
          creature: Creature,
          enable: boolean
      ]
    | [name: "initiative-tracker:remove", creature: Creature]
    | [name: "initiative-tracker:closed"];

export type EventsOnArgs = OnArgs<TrackerEvents>;

export interface TrackerViewState {
    state: boolean;
    current: number;
    npcs: Creature[];
    pcs: Creature[];
    creatures: Creature[];
}

export interface Condition {
    name: string;
    description: string[];
}

export interface InputValidate {
    input: HTMLInputElement;
    validate: (i: HTMLInputElement) => boolean;
}

export interface InitiativeTrackerData {
    players: HomebrewCreature[];
    homebrew: HomebrewCreature[];
    version: string;
    canUseDiceRoll: boolean;
    initiative: string;
    sync: boolean;
    leafletIntegration: boolean;
    playerMarker: string;
    monsterMarker: string;
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
    marker?: string;
    id?: string;
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
