import "obsidian";
import type { Creature } from "./src/utils/creature";

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
    | [name: "initiative-tracker:closed"]
    | [name: "initiative-tracker:should-save"]
    | [name: "initiative-tracker:save-state", state?: InitiativeViewState]
    /** This event can be used to start an event by sending an object with a name, HP, AC, and initiative modifier at minimum. */
    | [
          name: "initiative-tracker:start-encounter",
          creatures: HomebrewCreature[]
      ]
    | [name: "initiative-tracker:stop-viewing", creatures: HomebrewCreature[]];

export type EventsOnArgs = OnArgs<TrackerEvents>;

export interface TrackerViewState {
    state: boolean;
    npcs: HomebrewCreature[];
    pcs: HomebrewCreature[];
    creatures: HomebrewCreature[];
}

export interface Condition {
    name: string;
    description: string;
}

export interface InputValidate {
    input: HTMLInputElement;
    validate: (i: HTMLInputElement) => boolean;
}

interface Party {
    players: string[];
    name: string;
}

export interface InitiativeTrackerData {
    beginnerTips: boolean;
    displayDifficulty: boolean;
    preferStatblockLink: boolean;
    statuses: Condition[];
    openState: {
        battle: boolean;
        party: boolean;
        status: boolean;
        plugin: boolean;
        player: boolean;
    };
    players: HomebrewCreature[];
    parties: Party[];
    defaultParty: string;
    homebrew: HomebrewCreature[];
    version: string;
    canUseDiceRoll: boolean;
    initiative: string;
    modifier: string;
    sync: boolean;
    leafletIntegration: boolean;
    playerMarker: string;
    monsterMarker: string;
    state: InitiativeViewState;
    encounters: { [key: string]: InitiativeViewState };
    condense: boolean;
    clamp: boolean;
    hpOverflow: string;
    additiveTemp: boolean;
    autoStatus: boolean;
    warnedAboutImports: boolean;
    logging: boolean;
    logFolder: string;
    useLegacy: boolean;
    integrateSRD: boolean;
    diplayPlayerHPValues: boolean;
    rollHP: boolean;
}

export interface InitiativeViewState {
    creatures: CreatureState[];
    state: boolean;
    name: string;
    round: number;
    logFile: string;
    roll?: boolean;
    rollHP?: boolean;
}

export interface CreatureState extends HomebrewCreature {
    status: string[];
    enabled: boolean;
    currentHP: number;
    tempHP: number;
    initiative: number;
    player: boolean;
    xp: number;
    active: boolean;
    hit_dice: string;
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
    source?: string | string[];
}

export interface HomebrewCreature {
    name?: string;
    display?: string;
    hp?: number;
    ac?: number | string;
    stats?: number[];
    source?: string | string[];
    cr?: number | string;
    modifier?: number;
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
    "statblock-link"?: string;
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

export interface UpdateLogMessage {
    name: string;
    hp: number | null;
    temp: boolean;
    status: string | null;
    saved: boolean;
    unc: boolean;
}

export interface BuilderPartyPlayer {
    level: number;
    enabled: boolean;
    name: string;
}
export interface BuilderGenericPlayer {
    level: number;
    enabled: boolean;
    amount: number;
}

export type BuilderPlayer = BuilderPartyPlayer | BuilderGenericPlayer;

export interface ExperienceThreshold {
    Easy: number;
    Medium: number;
    Hard: number;
    Deadly: number;
    Daily: number;
}
