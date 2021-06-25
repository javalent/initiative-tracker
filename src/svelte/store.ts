import { writable } from "svelte/store";
/* import type TrackerView from "../view"; */

export const creatures = writable([]);
export const view = writable/* <TrackerView> */();
export const show = writable/* <boolean> */(false);
export default { creatures, view, show };
