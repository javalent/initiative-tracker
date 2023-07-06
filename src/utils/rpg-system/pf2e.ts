import { RpgSystem } from './rpgSystem'
import { crToString, getFromCreatureOrBestiary } from '..'
import type { DifficultyLevel, GenericCreature, DifficultyThreshold } from '.'
import InitiativeTracker from '../../main'

// level without proficiency variant
// const xpVariantCreatureDifferences = new Map([
//   [-7, 9],
//   [-6, 12],
//   [-5, 14],
//   [-4, 18],
//   [-3, 21],
//   [-2, 26],
//   [-1, 32],
//   [0, 40],
//   [1, 48],
//   [2, 60],
//   [3, 72],
//   [4, 90],
//   [5, 108],
//   [6, 135],
//   [7, 160],
// ]);


const XP_CREATURE_DIFFERENCES : Record<string,number> = {
  "-4":10,
  "-3":15,
  "-2":20,
  "-1":30,
  "0":40,
  "1":60,
  "2":80,
  "3":120,
  "4":160
}

const XP_SIMPLE_HAZARD_DIFFERENCES : Record<string, number> ={
  "-4": 2,
  "-3": 3,
  "-2": 4,
  "-1": 6,
  "0": 8,
  "1": 12,
  "2": 16,
  "3": 24,
  "4":32
}

export class PF2eRpgSystem extends RpgSystem {
	plugin: InitiativeTracker
	constructor(plugin: InitiativeTracker) {
		super()
		this.plugin = plugin
		this.displayName = 'Pathfinder 2e'
	}
	getCreatureDifficulty(creature: GenericCreature, playerLevels?: number[]): number {
		const lvl = getFromCreatureOrBestiary(
			this.plugin,
			creature,
			(c) => c?.level
		)
		if (lvl) return lvl ?? 0

    const creature_differences = String(-(getFromCreatureOrBestiary(this.plugin, playerLevels, (p) => p?.level) - lvl))
    
    return XP_CREATURE_DIFFERENCES[creature_differences] ?? 0
	}
}
