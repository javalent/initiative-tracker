import type { FuzzyMatch } from "obsidian";
import { FuzzyInputSuggest } from "obsidian-utilities";

import type { HomebrewCreature } from "src/types/creatures";
import type { SRDMonster } from "src/types/creatures";
import type { Creature } from "./creature";

export class SRDMonsterSuggestionModal extends FuzzyInputSuggest<
    HomebrewCreature | SRDMonster
> {
    renderNote(
        noteEL: HTMLElement,
        result: FuzzyMatch<HomebrewCreature | SRDMonster>
    ): void {
        noteEL.setText([result.item.source].flat().join(", "));
    }
    renderTitle(
        titleEl: HTMLElement,
        result: FuzzyMatch<HomebrewCreature | SRDMonster>
    ): void {
        this.renderMatches(titleEl, result.item.name, result.match.matches);
    }
    getItemText(item: HomebrewCreature | SRDMonster) {
        return item.name;
    }
}
export class ConditionSuggestionModal extends FuzzyInputSuggest<string> {
    renderNote(noteEL: HTMLElement, result: FuzzyMatch<string>): void {}
    renderTitle(titleEl: HTMLElement, result: FuzzyMatch<string>): void {
        this.renderMatches(titleEl, result.item, result.match.matches);
    }
    getItemText(item: string) {
        return item;
    }
}

export class PlayerSuggestionModal extends FuzzyInputSuggest<Creature> {
    renderNote(noteEL: HTMLElement, result: FuzzyMatch<Creature>): void {}
    renderTitle(titleEl: HTMLElement, result: FuzzyMatch<Creature>): void {
        this.renderMatches(titleEl, result.item.name, result.match.matches);
    }
    getItemText(item: Creature) {
        return item.name;
    }
}
