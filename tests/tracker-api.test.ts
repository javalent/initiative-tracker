/**
 * Tests for the new tracker store methods added in this PR:
 * - updateCreatureById (including bug fixes vs the old updateCreatureByName)
 * - removeCreatureById
 *
 * We seed the store via tracker.set([...]) (the raw Svelte store setter, no
 * side-effects) and read it back with get(tracker).
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";

// Mock obsidian before any imports that depend on it.
vi.mock("obsidian", () => ({
    Platform: { isMacOS: false },
    Events: class {
        on() {}
        off() {}
        trigger() {}
    },
    setIcon: vi.fn(),
    addIcon: vi.fn(),
}));

// Mock the encounter module: it imports Svelte components, which can't run in Node.
vi.mock("src/encounter", () => ({
    equivalent: vi.fn().mockReturnValue(false),
}));

import { tracker } from "src/tracker/stores/tracker";
import { Creature } from "src/utils/creature";
import { get } from "svelte/store";
import type { Condition } from "src/types/creatures";

// Minimal settings that satisfy all optional-chaining accesses in applyExternalUpdate.
const MOCK_SETTINGS: any = {
    statuses: [],
    additiveTemp: false,
    hpOverflow: "ignore",
    condense: false,
    clamp: false,
    autoStatus: false,
    descending: true,
    resolveTies: 0,
    rollHP: false,
};

beforeAll(() => {
    // trySave() calls app.workspace.trigger(...). Provide a stub before any
    // test calls updateAndSave (via updateCreatureById / removeCreatureById).
    (global as any).app = { workspace: { trigger: vi.fn() } };
    tracker.setData(MOCK_SETTINGS);
});

beforeEach(() => {
    tracker.set([]);
});

function makeCreature(overrides: Record<string, any> = {}): Creature {
    return new Creature({ name: "Goblin", hp: 20, id: "goblin-1", ...overrides });
}

// ---------------------------------------------------------------------------
// updateCreatureById
// ---------------------------------------------------------------------------

describe("tracker.updateCreatureById", () => {
    it("returns false when the id is not found", () => {
        expect(tracker.updateCreatureById("unknown-id", { hp: 5 })).toBe(false);
    });

    it("returns true when the creature is found", () => {
        tracker.set([makeCreature()]);
        expect(tracker.updateCreatureById("goblin-1", { hp: 5 })).toBe(true);
    });

    it("sets HP to an absolute value", () => {
        tracker.set([makeCreature()]);
        tracker.updateCreatureById("goblin-1", { hp: 7 });
        expect(get(tracker)[0].hp).toBe(7);
    });

    it("set_max_hp sets max HP to an exact value — was silently ignored before this PR", () => {
        tracker.set([makeCreature()]);
        tracker.updateCreatureById("goblin-1", { set_max_hp: 30 });
        const result = get(tracker)[0];
        expect(result.current_max).toBe(30);
        expect(result.max).toBe(30);
    });

    it("set_max_hp caps current HP when new max is lower than current HP", () => {
        const c = makeCreature({ hp: 20 });
        tracker.set([c]);
        tracker.updateCreatureById("goblin-1", { set_max_hp: 10 });
        const result = get(tracker)[0];
        expect(result.current_max).toBe(10);
        expect(result.hp).toBe(10);
    });

    it("remove_status removes a condition — was silently ignored before this PR", () => {
        const c = makeCreature();
        const cond: Condition = { name: "Poisoned", description: "", id: "cond-1" };
        c.addCondition(cond);
        tracker.set([c]);
        tracker.updateCreatureById("goblin-1", { remove_status: [cond] });
        expect(get(tracker)[0].status.size).toBe(0);
    });

    it("status adds a condition", () => {
        tracker.set([makeCreature()]);
        const cond: Condition = { name: "Stunned", description: "", id: "cond-2" };
        tracker.updateCreatureById("goblin-1", { status: [cond] });
        expect(get(tracker)[0].status.size).toBe(1);
    });

    it("current_ac sets only the current AC, leaving the base AC unchanged — was assigning the wrong field before this PR", () => {
        const c = makeCreature({ ac: 15 });
        c.current_ac = 15;
        tracker.set([c]);
        tracker.updateCreatureById("goblin-1", { current_ac: 12 });
        const result = get(tracker)[0];
        expect(result.current_ac).toBe(12);
        expect(result.ac).toBe(15);
    });
});

// ---------------------------------------------------------------------------
// removeCreatureById
// ---------------------------------------------------------------------------

describe("tracker.removeCreatureById", () => {
    it("returns false when the id is not found", () => {
        expect(tracker.removeCreatureById("unknown-id")).toBe(false);
    });

    it("returns true when the creature is found and removed", () => {
        tracker.set([makeCreature()]);
        expect(tracker.removeCreatureById("goblin-1")).toBe(true);
    });

    it("removes the creature from the store", () => {
        tracker.set([makeCreature()]);
        tracker.removeCreatureById("goblin-1");
        expect(get(tracker)).toHaveLength(0);
    });

    it("removes only the targeted creature when multiple are present", () => {
        const goblin = makeCreature();
        const orc = new Creature({ name: "Orc", hp: 30, id: "orc-1" });
        tracker.set([goblin, orc]);
        tracker.removeCreatureById("goblin-1");
        const remaining = get(tracker);
        expect(remaining).toHaveLength(1);
        expect(remaining[0].id).toBe("orc-1");
    });
});
