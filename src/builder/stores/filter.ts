import { derived, get, Readable, Writable, writable } from "svelte/store";

const DEFAULT_CR: [number, number] = [0, 30];

function createCR() {
    const store = writable<[number, number]>([...DEFAULT_CR]);
    const { subscribe, set, update } = store;
    const isDefault = derived(store, (existing) => {
        if (DEFAULT_CR[0] == existing[0] && DEFAULT_CR[1] == existing[1])
            return true;
        return false;
    });
    return {
        isDefault,
        subscribe,
        set: (value: [number, number]) => {
            const current = get(store);
            let setMin = true,
                setMax = true;
            if (value[0] == current[0] || value[0] < 0) {
                setMin = false;
            }

            if (value[1] == current[1] || value[0] > 30) {
                setMax = false;
            }
            if (!setMin && !setMax) return;
            update((cr) => {
                cr = [...value];
                return cr;
            });
        },
        reset: () => set([...DEFAULT_CR]),
        update,
        comparer: (value: [number, number]) =>
            derived(store, (values) => {
                if (get(isDefault)) return true;
                return value[0] >= values[0] && value[1] <= values[1];
            })
    };
}

function createStringArrayStore() {
    let DEFAULT_STRING_ARRAY: string[] = [];
    const store = writable<string[]>([...DEFAULT_STRING_ARRAY]);
    const { subscribe, set, update } = store;

    const isDefault = derived(store, (existing) => {
        return !existing.length;
    });
    return {
        isDefault,
        subscribe,
        set,
        reset: () => set([...DEFAULT_STRING_ARRAY]),
        comparer: (value: string) =>
            derived(store, (values) => {
                return get(isDefault) || values.includes(value);
            }),
        update
    };
}

export const cr = createCR();
export const alignment = createStringArrayStore();
export const type = createStringArrayStore();
export const size = createStringArrayStore();
export const sources = createStringArrayStore();
export const name = writable<string>();
