import type { InitiativeTrackerData } from "index";
import { Platform } from "obsidian";
import { Conditions } from "./conditions";

export const INTIATIVE_TRACKER_VIEW = "initiative-tracker-view";
export const PLAYER_VIEW_VIEW = "initiative-tracker-player-view";
export const CREATURE_TRACKER_VIEW = "initiative-tracker-creature-view";

export const MIN_WIDTH_FOR_HAMBURGER = 300;

export const DEFAULT_UNDEFINED = "–";

export const META_MODIFIER = Platform.isMacOS ? "Meta" : "Control";

export const DEFAULT_SETTINGS: InitiativeTrackerData = {
    players: [],
    parties: [],
    defaultParty: null,
    statuses: [...Conditions],
    unconsciousId: "Unconscious",
    version: [],
    canUseDiceRoll: false,
    preferStatblockLink: false,
    initiative: "1d20 + %mod%",
    modifier: null,
    sync: false,
    leafletIntegration: false,
    playerMarker: "default",
    monsterMarker: "default",
    state: {
        creatures: [],
        state: false,
        name: null,
        round: null,
        logFile: null
    },
    condense: false,
    clamp: true,
    autoStatus: true,
    beginnerTips: true,
    displayDifficulty: true,
    encounters: {},
    warnedAboutImports: false,
    openState: {
        battle: true,
        party: true,
        status: true,
        plugin: true,
        player: true,
        builder: true
    },
    hpOverflow: "ignore",
    additiveTemp: false,
    rpgSystem: "dnd5e",
    logging: false,
    logFolder: "/",
    useLegacy: false,
    diplayPlayerHPValues: true,
    rollHP: false,
    builder: {
        showParty: true,
        showXP: true,
        sidebarIcon: true
    }
};


export const OVERFLOW_TYPE: { [key: string]: string } = {
    ignore: "ignore",
    current: "current",
    temp: "temp"
};

export const DECIMAL_TO_VULGAR_FRACTION: Record<string, string> = {
    0.125: "⅛",
    0.25: "¼",
    0.375: "⅜",
    0.5: "½",
    0.625: "⅝",
    0.75: "¾",
    0.875: "⅞",
} as const;