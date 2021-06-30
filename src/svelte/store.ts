import { writable } from "svelte/store";
import type TrackerView from "../view";

export const view = writable<TrackerView>();
export default { view };
