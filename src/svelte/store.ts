import { writable } from "svelte/store";
import type { Creature } from "../utils/creature";

export const creatures = writable<Creature[]>([]);
export const show = writable<boolean>(false);
export const current = writable<number>(0);
export const active = writable<boolean>(false);
export default { creatures, show, current, active };
