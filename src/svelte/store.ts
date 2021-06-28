import { writable } from "svelte/store";
import type TrackerView from "../view";
import type { Creature } from "../utils/creature";

export const creatures = writable<Creature[]>([]);
export const show = writable<boolean>(false);
export const current = writable<Creature>();
export const active = writable<boolean>(false);
export const view = writable<TrackerView>();
export default { creatures, show, current, active, view };
