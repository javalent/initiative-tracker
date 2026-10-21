import type InitiativeTracker from "src/main";
import type { DifficultyLevel, GenericCreature, DifficultyThreshold } from ".";
import { Dnd5eRpgSystem } from "./dnd5e";
import { RpgSystem } from "./rpgSystem";

const XP_BUDGET_PER_LEVEL: {
    [level: number]: { low: number; moderate: number; high: number };
} = {
    1: { low: 50, moderate: 75, high: 100 },
    2: { low: 100, moderate: 150, high: 200 },
    3: { low: 150, moderate: 225, high: 400 },
    4: { low: 250, moderate: 375, high: 500 },
    5: { low: 500, moderate: 750, high: 1100 },
    6: { low: 600, moderate: 1000, high: 1400 },
    7: { low: 750, moderate: 1300, high: 1700 },
    8: { low: 1000, moderate: 1700, high: 2100 },
    9: { low: 1300, moderate: 2000, high: 2600 },
    10: { low: 1600, moderate: 2300, high: 3100 },
    11: { low: 1900, moderate: 2900, high: 4100 },
    12: { low: 2200, moderate: 3700, high: 4700 },
    13: { low: 2600, moderate: 4200, high: 5400 },
    14: { low: 2900, moderate: 4900, high: 6200 },
    15: { low: 3300, moderate: 5400, high: 7800 },
    16: { low: 3800, moderate: 6100, high: 9800 },
    17: { low: 4500, moderate: 7200, high: 11700 },
    18: { low: 5000, moderate: 8700, high: 14200 },
    19: { low: 5500, moderate: 10700, high: 17200 },
    20: { low: 6400, moderate: 13200, high: 22000 }
};

const DIFFICULTY_TO_CSS: Record<string, string> = {
    Low: "easy",
    Moderate: "medium",
    High: "deadly",
    Trivial: "trivial"
};

export class Dnd552024RpgSystem extends RpgSystem {
    plugin: InitiativeTracker;
    dnd5eRpgSystem: Dnd5eRpgSystem;

    override systemDifficulties: [string, string, ...string[]] = [
        "Low",
        "Moderate",
        "High"
    ];

    constructor(plugin: InitiativeTracker) {
        super();
        this.plugin = plugin;
        this.dnd5eRpgSystem = new Dnd5eRpgSystem(plugin);
        this.displayName = "Dnd 5.5e/2024";
    }

    getCreatureDifficulty(creature: GenericCreature, _?: number[]): number {
        return this.dnd5eRpgSystem.getCreatureDifficulty(creature);
    }

    getAdditionalCreatureDifficultyStats(
        creature: GenericCreature,
        playerLevels?: number[]
    ): string[] {
        return this.dnd5eRpgSystem.getAdditionalCreatureDifficultyStats(
            creature,
            playerLevels
        );
    }

    getEncounterDifficulty(
        creatures: Map<GenericCreature, number>,
        playerLevels: number[]
    ): DifficultyLevel {
        const creatureXp = [...creatures].reduce(
            (acc, [creature, count]) =>
                acc + this.getCreatureDifficulty(creature) * count,
            0
        );

        const thresholds = this.getDifficultyThresholds(playerLevels);
        const hasParty = this.#clampedLevels(playerLevels).length > 0;
        const displayName =
            !hasParty || creatureXp === 0
                ? "Trivial"
                : [...thresholds]
                      .reverse()
                      .find((threshold) => creatureXp >= threshold.minValue)
                      ?.displayName ?? "Trivial";

        const thresholdSummary = thresholds
            .map(
                (threshold) => `${threshold.displayName}: ${threshold.minValue}`
            )
            .join("\n");

        const summary = `Encounter is ${displayName}
Total XP: ${creatureXp}

Threshold
${thresholdSummary}`;

        return {
            displayName,
            summary,
            cssClass: DIFFICULTY_TO_CSS[displayName] ?? "trivial",
            value: creatureXp,
            title: "Total XP",
            intermediateValues: []
        };
    }

    getDifficultyThresholds(playerLevels: number[]): DifficultyThreshold[] {
        const budget = { low: 0, moderate: 0, high: 0 };
        const clampedLevels = this.#clampedLevels(playerLevels);

        Object.keys(budget).forEach((key) => {
            budget[key as keyof typeof budget] = clampedLevels.reduce(
                (acc, lv) => acc + (XP_BUDGET_PER_LEVEL[lv]?.[key] ?? 0),
                0
            );
        });

        return [
            { displayName: "Low", minValue: budget.low },
            { displayName: "Moderate", minValue: budget.moderate },
            { displayName: "High", minValue: budget.high }
        ];
    }

    #clampedLevels(playerLevels: number[]): number[] {
        return playerLevels
            .filter((lvl) => lvl && lvl > 0)
            .map((lv) => Math.max(1, Math.min(lv, 20)));
    }
}
