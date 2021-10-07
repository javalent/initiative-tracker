import type { InitiativeTrackerData } from "@types";

export const INTIATIVE_TRACKER_VIEW = "initiative-tracker-view";

export const MIN_WIDTH_FOR_HAMBURGER = 300;

export const DEFAULT_UNDEFINED = "–";

export const DEFAULT_SETTINGS: InitiativeTrackerData = {
    players: [],
    homebrew: [],
    version: null,
    canUseDiceRoll: false,
    initiative: "1d20 + %mod%",
    sync: false,
    leafletIntegration: false,
    playerMarker: "default",
    monsterMarker: "default",
    state: {
        creatures: [],
        state: false,
        current: null,
        name: null
    }
};

export const XP_PER_CR: Record<string, number> = {
    "1/8": 50,
    "1/6": 65,
    "1/4": 100,
    "1/3": 135,
    "1/2": 200,
    "1": 400,
    "2": 600,
    "3": 800,
    "4": 1200,
    "5": 1600,
    "6": 2400,
    "7": 3200,
    "8": 4800,
    "9": 6400,
    "10": 9600,
    "11": 12800,
    "12": 19200,
    "13": 25600,
    "14": 38400,
    "15": 51200,
    "16": 76800,
    "17": 102400,
    "18": 153600,
    "19": 204800,
    "20": 307200,
    "21": 409600,
    "22": 614400,
    "23": 819200,
    "24": 1228800,
    "25": 1638400,
    "26": 2457600,
    "27": 3276800,
    "28": 4915200,
    "29": 6553600,
    "30": 9830400
};
