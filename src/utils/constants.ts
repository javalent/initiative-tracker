import type { InitiativeTrackerData } from "@types";
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
    homebrew: [],
    statuses: [...Conditions],
    version: null,
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
        player: true
    },
    hpOverflow: "ignore",
    additiveTemp: false,
    logging: false,
    logFolder: "/",
    useLegacy: false,
    integrateSRD: true,
    diplayPlayerHPValues: true,
    rollHP: false
};

export const XP_PER_CR: Record<string, number> = {
    "0": 0,
    "1/8": 25,
    "1/4": 50,
    "1/2": 100,
    "1": 200,
    "2": 450,
    "3": 700,
    "4": 1100,
    "5": 1800,
    "6": 2300,
    "7": 2900,
    "8": 3900,
    "9": 5000,
    "10": 5900,
    "11": 7200,
    "12": 8400,
    "13": 10000,
    "14": 11500,
    "15": 13000,
    "16": 15000,
    "17": 18000,
    "18": 20000,
    "19": 22000,
    "20": 25000,
    "21": 33000,
    "22": 41000,
    "23": 50000,
    "24": 62000,
    "25": 75000,
    "26": 90000,
    "27": 105000,
    "28": 120000,
    "29": 135000,
    "30": 155000
};

export const OVERFLOW_TYPE: { [key: string]: string } = {
    ignore: "ignore",
    current: "current",
    temp: "temp"
};
