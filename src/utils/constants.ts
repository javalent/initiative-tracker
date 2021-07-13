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
    sync: false
};
