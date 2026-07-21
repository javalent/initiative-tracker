import type InitiativeTracker from "../../main";
import { crToString } from "..";
import type { DifficultyLevel, DifficultyThreshold, GenericCreature } from ".";
import { XP_PER_CR } from "./dnd5e";
import { RpgSystem } from "./rpgSystem";

const XP_THRESHOLDS_PER_LEVEL: Record<
    number,
    Record<"low" | "moderate" | "high", number>
> = {
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
    High: "hard",
    Trivial: "trivial"
};

export class Dnd55eRpgSystem extends RpgSystem {
    plugin: InitiativeTracker;

    override systemDifficulties: [string, string, ...string[]] = [
        "Low",
        "Moderate",
        "High"
    ];

    constructor(plugin: InitiativeTracker) {
        super();
        this.plugin = plugin;
        this.displayName = "D&D 5.5e";
    }

    getCreatureDifficulty(creature: GenericCreature, _?: number[]): number {
        if (creature.xp != null) return creature.xp;

        const bestiaryCreature = this.plugin.getCreatureFromBestiary(
            creature.name
        );
        if (bestiaryCreature?.xp != null) return bestiaryCreature.xp;

        const cr = creature.cr ?? bestiaryCreature?.cr ?? "0";
        return XP_PER_CR[cr.toString()] ?? 0;
    }

    getAdditionalCreatureDifficultyStats(
        creature: GenericCreature,
        _?: number[]
    ): string[] {
        const bestiaryCreature = this.plugin.getCreatureFromBestiary(
            creature.name
        );
        const cr = creature.cr ?? bestiaryCreature?.cr ?? 0;
        return [`${crToString(cr)} CR`];
    }

    getEncounterDifficulty(
        creatures: Map<GenericCreature, number>,
        playerLevels: number[]
    ): DifficultyLevel {
        const totalXp = [...creatures].reduce(
            (total, [creature, count]) =>
                total + this.getCreatureDifficulty(creature) * count,
            0
        );
        const validPlayerLevels = this.#getValidPlayerLevels(playerLevels);
        const thresholds = this.getDifficultyThresholds(validPlayerLevels);
        const displayName =
            validPlayerLevels.length === 0
                ? "Trivial"
                : (thresholds.findLast(
                      (threshold) => totalXp >= threshold.minValue
                  )?.displayName ?? "Trivial");
        const thresholdSummary = thresholds
            .map(
                (threshold) => `${threshold.displayName}: ${threshold.minValue}`
            )
            .join("\n");
        const summary = `Encounter is ${displayName}
Total XP: ${totalXp}

Threshold
${thresholdSummary}`;

        return {
            displayName,
            summary,
            cssClass: DIFFICULTY_TO_CSS[displayName],
            value: totalXp,
            title: "Total XP",
            intermediateValues: []
        };
    }

    getDifficultyThresholds(
        playerLevels: number[]
    ): DifficultyThreshold[] {
        const budget: Record<"low" | "moderate" | "high", number> = {
            low: 0,
            moderate: 0,
            high: 0
        };
        const validPlayerLevels = this.#getValidPlayerLevels(playerLevels);

        for (const difficulty of Object.keys(budget) as Array<keyof typeof budget>) {
            budget[difficulty] = validPlayerLevels.reduce(
                (total, level) =>
                    total + XP_THRESHOLDS_PER_LEVEL[level][difficulty],
                0
            );
        }

        return Object.entries(budget).map(([name, value]) => ({
            displayName: name.charAt(0).toUpperCase() + name.slice(1),
            minValue: value
        }));
    }

    #getValidPlayerLevels(playerLevels: number[]): number[] {
        return playerLevels
            .filter((level) => level && level > 0)
            .map((level) => Math.max(1, Math.min(level, 20)));
    }
}
