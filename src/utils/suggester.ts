import {
    App,
    CachedMetadata,
    FuzzyMatch,
    FuzzySuggestModal,
    Scope,
    Setting,
    SuggestModal,
    TextComponent,
    TFile,
    TFolder
} from "obsidian";
import { createPopper, Instance as PopperInstance } from "@popperjs/core";

import { Conditions } from "./conditions";

import type {
    HomebrewCreature,
    SRDMonster,
    Condition,
    Party
} from "../../@types";
import type InitiativeTracker from "src/main";

class Suggester<T> {
    owner: SuggestModal<T>;
    items: T[];
    suggestions: HTMLDivElement[];
    selectedItem: number;
    containerEl: HTMLElement;
    constructor(
        owner: SuggestModal<T>,
        containerEl: HTMLElement,
        scope: Scope
    ) {
        this.containerEl = containerEl;
        this.owner = owner;
        containerEl.on(
            "click",
            ".suggestion-item",
            this.onSuggestionClick.bind(this)
        );
        containerEl.on(
            "mousemove",
            ".suggestion-item",
            this.onSuggestionMouseover.bind(this)
        );

        scope.register([], "ArrowUp", () => {
            this.setSelectedItem(this.selectedItem - 1, true);
            return false;
        });

        scope.register([], "ArrowDown", () => {
            this.setSelectedItem(this.selectedItem + 1, true);
            return false;
        });

        scope.register([], "Enter", (evt) => {
            this.useSelectedItem(evt);
            return false;
        });

        scope.register([], "Tab", (evt) => {
            this.useSelectedItem(evt);
            return false;
        });
    }
    chooseSuggestion(evt: KeyboardEvent) {
        if (!this.items || !this.items.length) return;
        const currentValue = this.items[this.selectedItem];
        if (currentValue) {
            this.owner.selectSuggestion(currentValue, evt);
        }
    }
    onSuggestionClick(event: MouseEvent, el: HTMLDivElement): void {
        event.preventDefault();
        if (!this.suggestions || !this.suggestions.length) return;

        const item = this.suggestions.indexOf(el);
        this.setSelectedItem(item, false);
        this.useSelectedItem(event);
    }

    onSuggestionMouseover(event: MouseEvent, el: HTMLDivElement): void {
        if (!this.suggestions || !this.suggestions.length) return;
        const item = this.suggestions.indexOf(el);
        this.setSelectedItem(item, false);
    }
    empty() {
        this.containerEl.empty();
    }
    setSuggestions(items: T[]) {
        this.containerEl.empty();
        const els: HTMLDivElement[] = [];

        items.forEach((item) => {
            const suggestionEl = this.containerEl.createDiv("suggestion-item");
            this.owner.renderSuggestion(item, suggestionEl);
            els.push(suggestionEl);
        });
        this.items = items;
        this.suggestions = els;
        this.setSelectedItem(0, false);
    }
    useSelectedItem(event: MouseEvent | KeyboardEvent) {
        if (!this.items || !this.items.length) return;

        const currentValue = this.items[this.selectedItem];

        if (currentValue) {
            this.owner.selectSuggestion(currentValue, event);
        }
    }
    wrap(value: number, size: number): number {
        return ((value % size) + size) % size;
    }
    setSelectedItem(index: number, scroll: boolean) {
        const nIndex = this.wrap(index, this.suggestions.length);
        const prev = this.suggestions[this.selectedItem];
        const next = this.suggestions[nIndex];

        if (prev) prev.removeClass("is-selected");
        if (next) next.addClass("is-selected");

        this.selectedItem = nIndex;

        if (scroll) {
            next.scrollIntoView(false);
        }
    }
}

abstract class SuggestionModal<T> extends FuzzySuggestModal<T> {
    items: T[] = [];
    suggestions: HTMLDivElement[];
    popper: PopperInstance;
    scope: Scope = new Scope();
    suggester: Suggester<FuzzyMatch<T>>;
    suggestEl: HTMLDivElement;
    promptEl: HTMLDivElement;
    emptyStateText: string = "No match found";
    limit: number = 25;
    constructor(app: App, inputEl: HTMLInputElement) {
        super(app);
        this.inputEl = inputEl;

        this.suggestEl = createDiv({
            attr: { style: "min-width: 475px;" },
            cls: "suggestion-container"
        });

        this.contentEl = this.suggestEl.createDiv("suggestion");

        this.suggester = new Suggester(this, this.contentEl, this.scope);

        this.scope.register([], "Escape", this.close.bind(this));

        this.inputEl.addEventListener("input", this.onInputChanged.bind(this));
        this.inputEl.addEventListener("focus", this.onInputChanged.bind(this));
        this.inputEl.addEventListener("blur", this.close.bind(this));
        this.suggestEl.on(
            "mousedown",
            ".suggestion-container",
            (event: MouseEvent) => {
                event.preventDefault();
            }
        );
    }
    empty() {
        this.suggester.empty();
    }
    onInputChanged(): void {
        const inputStr = this.modifyInput(this.inputEl.value);
        const suggestions = this.getSuggestions(inputStr);

        if (suggestions.length > 0) {
            this.suggester.setSuggestions(suggestions.slice(0, this.limit));
        } else {
            this.onNoSuggestion();
        }
        this.open();
    }

    modifyInput(input: string): string {
        return input;
    }
    onNoSuggestion() {
        this.empty();
        this.renderSuggestion(
            null,
            this.contentEl.createDiv("suggestion-item")
        );
    }
    open(): void {
        // TODO: Figure out a better way to do this. Idea from Periodic Notes plugin
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (<any>this.app).keymap.pushScope(this.scope);

        document.body.appendChild(this.suggestEl);
        this.popper = createPopper(this.inputEl, this.suggestEl, {
            placement: "auto-start",
            modifiers: [
                {
                    name: "offset",
                    options: {
                        offset: [0, 10]
                    }
                },
                {
                    name: "flip",
                    options: {
                        allowedAutoPlacements: ["top-start", "bottom-start"]
                    }
                }
            ]
        });
    }

    close(): void {
        this.app.keymap.popScope(this.scope);

        this.suggester.setSuggestions([]);
        if (this.popper) {
            this.popper.destroy();
        }

        this.suggestEl.detach();
    }
    createPrompt(prompts: HTMLSpanElement[]) {
        if (!this.promptEl)
            this.promptEl = this.suggestEl.createDiv("prompt-instructions");
        let prompt = this.promptEl.createDiv("prompt-instruction");
        for (let p of prompts) {
            prompt.appendChild(p);
        }
    }
    abstract onChooseItem(item: T, evt: MouseEvent | KeyboardEvent): void;
    abstract getItemText(arg: T): string;
    abstract getItems(): T[];
}

export class FileSuggestionModal extends SuggestionModal<TFile> {
    file: TFile;
    text: TextComponent;
    files = this.app.vault.getMarkdownFiles();
    constructor(app: App, input: TextComponent) {
        super(app, input.inputEl);
        this.text = input;

        this.createPrompts();

        this.inputEl.addEventListener("input", this.getItem.bind(this));
    }
    createPrompts() {}
    getItem() {
        const v = this.inputEl.value,
            file = this.items.find((file) => file.name === v.trim());
        if (file == this.file) return;
        this.file = file;
        if (this.items) this.onInputChanged();
    }
    getItemText(item: TFile) {
        return item.name;
    }
    onChooseItem(item: TFile) {
        this.text.setValue(item.name);
        this.file = item;
    }
    selectSuggestion({ item }: FuzzyMatch<TFile>) {
        this.text.setValue(item.basename);
        this.file = item;

        this.onClose();
        this.close();
    }
    renderSuggestion(result: FuzzyMatch<TFile>, el: HTMLElement) {
        let { item, match: matches } = result || {};
        let content = el.createDiv({
            cls: "suggestion-content icon"
        });
        if (!item) {
            this.suggester.selectedItem = null;
            content.setText(this.emptyStateText);
            content.parentElement.addClass("is-selected");
            return;
        }

        const matchElements = matches.matches.map((m) => {
            return createSpan("suggestion-highlight");
        });
        for (let i = 0; i < item.basename.length; i++) {
            let match = matches.matches.find((m) => m[0] === i);
            if (match) {
                let element = matchElements[matches.matches.indexOf(match)];
                content.appendChild(element);
                element.appendText(item.basename.substring(match[0], match[1]));

                i += match[1] - match[0] - 1;
                continue;
            }

            content.appendText(item.basename[i]);
        }

        let path = item.path.split("/").slice(0, -1).join("/");
        if (path.length) {
            path += "/";
        }

        el.createDiv({
            cls: "suggestion-note",
            text: path
        });
    }
    getItems() {
        return this.files;
    }
}

export class SRDMonsterSuggestionModal extends SuggestionModal<
    HomebrewCreature | SRDMonster
> {
    creature: HomebrewCreature | SRDMonster;
    creatures: (HomebrewCreature | SRDMonster)[];
    constructor(public plugin: InitiativeTracker, inputEl: HTMLInputElement) {
        super(plugin.app, inputEl);
        this.creatures = [...this.plugin.data.players, ...this.plugin.bestiary];
        /* this.onInputChanged(); */
    }
    getItems() {
        return this.creatures;
    }
    getItemText(item: HomebrewCreature | SRDMonster) {
        return item.name;
    }
    onChooseItem(item: HomebrewCreature | SRDMonster) {
        this.inputEl.value = item.name;
        this.creature = item;
        this.onClose();
        this.close();
    }
    selectSuggestion({ item }: FuzzyMatch<HomebrewCreature | SRDMonster>) {
        this.inputEl.value = item.name;
        this.creature = item;

        this.onClose();
        this.close();
    }
    renderSuggestion(
        result: FuzzyMatch<HomebrewCreature | SRDMonster>,
        el: HTMLElement
    ) {
        let { item, match: matches } = result || {};

        let content = el.createDiv({
            cls: "suggestion-content icon"
        });
        if (!item) {
            this.suggester.selectedItem = null;
            content.setText(this.emptyStateText);
            content.parentElement.addClass("is-selected");
            return;
        }

        const matchElements = matches.matches.map((m) => {
            return createSpan("suggestion-highlight");
        });
        for (let i = 0; i < item.name.length; i++) {
            let match = matches.matches.find((m) => m[0] === i);
            if (match) {
                let element = matchElements[matches.matches.indexOf(match)];
                content.appendChild(element);
                element.appendText(item.name.substring(match[0], match[1]));

                i += match[1] - match[0] - 1;
                continue;
            }

            content.appendText(item.name[i]);
        }
        el.createDiv({
            cls: "suggestion-note",
            text: [item.source].flat().join(", ")
        });
    }
}

abstract class ElementSuggestionModal<T> extends FuzzySuggestModal<T> {
    items: T[] = [];
    suggestions: HTMLDivElement[];
    scope: Scope = new Scope();
    suggester: Suggester<FuzzyMatch<T>>;
    suggestEl: HTMLDivElement;
    promptEl: HTMLDivElement;
    emptyStateText: string = "No match found";
    limit: number = Infinity;
    filteredItems: FuzzyMatch<T>[] = [];
    constructor(
        app: App,
        inputEl: HTMLInputElement,
        suggestEl: HTMLDivElement
    ) {
        super(app);
        this.inputEl = inputEl;

        this.suggestEl = suggestEl.createDiv(/* "suggestion-container" */);

        this.contentEl = this.suggestEl.createDiv(/* "suggestion" */);

        this.suggester = new Suggester(this, this.contentEl, this.scope);

        this.scope.register([], "Escape", () => this.close.bind(this));

        this.inputEl.addEventListener("input", this._onInputChanged.bind(this));
        this.inputEl.addEventListener("focus", this._onInputChanged.bind(this));
        this.inputEl.addEventListener("blur", this.close.bind(this));
        this.suggestEl.on(
            "mousedown",
            ".suggestion-container",
            (event: MouseEvent) => {
                event.preventDefault();
            }
        );
    }
    empty() {
        this.suggester.empty();
    }
    _onInputChanged(): void {
        const inputStr = this.inputEl.value;
        this.filteredItems = this.getSuggestions(inputStr);
        if (this.filteredItems.length > 0) {
            this.suggester.setSuggestions(
                this.filteredItems.slice(0, this.limit)
            );
        } else {
            this.onNoSuggestion();
        }
        this.onInputChanged();
        this.open();
    }
    onInputChanged(): void {}
    onNoSuggestion() {
        this.empty();
        this.renderSuggestion(
            null,
            this.contentEl.createDiv(/* "suggestion-item" */)
        );
    }
    open(): void {}

    close(): void {}
    createPrompt(prompts: HTMLSpanElement[]) {
        if (!this.promptEl)
            this.promptEl = this.suggestEl.createDiv("prompt-instructions");
        let prompt = this.promptEl.createDiv("prompt-instruction");
        for (let p of prompts) {
            prompt.appendChild(p);
        }
    }
    abstract onChooseItem(item: T, evt: MouseEvent | KeyboardEvent): void;
    abstract getItemText(arg: T): string;
    abstract getItems(): T[];
}

export class HomebrewMonsterSuggestionModal extends ElementSuggestionModal<HomebrewCreature> {
    creature: HomebrewCreature;
    homebrew: HomebrewCreature[];
    constructor(
        public plugin: InitiativeTracker,
        inputEl: HTMLInputElement,
        el: HTMLDivElement
    ) {
        super(plugin.app, inputEl, el);
        this.homebrew = this.plugin.homebrew;
        this._onInputChanged();
    }
    getItems() {
        return this.homebrew;
    }
    getItemText(item: HomebrewCreature) {
        return item.name;
    }

    onChooseItem(item: HomebrewCreature) {
        this.inputEl.value = item.name;
        this.creature = item;
    }
    selectSuggestion({ item }: FuzzyMatch<HomebrewCreature>) {
        return;
    }
    renderSuggestion(result: FuzzyMatch<HomebrewCreature>, el: HTMLElement) {
        let { item, match: matches } = result || {};
        let content = new Setting(el); /* el.createDiv({
            cls: "suggestion-content"
        }); */
        if (!item) {
            content.nameEl.setText(this.emptyStateText);
            /* content.parentElement.addClass("is-selected"); */
            return;
        }

        const matchElements = matches.matches.map((m) => {
            return createSpan("suggestion-highlight");
        });
        for (let i = 0; i < item.name.length; i++) {
            let match = matches.matches.find((m) => m[0] === i);
            if (match) {
                let element = matchElements[matches.matches.indexOf(match)];
                content.nameEl.appendChild(element);
                element.appendText(item.name.substring(match[0], match[1]));

                i += match[1] - match[0] - 1;
                continue;
            }

            content.nameEl.appendText(item.name[i]);
        }

        content.setDesc([item.source ?? ""].flat().join(", "));
        content.addExtraButton((b) => {
            b.setIcon("pencil")
                .setTooltip("Edit")
                .onClick(() => this.onEditItem(item));
        });
        content.addExtraButton((b) => {
            b.setIcon("trash")
                .setTooltip("Delete")
                .onClick(() => this.onRemoveItem(item));
        });
    }
    onEditItem(item: HomebrewCreature) {}
    onRemoveItem(item: HomebrewCreature) {}
}

export class ConditionSuggestionModal extends SuggestionModal<Condition> {
    items: Condition[] = [];
    condition: Condition;
    constructor(public plugin: InitiativeTracker, inputEl: HTMLInputElement) {
        super(plugin.app, inputEl);
        this.items = this.plugin.data.statuses;
        this.suggestEl.style.removeProperty("min-width");
        this.onInputChanged();
    }
    getItemText(item: Condition) {
        return item.name;
    }
    getItems() {
        return this.items;
    }
    onChooseItem(item: Condition) {
        this.inputEl.value = item.name;
        this.condition = item;
    }
    onNoSuggestion() {
        this.empty();
        this.renderSuggestion(
            null,
            this.contentEl.createDiv("suggestion-item")
        );
        this.condition = null;
    }
    selectSuggestion({ item }: FuzzyMatch<Condition>) {
        if (this.condition !== null) {
            this.inputEl.value = item.name;
            this.condition = item;
        } else {
            this.condition = {
                name: this.inputEl.value,
                description: ""
            };
        }

        this.onClose();
        this.close();
    }
    renderSuggestion(result: FuzzyMatch<Condition>, el: HTMLElement) {
        let { item, match: matches } = result || {};
        let content = new Setting(el); /* el.createDiv({
            cls: "suggestion-content"
        }); */
        if (!item) {
            content.nameEl.setText(this.emptyStateText);
            this.condition = null;
            return;
        }

        const matchElements = matches.matches.map((m) => {
            return createSpan("suggestion-highlight");
        });
        for (let i = 0; i < item.name.length; i++) {
            let match = matches.matches.find((m) => m[0] === i);
            if (match) {
                let element = matchElements[matches.matches.indexOf(match)];
                content.nameEl.appendChild(element);
                element.appendText(item.name.substring(match[0], match[1]));

                i += match[1] - match[0] - 1;
                continue;
            }

            content.nameEl.appendText(item.name[i]);
        }
    }
}

export class PlayerSuggestionModal extends SuggestionModal<HomebrewCreature> {
    player: HomebrewCreature;
    text: TextComponent;
    items = this.plugin.data.players;
    constructor(
        public plugin: InitiativeTracker,
        input: TextComponent,
        public party: Party
    ) {
        super(plugin.app, input.inputEl);
        this.text = input;

        this.createPrompts();

        this.inputEl.addEventListener("input", this.getItem.bind(this));
        this.inputEl.addEventListener("focus", this.onInputChanged.bind(this));
    }
    createPrompts() {}
    getItem() {
        const v = this.inputEl.value,
            file = this.items.find((file) => file.name === v.trim());
        if (file == this.player) return;
        this.player = file;
        if (this.items) this.onInputChanged();
    }
    getItemText(item: HomebrewCreature) {
        return item.name;
    }
    onChooseItem(item: HomebrewCreature) {
        this.text.setValue(item.name);
        this.player = item;
    }
    selectSuggestion({ item }: FuzzyMatch<HomebrewCreature>) {
        this.text.setValue(item.name);
        this.player = item;

        this.onClose();
        this.close();
    }
    renderSuggestion(result: FuzzyMatch<HomebrewCreature>, el: HTMLElement) {
        let { item, match: matches } = result || {};
        let content = el.createDiv({
            cls: "suggestion-content icon"
        });
        if (!item) {
            this.suggester.selectedItem = null;
            content.setText(this.emptyStateText);
            content.parentElement.addClass("is-selected");
            return;
        }

        const matchElements = matches.matches.map((m) => {
            return createSpan("suggestion-highlight");
        });
        for (let i = 0; i < item.name.length; i++) {
            let match = matches.matches.find((m) => m[0] === i);
            if (match) {
                let element = matchElements[matches.matches.indexOf(match)];
                content.appendChild(element);
                element.appendText(item.name.substring(match[0], match[1]));

                i += match[1] - match[0] - 1;
                continue;
            }

            content.appendText(item.name[i]);
        }
    }
    getItems() {
        return this.items.filter((p) => !this.party.players.includes(p.name));
    }
}

export class FolderSuggestionModal extends SuggestionModal<TFolder> {
    text: TextComponent;
    cache: CachedMetadata;
    folders: TFolder[];
    folder: TFolder;
    constructor(app: App, input: TextComponent, items: TFolder[]) {
        super(app, input.inputEl);
        this.folders = [...items];
        this.text = input;

        this.inputEl.addEventListener("input", () => this.getFolder());
    }
    getFolder() {
        const v = this.inputEl.value,
            folder = this.app.vault.getAbstractFileByPath(v);
        if (folder == this.folder) return;
        if (!(folder instanceof TFolder)) return;
        this.folder = folder;

        this.onInputChanged();
    }
    getItemText(item: TFolder) {
        return item.path;
    }
    onChooseItem(item: TFolder) {
        this.text.setValue(item.path);
        this.folder = item;
    }
    selectSuggestion({ item }: FuzzyMatch<TFolder>) {
        let link = item.path;

        this.text.setValue(link);
        this.onClose();

        this.close();
    }
    renderSuggestion(result: FuzzyMatch<TFolder>, el: HTMLElement) {
        let { item, match: matches } = result || {};
        let content = el.createDiv({
            cls: "suggestion-content"
        });
        if (!item) {
            content.setText(this.emptyStateText);
            content.parentElement.addClass("is-selected");
            return;
        }

        let pathLength = item.path.length - item.name.length;
        const matchElements = matches.matches.map((m) => {
            return createSpan("suggestion-highlight");
        });
        for (let i = pathLength; i < item.path.length; i++) {
            let match = matches.matches.find((m) => m[0] === i);
            if (match) {
                let element = matchElements[matches.matches.indexOf(match)];
                content.appendChild(element);
                element.appendText(item.path.substring(match[0], match[1]));

                i += match[1] - match[0] - 1;
                continue;
            }

            content.appendText(item.path[i]);
        }
        el.createDiv({
            cls: "suggestion-note",
            text: item.path
        });
    }

    getItems() {
        return this.folders;
    }
}
