import "obsidian";
import type { API } from "src/api/api";
import type { Filter, FilterLayout } from "src/builder/stores/filter/filter";

export interface TrackerViewState {
    state: boolean;
    npcs: HomebrewCreature[];
    pcs: HomebrewCreature[];
    creatures: HomebrewCreature[];
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

export interface InputValidate {
    input: HTMLInputElement;
    validate: (i: HTMLInputElement) => boolean;
}

export interface Party {
    players: string[];
    name: string;
}

export interface InitiativeTrackerData {
    beginnerTips: boolean;
    displayDifficulty: boolean;
    preferStatblockLink: boolean;
    statuses: Condition[];
    unconsciousId: string;
    openState: {
        battle: boolean;
        party: boolean;
        status: boolean;
        plugin: boolean;
        player: boolean;
        builder: boolean;
    };
    players: HomebrewCreature[];
    parties: Party[];
    defaultParty: string;

    rpgSystem: string;
    canUseDiceRoll: boolean;
    initiative: string;
    modifier: string;
    sync: boolean;
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
    diplayPlayerHPValues: boolean;
    rollHP: boolean;
    builder: BuilderState;
    descending: boolean;
    version: number[];

    rollPlayerInitiatives: RollPlayerInitiativeBehavior;
}

export interface BuilderState {
    sidebarIcon: boolean;
    showXP: boolean;
    showParty: boolean;
    headers?: TableHeaderState[];
    filters?: {
        layout: FilterLayout;
        filters: Filter[];
    };
}

export interface InitiativeViewState {
    creatures: CreatureState[];
    state: boolean;
    name: string;
    round: number;
    logFile: string;
    roll?: boolean;
    rollHP?: boolean;
    timestamp?: number;
}

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

export interface UpdateLogMessage {
    name: string;
    hp: number | null;
    temp: boolean;
    status: string[] | null;
    max: boolean;
    saved: boolean;
    unc: boolean;
    ac: string;
    ac_add: boolean;
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

import type { RollPlayerInitiativeBehavior } from "src/utils";
export declare function getId(): string;
export declare class Creature {
    creature: HomebrewCreature;
    active: boolean;
    name: string;
    modifier: number;
    hp: number;
    hit_dice?: string;
    temp: number;
    ac: number | string;
    note: string;
    enabled: boolean;
    hidden: boolean;
    max: number;
    level: number;
    player: boolean;
    status: Set<Condition>;
    marker: string;
    source: string | string[];
    id: string;
    xp: number;
    viewing: boolean;
    number: number;
    display: string;
    friendly: boolean;
    "statblock-link": string;
    constructor(creature: HomebrewCreature, initiative?: number);
    get hpDisplay(): string;
    get initiative(): number;
    set initiative(x: number);
    getName(): string;
    getStatblockLink(): string;
    [Symbol.iterator](): Generator<string | number | boolean, void, unknown>;
    static new(creature: Creature): Creature;
    static from(creature: HomebrewCreature | SRDMonster): Creature;
    update(creature: HomebrewCreature): void;
    toProperties(): this;
    toJSON(): CreatureState;
    static fromJSON(state: CreatureState): Creature;
}

//Builder
export enum SortFunctions {
    LOCAL_COMPARE,
    CONVERT_FRACTION,
    CUSTOM
}
export type TableHeaderState = {
    text: string;
    field: string;
    type: SortFunctions;
    func?: string;
};

declare global {
    interface Window {
        InitiativeTracker?: API;
    }
}
