import { writable } from "svelte/store";

export const creatures = writable([]);
export default { creatures: creatures };
