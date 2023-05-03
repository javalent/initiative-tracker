import type { SRDMonster } from "index";
import { getId } from "src/utils/creature";
import { derived, get, Readable, Writable, writable } from "svelte/store";

enum FilterType {
    Range,
    String,
    Options
}

interface BaseFilter {
    type: FilterType;
    field: string;
    text: string;
    id: string;
}
interface RangeFilter extends BaseFilter {
    type: FilterType.Range;
    options: [number, number];
}
interface OptionsFilter extends BaseFilter {
    type: FilterType.Options;
    options: string[];
}
interface StringFilter extends BaseFilter {
    type: FilterType.String;
    options: string;
}
type Filter = RangeFilter | OptionsFilter | StringFilter;

const DEFAULT_FILTERS: Filter[] = [
    {
        type: FilterType.Range,
        text: "CR",
        field: "cr",
        options: [0, 30],
        id: getId()
    }
];

const DEFAULT_CR: [number, number] = [0, 30];

interface FilterStore<T> extends Writable<T> {
    isDefault: Readable<boolean>;
    reset: () => void;
    comparer: (value: T) => Readable<boolean>;
    field: any;
}

function createRangeFilter(filter: RangeFilter): FilterStore<[number, number]> {
    const store = writable<[number, number]>([...filter.options]);
    const { update, set, subscribe } = store;
    const isDefault = derived(store, (existing) => {
        if (
            filter.options[0] == existing[0] &&
            filter.options[1] == existing[1]
        )
            return true;
        return false;
    });
    return {
        isDefault,

        update,
        set,
        subscribe,

        reset: () => set([...filter.options]),

        comparer: (value: [number, number]) =>
            derived(store, (values) => {
                if (get(isDefault)) return true;
                return value[0] >= values[0] && value[1] <= values[1];
            }),

        field: filter.field
    };
}
function createOptionsFilter(filter: OptionsFilter): FilterStore<string[]> {
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
        comparer: (value: string[]) =>
            derived(store, (values) => {
                return (
                    get(isDefault) || value.every((val) => values.includes(val))
                );
            }),
        update,

        field: filter.field
    };
}
function createStringFilter(filter: StringFilter): FilterStore<string> {
    let DEFAULT_STRING: string = "";
    const store = writable<string>(DEFAULT_STRING);
    const { subscribe, set, update } = store;

    const isDefault = derived(store, (existing) => {
        return !existing.length;
    });
    return {
        isDefault,
        subscribe,
        set,
        reset: () => set(DEFAULT_STRING),
        comparer: (value: string) =>
            derived(store, (val) => {
                return get(isDefault) || value === val;
            }),
        update,

        field: filter.field
    };
}

function getFilterStore<T extends Filter>(
    filter: Filter
): FilterStore<T["options"]> {
    switch (filter.type) {
        case FilterType.Options:
            return createOptionsFilter(filter);
        case FilterType.Range:
            return createRangeFilter(filter);
        case FilterType.String:
            return createStringFilter(filter);
    }
}

export function createFilterStore(
    creatures: Writable<SRDMonster[]>,
    filters: Filter[]
) {
    const filters$ = writable(
        new Map(filters.map((f) => [f.id, getFilterStore(f)]))
    );
    const filtered = derived([creatures, filters$], ([creatures, filters$]) => {
        const filtered: SRDMonster[] = [];
        const filters = Array.from(filters$.values());
        for (const creature of creatures) {
            if (
                filters.every((filter) => {
                    if (!(filter.field in creature)) return false;
                    return filter.comparer(creature[filter.field]);
                })
            ) {
                filtered.push(creature);
            }
        }
        return filtered;
    });
    return {
        add: (filter: Filter) =>
            filters$.update((filters) => {
                filters.set(filter.id, getFilterStore(filter));
                return filters;
            }),
        remove: (filter: Filter) =>
            filters$.update((filters) => {
                filters.delete(filter.id);
                return filters;
            }),
        reset: () =>
            filters$.update((filters) => {
                for (const filter of filters.values()) {
                    filter.reset();
                }
                return filters;
            }),

        filtered
    };
}


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
