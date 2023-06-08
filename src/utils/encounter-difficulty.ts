import { convertFraction, XP_PER_CR } from "../utils";
import type InitiativeTracker from "../main";
import type { Creature } from "./creature";
import type { SRDMonster } from "index";

type Dnd5eXpBudget = {easy: number; medium: number; hard: number; deadly: number; daily: number};

type BaseDifficultyReport = {
    xpSystem: "dnd5e" | "dnd5eLazyGm";
    difficulty: string;
    difficultyCssClass: string;
    totalXp: number | null;
    formatted: string;
    budget: {[key: string]: number};
}

export type Dnd5eDifficultyReport = BaseDifficultyReport & {
    xpSystem: "dnd5e";
    totalXp: number;       // XP prior to adjustment. This is _not_ the final XP value.
    adjustedXp: number;    // Final XP total after sums an adjustments.
    multiplier: number;
    budget: Dnd5eXpBudget;
};

export type Dnd5eLazyGmDifficultyReport = BaseDifficultyReport & {
    xpSystem: "dnd5eLazyGm";
    crSum: number;
    playerLevelSum: number;
    budget: { deadly: number };
}

export type DifficultyReport = Dnd5eDifficultyReport | Dnd5eLazyGmDifficultyReport | null;

export const getCreatureXP = (
    plugin: InitiativeTracker,
    creature: Creature | SRDMonster
) => {
    if (creature.xp) return creature.xp;
    let existing = plugin.bestiary.find((c) => c.name == creature.name);
    if (existing && existing.cr && existing.cr in XP_PER_CR) {
        return XP_PER_CR[existing.cr];
    }
    return 0;
};

const DND5E_XP_BUDGETS: {
    [index: number]: Dnd5eXpBudget;
} = {
    1: { daily: 300, easy: 25, medium: 50, hard: 75, deadly: 100 },
    2: { daily: 600, easy: 50, medium: 100, hard: 150, deadly: 200 },
    3: { daily: 1200, easy: 75, medium: 150, hard: 225, deadly: 400 },
    4: { daily: 1700, easy: 125, medium: 250, hard: 375, deadly: 500 },
    5: { daily: 3500, easy: 250, medium: 500, hard: 750, deadly: 1100 },
    6: { daily: 4000, easy: 300, medium: 600, hard: 900, deadly: 1400 },
    7: { daily: 5000, easy: 350, medium: 750, hard: 1100, deadly: 1700 },
    8: { daily: 6000, easy: 450, medium: 900, hard: 1400, deadly: 2100 },
    9: { daily: 7500, easy: 550, medium: 1100, hard: 1600, deadly: 2400 },
    10: { daily: 9000, easy: 600, medium: 1200, hard: 1900, deadly: 2800 },
    11: { daily: 10500, easy: 800, medium: 1600, hard: 2400, deadly: 3600 },
    12: { daily: 11500, easy: 1000, medium: 2000, hard: 3000, deadly: 4500 },
    13: { daily: 13500, easy: 1100, medium: 2200, hard: 3400, deadly: 5100 },
    14: { daily: 15000, easy: 1250, medium: 2500, hard: 3800, deadly: 5700 },
    15: { daily: 18000, easy: 1400, medium: 2800, hard: 4300, deadly: 6400 },
    16: { daily: 20000, easy: 1600, medium: 3200, hard: 4800, deadly: 7200 },
    17: { daily: 25000, easy: 2000, medium: 3900, hard: 5900, deadly: 8800 },
    18: { daily: 27000, easy: 2100, medium: 4200, hard: 6300, deadly: 9500 },
    19: { daily: 30000, easy: 2400, medium: 4900, hard: 7300, deadly: 10900 },
    20: { daily: 40000, easy: 2800, medium: 5700, hard: 8500, deadly: 12700 }
};

function dnd5eXpBudget(characterLevels: number[]): Dnd5eXpBudget {
    const budget = {easy: 0, medium: 0, hard: 0, deadly: 0, daily: 0};
    characterLevels.forEach(lvl => {
        lvl = Math.max(1, Math.min(lvl, 20));
        budget.easy += DND5E_XP_BUDGETS[lvl].easy
        budget.medium += DND5E_XP_BUDGETS[lvl].medium
        budget.hard += DND5E_XP_BUDGETS[lvl].hard
        budget.deadly += DND5E_XP_BUDGETS[lvl].deadly
        budget.daily += DND5E_XP_BUDGETS[lvl].daily
    });
    return budget;
}

function dnd5eLazyGmEncounterDifficulty(
  plugin: InitiativeTracker,
  playerLevels: number[],
  creatures: Map<Creature | SRDMonster, number>
): Dnd5eLazyGmDifficultyReport | null {
    let crSum = [...creatures].reduce((acc, [creature, count]) =>
        acc + (convertFraction(creature.cr) ?? 0) * count, 0);
    let playerLevelSum = playerLevels.reduce((acc, lv) => acc + lv, 0);
    if (crSum == 0 || playerLevelSum == 0) return null;
    let threshold = playerLevelSum / ((playerLevelSum / playerLevels.length) > 4 ? 2 : 4);
    let rawDifficulty = dnd5eEncounterDifficulty(plugin, playerLevels, creatures);
    let difficultyName = (crSum > threshold) ? "Deadly" : "Not Deadly";
    let totalXp = rawDifficulty?.totalXp;
    return {
        crSum,
        playerLevelSum,
        totalXp,
        xpSystem: "dnd5eLazyGm",
        difficulty: difficultyName,
        difficultyCssClass: (crSum > threshold) ? "deadly" : "easy",
        budget: { deadly: threshold },
        formatted: `Encounter is ${difficultyName}
Total XP: ${totalXp}
Sum of CR: ${crSum}
Sum of player levels: ${playerLevelSum}

Threshold
Deadly: ${threshold}`
    };
}

function dnd5eEncounterDifficulty(
    plugin: InitiativeTracker,
    playerLevels: number[],
    creatures: Map<Creature | SRDMonster, number>
): Dnd5eDifficultyReport | null {
    let xp = [...creatures].reduce((acc, [creature, count]) =>
        acc + getCreatureXP(plugin, creature) * count, 0);
    let numberOfMonsters = [...creatures.values()].reduce((acc, cur) => acc + cur, 0);
    if (!playerLevels?.length || xp == 0 || numberOfMonsters == 0)
        return null;
    let numberMultiplier: number;
    if (numberOfMonsters === 1) {
        numberMultiplier = 1;
    } else if (numberOfMonsters === 2) {
        numberMultiplier = 1.5;
    } else if (numberOfMonsters < 7) {
        numberMultiplier = 2.0;
    } else if (numberOfMonsters < 11) {
        numberMultiplier = 2.5;
    } else if (numberOfMonsters < 15) {
        numberMultiplier = 3.0;
    } else {
        numberMultiplier = 4.0;
    }
    const adjustedXp = numberMultiplier * xp;
    const budget = dnd5eXpBudget(playerLevels);
    let difficulty = "Trivial";
    if (adjustedXp >= budget.deadly) {
        difficulty = "Deadly";
    } else if (adjustedXp >= budget.hard) {
        difficulty = "Hard";
    } else if (adjustedXp >= budget.medium) {
        difficulty = "Medium";
    } else if (adjustedXp >= budget.easy) {
        difficulty = "Easy";
    }
    return {
        xpSystem: "dnd5e",
        difficulty: difficulty,
        difficultyCssClass: difficulty.toLowerCase(),
        totalXp: xp,
        adjustedXp: adjustedXp,
        multiplier: numberMultiplier,
        budget: budget,
        formatted: `Encounter is ${difficulty}
Total XP: ${xp}
Adjusted XP: ${adjustedXp} (x${numberMultiplier})

Threshold
Easy: ${budget.easy}
Medium: ${budget.medium}
Hard: ${budget.hard}
Deadly: ${budget.deadly}`
    };
}

export function encounterDifficulty(
    plugin: InitiativeTracker,
    characterLevels: number[],
    creatures: Map<Creature | SRDMonster, number>
): Dnd5eDifficultyReport | Dnd5eLazyGmDifficultyReport | null {
  switch (plugin.data.xpSystem) {
    case "dnd5e":
        return dnd5eEncounterDifficulty(plugin, characterLevels, creatures);
    case "dnd5eLazyGm":
        return dnd5eLazyGmEncounterDifficulty(plugin, characterLevels, creatures);
  }
}

export function isDnd5e(
  difficulty: Dnd5eDifficultyReport | Dnd5eLazyGmDifficultyReport | null
): difficulty is Dnd5eDifficultyReport {
  return difficulty?.xpSystem == "dnd5e";
}

export function isDnd5eLazyGm(
  difficulty: Dnd5eDifficultyReport | Dnd5eLazyGmDifficultyReport | null
): difficulty is Dnd5eLazyGmDifficultyReport {
  return difficulty?.xpSystem == "dnd5eLazyGm";
}
