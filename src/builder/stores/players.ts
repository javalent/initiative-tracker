import { derived, get, writable } from "svelte/store";
import type { CreatureState } from "src/types/creatures";

export const playerCount = writable(0);

export interface Player extends Partial<CreatureState> {
    level: number;
    name: string;
    isPlayer: true;
    enabled: boolean;
    count: number;
}
export interface GenericPlayer extends Partial<CreatureState> {
    level: number;
    isPlayer: false;
    enabled: boolean;
    count: number;
}
export type CombinedPlayer = Player | GenericPlayer;

function createPlayers() {
    const store = writable<CombinedPlayer[]>([]);
    const { subscribe, set, update } = store;
    const party = derived(store, ($players) => {
        return $players.filter<Player>((p): p is Player => p.isPlayer);
    });
    const generics = derived(store, ($players) => {
        return $players.filter<GenericPlayer>(
            (p): p is GenericPlayer => p.isPlayer == false
        );
    });
    const count = derived(store, ($players) => {
        return [...$players].reduce((a, b) => a + b.count, 0);
    });

    return {
        subscribe,
        party,
        generics,
        count,
        modifier: derived(count, ($count) =>
            $count < 3 ? 1 : $count > 5 ? -1 : 0
        ),
        average: derived(store, ($players) => {
            if (!$players.length) return 0;
            return (
                $players.reduce((a, p) => a + (p.enabled ? p.level : 0), 0) /
                $players.length
            );
        }),
        add: (item: CombinedPlayer) =>
            update((players) => {
                if (!item.count || item.count <= 0) {
                    item.count = 1;
                }
                players.push(item);
                return players;
            }),
        addFromState: (state: CreatureState) =>
            update((players) => {
                const item = state as Player;
                item.isPlayer = true;
                if (!item.count || item.count <= 0) {
                    item.count = 1;
                }
                players.push(item);
                return players;
            }),
        remove: (item: CombinedPlayer) =>
            update((players) => {
                players = players.filter((p) => p != item);
                return players;
            }),
        delete: (item: CombinedPlayer) =>
            update((players) => {
                players = players.filter((p) => p != item);
                return players;
            }),
        set: (item: CombinedPlayer, count: number) =>
            update((players) => {
                const player = players.find((p) => p == item);
                player!.count = count;
                return players;
            }),
        setLevel: (item: CombinedPlayer, level: number) =>
            update((players) => {
                const player = players.find((p) => p == item);
                player!.level = level;
                return players;
            }),

        switchParty: (items: Player[]) => {
            update((players) => {
                players = [...items, ...get(generics)];
                return players;
            });
        },
        empty: () => {
            return set([]);
        },
        toggleEnabled: (item: CombinedPlayer) =>
            update((players) => {
                const player = players.find((p) => p == item);
                player!.enabled = !player!.enabled;
                return players;
            })
    };
}

export const players = createPlayers();
