import type { SRDMonster } from "index";
import { convertFraction } from "src/utils";
import { getId } from "src/utils/creature";
import { derived, get, Readable, Writable, writable } from "svelte/store";

export enum FilterType {
    Range,
    String,
    Options
}

interface BaseFilter {
    type: FilterType;
    fields: string[];
    text: string;
    id: string;
    derive: boolean;
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

interface BaseFilterStore<T extends Filter, S> extends Writable<T["options"]> {
    isDefault: Readable<boolean>;
    getIsDefault: () => boolean;
    reset: () => void;
    compare: (value: S) => boolean;
    filter: Filter;
    type: T["type"];
    options: T["options"];
    text: T["text"];
}
export interface RangeFilterStore
    extends BaseFilterStore<RangeFilter, number | string> {
    type: FilterType.Range;
}
export interface OptionsFilterStore
    extends BaseFilterStore<OptionsFilter, number | string> {
    type: FilterType.Options;
}
export interface StringFilterStore
    extends BaseFilterStore<StringFilter, number | string> {
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
        getIsDefault: () => get(isDefault),

        update,
        set,
        subscribe,

        reset: () => set([...filter.options]),

        compare: (value: number) => {
            if (get(isDefault)) return true;
            const values = get(store);
            return (
                convertFraction(value) >= values[0] &&
                convertFraction(value) <= values[1]
            );
        },
        filter,
        ...filter
    };
};

const createOptionsFilter: FilterFactory<OptionsFilter> = (filter) => {
    const store = writable<string[]>([]);
    const { subscribe, set, update } = store;

    const isDefault = derived(store, (existing) => {
        return !existing.length;
    });
    return {
        isDefault,
        getIsDefault: () => get(isDefault),
        subscribe,
        set,
        reset: () => set([]),
        compare: (value: string) => {
            if (get(isDefault)) return true;
            const values = get(store);
            return values.includes(value);
        },
        update,
        filter,
        ...filter
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
        getIsDefault: () => get(isDefault),
        subscribe,
        set,
        reset: () => set(DEFAULT_STRING),
        compare: (value: string) => {
            if (get(isDefault)) return true;
            const values = get(store);
            return get(isDefault) || value === values;
        },
        update,
        filter,
        ...filter
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

function getDerivedFilterOptions(
    creatures: SRDMonster[],
    filters: Filter[]
): Map<Filter, Set<any>> {
    const options = new Map(filters.map((f) => [f, new Set()]));
    for (const creature of creatures) {
        for (const filter of filters) {
            for (const field of filter.fields) {
                if (field in creature) {
                    switch (filter.type) {
                        case FilterType.Range: {
                            let fieldAsNumber = convertFraction(
                                creature[field]
                            );
                            if (fieldAsNumber == null || isNaN(fieldAsNumber))
                                continue;
                            const current = [
                                ...options.get(filter)
                            ] as number[];
                            if (!current.length) {
                                current[0] = Infinity;
                                current[1] = -Infinity;
                            }
                            current[0] = Math.min(current[0], fieldAsNumber);
                            if (
                                Math.max(current[1], fieldAsNumber) !=
                                current[0]
                            ) {
                                current[1] = Math.max(
                                    current[1],
                                    fieldAsNumber
                                );
                            }

                            options.set(filter, new Set(current));
                            break;
                        }
                        case FilterType.Options: {
                            options.get(filter).add(creature[field]);
                            break;
                        }
                        case FilterType.String: {
                            continue;
                        }
                    }
                    continue;
                }
            }
        }
    }
    return options;
}

export function createFilterStore(
    creatures: Writable<SRDMonster[]>,
    filters: Filter[]
) {
    const map = new Map<string, FilterStore>();
    const filters$ = writable(map);
    const subscriptions = new Map();
    const needToDerive = filters.filter((f) => f.derive);
    if (needToDerive.length) {
        const options = getDerivedFilterOptions(get(creatures), filters);
        for (const [filter, set] of options) {
            filter.options = Array.from(set) as any[];
        }
    }
    for (const filter of filters) {
        const store = getFilterStore(filter);
        map.set(filter.id, store);
        subscriptions.set(
            filter.id,
            store.subscribe((_) => {
                filters$.update((f) => f);
            })
        );
    }
    const filtered = derived([creatures, filters$], ([creatures, filters$]) => {
        const filtered: SRDMonster[] = [];
        const filters = Array.from(filters$.values());
        for (const creature of creatures) {
            if (
                filters.every((filter) => {
                    for (const field of filter.filter.fields) {
                        if (!(field in creature)) continue;
                        return filter.compare(creature[field]);
                    }
                    return false;
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
            if (!filter.getIsDefault()) {
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
        fields: ["cr"],
        options: [0, 30],
        id: getId(),
        derive: true
    },
    {
        type: FilterType.Options,
        text: "Size",
        fields: ["size"],
        options: [],
        id: getId(),
        derive: true
    },
    {
        type: FilterType.Options,
        text: "Type",
        fields: ["type"],
        options: [],
        id: getId(),
        derive: true
    },
    {
        type: FilterType.Options,
        text: "Alignment",
        fields: ["alignment"],
        options: [],
        id: getId(),
        derive: true
    }
];
