import type { HomebrewCreature } from "../../@types";
const SAVES: Record<
    string,
    | "strength"
    | "dexterity"
    | "constitution"
    | "intelligence"
    | "wisdom"
    | "charisma"
> = {
    STR: "strength",
    DEX: "dexterity",
    CON: "constitution",
    INT: "intelligence",
    WIS: "wisdom",
    CHA: "charisma"
};
export const ImportEntitiesFromImprovedInitiative = async (
    ...files: File[]
): Promise<Map<string, HomebrewCreature>> => {
    return new Promise((resolve, reject) => {
        for (let file of files) {
            const reader = new FileReader();

            reader.onload = async (event: any) => {
                const importedMonsters: Map<string, HomebrewCreature> =
                    new Map();
                try {
                    let json = JSON.parse(event.target.result);
                    const monsters = Object.keys(json).filter((key) =>
                        /^Creatures/.test(key)
                    );
                    for (let key of monsters) {
                        try {
                            const monster = json[key];
                            const importedMonster: HomebrewCreature = {
                                name: monster.Name,
                                source: monster.Source?.trim().length
                                    ? monster.Source.trim()
                                    : "Unknown - Improved Initiative File",

                                hp: monster.HP.Value,
                                ac: monster.AC.Value,
                                stats: Object.values(monster.Abilities) as [
                                    number,
                                    number,
                                    number,
                                    number,
                                    number,
                                    number
                                ],
                                cr: monster.Challenge?.trim() ?? ""
                            };
                            importedMonsters.set(
                                importedMonster.name,
                                importedMonster
                            );
                        } catch (e) {
                            continue;
                        }
                    }
                    resolve(importedMonsters);
                } catch (e) {
                    reject();
                }
            };

            reader.readAsText(file);
        }
    });
};
