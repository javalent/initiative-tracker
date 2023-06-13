import type InitiativeTracker from "src/main";
import type { DifficultyLevel, GenericCreature, DifficultyThreshold } from ".";
import { DEFAULT_UNDEFINED, convertFraction, getFromCreatureOrBeastiary } from "src/utils";
import { RpgSystem } from "./rpgSystem";
import { Dnd5eRpgSystem } from "./dnd5e";

const DECIMAL_TO_VULGAR_FRACTION: Record<string, string> = {
    0.125: "⅛",
    0.25: "¼",
    0.375: "⅜",
    0.5: "½",
    0.625: "⅝",
    0.75: "¾",
    0.875: "⅞",
} as const;

export class Dnd5eLazyGmRpgSystem extends RpgSystem {
    plugin: InitiativeTracker;

  constructor(plugin: InitiativeTracker) {
      super();
      this.plugin = plugin;
      this.valueUnit = "CR";
      this.displayName = "DnD 5e Lazy GM";
  }

  getCreatureDifficulty(creature: GenericCreature, _: number[]): number {
      return convertFraction(getFromCreatureOrBeastiary(this.plugin, creature, c => c.cr));
  }

  getDifficultyThresholds(playerLevels: number[]): DifficultyThreshold[] {
      const totalLevels = playerLevels.reduce((acc, lv) => acc + lv, 0);
      const avgLevel = playerLevels.length > 0
          ? totalLevels / playerLevels.length : 0;
      return [{
          displayName: "Deadly",
          minValue: totalLevels / (avgLevel > 4 ? 2 : 4)
      }];
  }

  getEncounterDifficulty(
    creatures: Map<GenericCreature, number>,
    playerLevels: number[]
  ): DifficultyLevel {
    const crSum = [...creatures].reduce((acc, [creature, count]) =>
      acc + this.getCreatureDifficulty(creature, playerLevels) * count, 0);
    const deadlyThreshold = this.getDifficultyThresholds(playerLevels)
        .first()?.minValue ?? 0;
    const displayName = crSum > deadlyThreshold ? "Deadly" : "Not Deadly";
    // Get XP totals from the Dnd5e system. Use the intermediate value so we get
    // non-adjusted XP.
    const xp = new Dnd5eRpgSystem(this.plugin)
      .getEncounterDifficulty(creatures, playerLevels)
      .intermediateValues
      .find(intermediate => intermediate.label == "Total XP")
      ?.value ?? 0;

    const summary = `Encounter is ${displayName}
Total XP: ${xp}
Total CR: ${crSum}
Total player levels: ${playerLevels.reduce((acc, lv) => acc + lv, 0)}
Deadly Threshold: ${deadlyThreshold}`;

    return {
        displayName,
        summary,
        cssClass: displayName == "Deadly" ? "deadly" : "easy",
        value: crSum,
        title: "Total CR",
        intermediateValues: [{label: "Total XP", value: xp}]
    };
  }

  formatDifficultyValue(value: number, withUnits?: boolean): string {
    if (!value) return DEFAULT_UNDEFINED;
    console.log(value);
    const decimalPart = value % 1;
    const wholePart = Math.floor(value);
    let fractionString = "";
    if (decimalPart != 0 && decimalPart in DECIMAL_TO_VULGAR_FRACTION) {
        fractionString = DECIMAL_TO_VULGAR_FRACTION[decimalPart];
    } else {
        fractionString = value.toString().slice(1);
    }

    const numString = (wholePart == 0 ? "" : wholePart.toString())
        + fractionString;
    return withUnits ? `CR ${numString}` : numString;
  }
}