import type { Component } from "obsidian";
import type { Creature } from "../src/utils/creature";

interface DiceRollerAPI {
    async getRoller(roll: string, source?: string): Promise<BasicRoller>;
    getRollerSync(roll: string, source?: string): BasicRoller;
}

interface BasicRoller {
    result: any;
    roll(): Promise<any>;
    rollSync(): number;
}

interface StackRoller extends BasicRoller{
}

interface StatblockAPI {
    render(creature: Creature, statblockEl: HTMLDivElement, display: string): Component;
    saveMonsters(homebrew: import(".").HomebrewCreature[]): unknown;
    data: any;
    settings: any;
}

interface LeafletAPI {
    openInitiativeView(pcs: import("../src/utils/creature").Creature[], npcs: import("../src/utils/creature").Creature[]): unknown;
    markerIcons: MarkerIcon[];
    data: any;
    settings: any;
}

interface MarkerIcon {
    html: string;
    type: string;

}