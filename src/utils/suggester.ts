import {
	App,
	FuzzyMatch,
	FuzzySuggestModal,
	Scope,
	SuggestModal,
	TextComponent,
	TFile,
} from "obsidian";
import { createPopper, Instance as PopperInstance } from "@popperjs/core";

import { BESTIARY } from "./srd-bestiary";
import type { SRDMonster } from "@types";
import type InitiativeTracker from "src/main";
import type { Creature } from "./creature";

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
			cls: "suggestion-container",
		});

		this.contentEl = this.suggestEl.createDiv("suggestion");

		this.suggester = new Suggester(this, this.contentEl, this.scope);

		this.scope.register([], "Escape", this.close.bind(this));

		this.inputEl.addEventListener("input", this.onInputChanged.bind(this));
		/* this.inputEl.addEventListener("focus", this.onInputChanged.bind(this)); */
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
						offset: [0, 10],
					},
				},
				{
					name: "flip",
					options: {
						allowedAutoPlacements: ["top-start", "bottom-start"],
					},
				},
			],
		});
	}

	close(): void {
		// TODO: Figure out a better way to do this. Idea from Periodic Notes plugin
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(<any>this.app).keymap.popScope(this.scope);

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
			cls: "suggestion-content icon",
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
			text: path,
		});
	}
	getItems() {
		return this.app.vault.getMarkdownFiles();
	}
}

export class SRDMonsterSuggestionModal extends SuggestionModal<
	Creature | SRDMonster
> {
	creature: Creature | SRDMonster;
	constructor(public plugin: InitiativeTracker, inputEl: HTMLInputElement) {
		super(plugin.app, inputEl);
	}
	getItems() {
		return [...this.plugin.players, ...this.plugin.bestiary];
	}
	getItemText(item: Creature | SRDMonster) {
		return item.name;
	}
	onChooseItem(item: Creature | SRDMonster) {
		this.inputEl.value = item.name;
		this.creature = item;
	}
	selectSuggestion({ item }: FuzzyMatch<Creature | SRDMonster>) {
		this.inputEl.value = item.name;
		this.creature = item;

		this.onClose();
		this.close();
	}
	renderSuggestion(
		result: FuzzyMatch<Creature | SRDMonster>,
		el: HTMLElement
	) {
		let { item, match: matches } = result || {};

		let content = el.createDiv({
			cls: "suggestion-content icon",
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
			text: item.source,
		});
	}
}
