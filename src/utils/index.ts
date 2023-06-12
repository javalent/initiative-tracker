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
