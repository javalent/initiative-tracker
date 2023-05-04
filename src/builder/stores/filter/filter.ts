import type { SRDMonster } from "index";
import { prepareSimpleSearch, SearchResult } from "obsidian";
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
export type Filter = RangeFilter | OptionsFilter | StringFilter;

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
    let search = prepareSimpleSearch("");
    store.subscribe((value) => (search = prepareSimpleSearch(value)));
    return {
        isDefault,
        getIsDefault: () => get(isDefault),
        subscribe,
        set,
        reset: () => set(DEFAULT_STRING),
        compare: (value: string) => {
            if (get(isDefault)) return true;
            return get(isDefault) || search(value) != null;
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
    const buildAndSubscribe = (filter: Filter) => {
        const store = getFilterStore(filter);
        map.set(filter.id, store);
        subscriptions.set(
            filter.id,
            store.subscribe((_) => {
                filters$.update((f) => f);
            })
        );
        return store;
    };

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
        buildAndSubscribe(filter);
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

    const layout = writable(DEFAULT_LAYOUT);

    const active = derived(filters$, (filters$) => {
        let active = 0;
        for (const filter of filters$.values()) {
            if (!filter.getIsDefault()) {
                active++;
            }
        }
        return active;
    });

    const name: StringFilterStore = buildAndSubscribe(
        NAME_FILTER
    ) as StringFilterStore;

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
        filters: filters$,
        layout,
        name
    };
}

export const name = writable<string>();

const NAME_FILTER: StringFilter = {
    type: FilterType.String,
    text: "Name",
    fields: ["name"],
    options: "",
    id: "ID_DEFAULT_NAME_FILTER",
    derive: false
};

export const DEFAULT_FILTERS: Filter[] = [
    {
        type: FilterType.Range,
        text: "CR",
        fields: ["cr"],
        options: [0, 30],
        id: "ID_DEFAULT_CR_FILTER",
        derive: true
    },
    {
        type: FilterType.Options,
        text: "Size",
        fields: ["size"],
        options: [],
        id: "ID_DEFAULT_SIZE_FILTER",
        derive: true
    },
    {
        type: FilterType.Options,
        text: "Type",
        fields: ["type"],
        options: [],
        id: "ID_DEFAULT_TYPE_FILTER",
        derive: true
    },
    {
        type: FilterType.String,
        text: "Alignment",
        fields: ["alignment"],
        options: "",
        id: "ID_DEFAULT_ALIGNMENT_FILTER",
        derive: true
    }
];

export const DEFAULT_LAYOUT: FilterLayout = [
    { filter: "ID_DEFAULT_CR_FILTER" },
    {
        nested: [
            { filter: "ID_DEFAULT_SIZE_FILTER" },
            { filter: "ID_DEFAULT_TYPE_FILTER" },
            { filter: "ID_DEFAULT_ALIGNMENT_FILTER" }
        ]
    }
];

export type FilterLayoutItem =
    | {
          filter: string; //filter id
      }
    | {
          nested: FilterLayout;
      };
export type FilterLayout = FilterLayoutItem[];
