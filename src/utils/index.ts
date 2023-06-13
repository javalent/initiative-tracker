import type InitiativeTracker from "src/main";
import type { SRDMonster } from "index";
import type { Creature } from "./creature";

export * from "./constants";
export * from "./icons";
export * from "./conditions";
export { getRpgSystem, RpgSystemSetting } from "./rpg-system";

export const convertFraction = (s: string | number): number => {
    if (typeof s == "number") return s;
    if (typeof s != "string") return null;
    if (!s || s == "undefined" || !s.length) return 0;

    let split = s.split("/");
    if (split.length == 1) {
        if (isNaN(Number(s))) {
            return 0;
        }
        return Number(s);
    }
    return Number(split[0]) / Number(split[1]);
};

export function getFromCreatureOrBeastiary<T>(
    plugin: InitiativeTracker,
    creature: Creature | SRDMonster,
    getter: (creature: Creature | SRDMonster | null) => T
): T {
    const fromBase = getter(creature);
    if (fromBase) return fromBase;
    return getter(plugin.bestiary.find(c => c.name == creature.name));
}