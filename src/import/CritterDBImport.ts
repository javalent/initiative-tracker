import type { HomebrewCreature } from "@types";

export const ImportFromCritterDB = async (
    ...files: File[]
): Promise<Map<string, HomebrewCreature>> => {
    let importedMonsters: Map<string, HomebrewCreature> = new Map();
    for (let file of files) {
        try {
            const monsters = await buildMonsterFromFile(file);
            importedMonsters = new Map([...importedMonsters, ...monsters]);
        } catch (e) {}
    }
    return importedMonsters;
};

async function buildMonsterFromFile(
    file: File
): Promise<Map<string, HomebrewCreature>> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (event: any) => {
            const importedMonsters: Map<string, HomebrewCreature> = new Map();
            try {
                const parsed = JSON.parse(event.target.result);
                let monsters = [];
                if (parsed.creatures) {
                    monsters = parsed.creatures;
                } else {
                    monsters = [parsed];
                }
                for (let monster of monsters) {
                    const importedMonster: HomebrewCreature = {
                        name: monster.name,
                        source: "CritterDB",
                        hp: monster.stats.hitPoints,
                        ac: monster.stats.armorClass,
                        stats: [
                            monster.stats.abilityScores.strength,
                            monster.stats.abilityScores.dexterity,
                            monster.stats.abilityScores.constitution,
                            monster.stats.abilityScores.intelligence,
                            monster.stats.abilityScores.wisdom,
                            monster.stats.abilityScores.charisma
                        ],
                        cr: monster.stats.challengeRating ?? "",
                    };
                    importedMonsters.set(importedMonster.name, importedMonster);
                }

                resolve(importedMonsters);
            } catch (e) {
                reject();
            }
        };

        reader.readAsText(file);
    });
}
