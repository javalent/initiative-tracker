import { describe, it, expect, vi } from "vitest";

vi.mock("obsidian", () => ({
    Platform: { isMacOS: false },
    setIcon: vi.fn(),
    addIcon: vi.fn(),
}));

import { Creature } from "src/utils/creature";
import type { Condition } from "src/types/creatures";

const poisoned: Condition = { name: "Poisoned", description: "", id: "cond-poisoned" };
const stunned: Condition = { name: "Stunned", description: "", id: "cond-stunned" };

describe("Creature.addCondition", () => {
    it("adds a condition", () => {
        const c = new Creature({ name: "Goblin", hp: 10 });
        c.addCondition(poisoned);
        expect(c.status.size).toBe(1);
    });

    it("deduplicates conditions with the same name and no amount", () => {
        const c = new Creature({ name: "Goblin", hp: 10 });
        c.addCondition(poisoned);
        c.addCondition({ ...poisoned, id: "cond-poisoned-2" });
        expect(c.status.size).toBe(1);
    });

    it("allows two conditions with the same name but different amounts", () => {
        const c = new Creature({ name: "Goblin", hp: 10 });
        const clumsy1: Condition = { name: "Clumsy", description: "", id: "id-1", hasAmount: true, startingAmount: 1, amount: 1 };
        const clumsy2: Condition = { name: "Clumsy", description: "", id: "id-2", hasAmount: true, startingAmount: 2, amount: 2 };
        c.addCondition(clumsy1);
        c.addCondition(clumsy2);
        expect(c.status.size).toBe(2);
    });
});

describe("Creature.removeCondition", () => {
    it("removes a condition by id", () => {
        const c = new Creature({ name: "Goblin", hp: 10 });
        c.addCondition(poisoned);
        c.removeCondition(poisoned);
        expect(c.status.size).toBe(0);
    });

    it("does not remove a condition matched only by name when ids differ", () => {
        const c = new Creature({ name: "Goblin", hp: 10 });
        c.addCondition(poisoned);
        c.removeCondition({ ...poisoned, id: "wrong-id" });
        expect(c.status.size).toBe(1);
    });

    it("removes one condition without affecting others", () => {
        const c = new Creature({ name: "Goblin", hp: 10 });
        c.addCondition(poisoned);
        c.addCondition(stunned);
        c.removeCondition(poisoned);
        expect(c.status.size).toBe(1);
        expect([...c.status][0].name).toBe("Stunned");
    });
});

describe("Creature.toJSON", () => {
    it("serializes status as an array of condition names", () => {
        const c = new Creature({ name: "Goblin", hp: 10 });
        c.addCondition(poisoned);
        c.addCondition(stunned);
        expect(c.toJSON().status).toEqual(["Poisoned", "Stunned"]);
    });

    it("returns currentHP and currentMaxHP reflecting construction values", () => {
        const c = new Creature({ name: "Goblin", hp: 15 });
        const json = c.toJSON();
        expect(json.currentHP).toBe(15);
        expect(json.currentMaxHP).toBe(15);
    });
});
