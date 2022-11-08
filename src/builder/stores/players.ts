import { derived, get, writable } from "svelte/store";
import type { CreatureState } from "../../../@types";
import { EXPERIENCE_PER_LEVEL } from "../constants";

export const playerCount = writable(0);

interface Player extends Partial<CreatureState> {
    level: number;
    name: string;
    isPlayer: true;
    enabled: boolean;
    count: number;
}
interface GenericPlayer extends Partial<CreatureState> {
    level: number;
    isPlayer: false;
    enabled: boolean;
    count: number;
}
type CombinedPlayer = Player | GenericPlayer;

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
        thresholds: derived(store, ($players) => {
            const threshold = {
                Easy: 0,
                Medium: 0,
                Hard: 0,
                Deadly: 0,
                Daily: 0
            };
            for (const player of $players) {
                if (!player.level) continue;
                if (!player.enabled) continue;
                const level = player.level > 20 ? 20 : player.level;
                const thresholds = EXPERIENCE_PER_LEVEL[level];
                if (!thresholds) continue;

                threshold.Easy += thresholds.easy * player.count;
                threshold.Medium += thresholds.medium * player.count;
                threshold.Hard += thresholds.hard * player.count;
                threshold.Deadly += thresholds.deadly * player.count;
                threshold.Daily += thresholds.daily * player.count;
            }
            return threshold;
        }),
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
