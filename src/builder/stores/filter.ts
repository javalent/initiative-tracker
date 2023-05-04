import type { SRDMonster } from "index";
import { getId } from "src/utils/creature";
import { derived, get, Readable, Writable, writable } from "svelte/store";

export enum FilterType {
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

interface BaseFilterStore<T extends Filter> extends Writable<T["options"]> {
    isDefault: Readable<boolean>;
    getDefault: () => boolean;
    reset: () => void;
    comparer: (value: T["options"]) => Readable<boolean>;
    filter: Filter;
    type: T["type"];
}
export interface RangeFilterStore extends BaseFilterStore<RangeFilter> {
    type: FilterType.Range;
}
export interface OptionsFilterStore extends BaseFilterStore<OptionsFilter> {
    type: FilterType.Options;
}
export interface StringFilterStore extends BaseFilterStore<StringFilter> {
    type: FilterType.String;
}

type FilterStore = RangeFilterStore | OptionsFilterStore | StringFilterStore;

type FilterFactory<T extends Filter> = (filter: T) => FilterStore;

const createRangeFilter: FilterFactory<RangeFilter> = (filter) => {
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
        getDefault: () => get(isDefault),

        update,
        set,
        subscribe,

        reset: () => set([...filter.options]),

        comparer: (value: [number, number]) =>
            derived(store, (values) => {
                if (get(isDefault)) return true;
                return value[0] >= values[0] && value[1] <= values[1];
            }),
        filter,
        type: filter.type
    };
};

const createOptionsFilter: FilterFactory<OptionsFilter> = (filter) => {
    let DEFAULT_STRING_ARRAY: string[] = [];
    const store = writable<string[]>([...DEFAULT_STRING_ARRAY]);
    const { subscribe, set, update } = store;

    const isDefault = derived(store, (existing) => {
        return !existing.length;
    });
    return {
        isDefault,
        getDefault: () => get(isDefault),
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
        filter,
        type: filter.type
    };
};

const createStringFilter: FilterFactory<StringFilter> = (filter) => {
    let DEFAULT_STRING: string = "";
    const store = writable<string>(DEFAULT_STRING);
    const { subscribe, set, update } = store;

    const isDefault = derived(store, (existing) => {
        return !existing.length;
    });
    return {
        isDefault,
        getDefault: () => get(isDefault),
        subscribe,
        set,
        reset: () => set(DEFAULT_STRING),
        comparer: (value: string) =>
            derived(store, (val) => {
                return get(isDefault) || value === val;
            }),
        update,
        filter,
        type: filter.type
    };
};

function getFilterStore(filter: Filter) {
    switch (filter.type) {
        case FilterType.Options:
            return createOptionsFilter(filter);
        case FilterType.Range:
            return createRangeFilter(filter);
        case FilterType.String:
            return createStringFilter(filter);
    }
}
export type BuiltFilterStore = ReturnType<typeof createFilterStore>;

export function createFilterStore(
    creatures: Writable<SRDMonster[]>,
    filters: Filter[]
) {
    const map = new Map<string, FilterStore>();
    const filters$ = writable(map);
    const subscriptions = new Map();
    for (const filter of filters) {
        const store = getFilterStore(filter);
        map.set(filter.id, store);
        subscriptions.set(
            filter.id,
            store.subscribe((_) => filters$.update((f) => f))
        );
    }
    const filtered = derived([creatures, filters$], ([creatures, filters$]) => {
        const filtered: SRDMonster[] = [];
        const filters = Array.from(filters$.values());
        for (const creature of creatures) {
            if (
                filters.every((filter) => {
                    if (!(filter.filter.field in creature)) return false;
                    return filter.comparer(creature[filter.filter.field]);
                })
            ) {
                filtered.push(creature);
            }
        }
        return filtered;
    });

    const active = derived(filters$, (filters$) => {
        let active = 0;
        for (const filter of filters$.values()) {
            if (!filter.getDefault()) {
                active++;
            }
        }
        return active;
    });

    return {
        add: (filter: Filter) =>
            filters$.update((filters) => {
                const store = getFilterStore(filter);
                filters.set(filter.id, store);
                subscriptions.set(
                    filter.id,
                    store.subscribe((_) => filters$.update((f) => f))
                );
                return filters;
            }),
        remove: (filter: Filter) =>
            filters$.update((filters) => {
                filters.delete(filter.id);
                subscriptions.get(filter.id)();
                subscriptions.delete(filter.id);
                return filters;
            }),
        reset: () =>
            filters$.update((filters) => {
                for (const filter of filters.values()) {
                    filter.reset();
                }
                return filters;
            }),
        active,
        filtered,
        filters: filters$
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

export const sources = createStringArrayStore();
export const name = writable<string>();

export const DEFAULT_FILTERS: Filter[] = [
    {
        type: FilterType.Range,
        text: "CR",
        field: "cr",
        options: [0, 30],
        id: getId()
    }
];
