import {
    ButtonComponent,
    ExtraButtonComponent,
    Modal,
    Notice,
    PluginSettingTab,
    setIcon,
    Setting,
    TextComponent
} from "obsidian";

import type InitiativeTracker from "./main";

import {
    ImportEntitiesFromXml,
    ImportEntitiesFromImprovedInitiative
} from "src/import";

import {
    FileSuggestionModal,
    HomebrewMonsterSuggestionModal,
    SRDMonsterSuggestionModal
} from "./utils/suggester";
import { AC, DEFAULT_UNDEFINED, EDIT, HP, INITIATIVE } from "./utils";
import type { HomebrewCreature, InputValidate } from "@types";
import { Creature } from "./utils/creature";

export default class InitiativeTrackerSettings extends PluginSettingTab {
    constructor(private plugin: InitiativeTracker) {
        super(plugin.app, plugin);
    }
    async display(): Promise<void> {
        try {
            let { containerEl } = this;

            containerEl.empty();
            containerEl.addClass("initiative-tracker-settings");

            containerEl.createEl("h2", { text: "Initiative Tracker Settings" });
            const additionalContainer = containerEl.createDiv(
                "initiative-tracker-additional-container"
            );

            this._displayPlayers(additionalContainer);

            if (this.plugin.app.plugins.plugins["obsidian-5e-statblocks"]) {
                const syncEl = containerEl.createDiv("initiative-sync");

                new Setting(syncEl)
                    .setName("Sync Monsters from 5e Statblocks")
                    .setDesc(
                        "Homebrew monsters saved to the 5e Statblocks plugin will be available in the quick-add."
                    )
                    .addToggle((t) => {
                        t.setValue(this.plugin.data.sync);
                        t.onChange(async (v) => {
                            this.plugin.data.sync = v;

                            await this.plugin.saveSettings();
                            this.display();
                        });
                    });
                if (this.plugin.data.sync) {
                    const synced = new Setting(syncEl).setDesc(
                        `${this.plugin.homebrew.length} monsters synced.`
                    );
                    synced.settingEl.addClass("initiative-synced");
                    setIcon(synced.nameEl, "check-in-circle");
                    synced.nameEl.appendChild(createSpan({ text: "Synced" }));
                }
            }

            this._displayImports(containerEl);
            this._displayHomebrew(containerEl);
        } catch (e) {
            new Notice(
                "There was an error displaying the settings tab for Obsidian Initiative Tracker."
            );
        }
    }
    private _displayImports(containerEl: HTMLElement) {
        const importSettingsContainer = containerEl.createDiv(
            "initiative-tracker-additional-container"
        );

        const importSetting = new Setting(importSettingsContainer)
            .setName("Import Monsters")
            .setDesc(
                "Import monsters from monster files. Only import data that you own."
            );

        const importAdditional =
            importSettingsContainer.createDiv("additional");
        const importAppFile = new Setting(importAdditional)
            .setName("Import DnDAppFile")
            .setDesc("Only import content that you own.");
        const inputAppFile = createEl("input", {
            attr: {
                type: "file",
                name: "dndappfile",
                accept: ".xml"
            }
        });

        inputAppFile.onchange = async () => {
            const { files } = inputAppFile;
            if (!files.length) return;
            try {
                const importedMonsters = await ImportEntitiesFromXml(
                    ...Array.from(files)
                );
                try {
                    await this.plugin.saveMonsters(importedMonsters);
                    new Notice(
                        `Successfully imported ${importedMonsters.length} monsters.`
                    );
                } catch (e) {
                    new Notice(
                        `There was an issue importing the file${
                            files.length > 1 ? "s" : ""
                        }.`
                    );
                }
                this.display();
            } catch (e) {}
        };

        importAppFile.addButton((b) => {
            b.setButtonText("Choose File").setTooltip("Import DnDAppFile Data");
            b.buttonEl.addClass("initiative-tracker-file-upload");
            b.buttonEl.appendChild(inputAppFile);
            b.onClick(() => inputAppFile.click());
        });

        const importImprovedInitiative = new Setting(importAdditional)
            .setName("Import Improved Initiative Data")
            .setDesc("Only import content that you own.");
        const inputImprovedInitiative = createEl("input", {
            attr: {
                type: "file",
                name: "dndappfile",
                accept: ".json"
            }
        });

        inputImprovedInitiative.onchange = async () => {
            const { files } = inputImprovedInitiative;
            if (!files.length) return;
            try {
                const importedMonsters =
                    await ImportEntitiesFromImprovedInitiative(
                        ...Array.from(files)
                    );

                try {
                    await this.plugin.saveMonsters(
                        Array.from(importedMonsters.values())
                    );
                    new Notice(
                        `Successfully imported ${importedMonsters.size} monsters.`
                    );
                } catch (e) {
                    new Notice(
                        `There was an issue importing the file${
                            files.length > 1 ? "s" : ""
                        }.`
                    );
                }
                this.display();
            } catch (e) {}
        };

        importImprovedInitiative.addButton((b) => {
            b.setButtonText("Choose File").setTooltip(
                "Import Improved Initiative Data"
            );
            b.buttonEl.addClass("initiative-tracker-file-upload");
            b.buttonEl.appendChild(inputImprovedInitiative);
            b.onClick(() => inputImprovedInitiative.click());
        });
    }
    private _displayHomebrew(containerEl: HTMLElement) {
        const additionalContainer = containerEl.createDiv(
            "initiative-tracker-additional-container initiative-tracker-monsters"
        );
        new Setting(additionalContainer)
            .setName("Add New Creature")
            .addButton((button: ButtonComponent): ButtonComponent => {
                let b = button
                    .setTooltip("Add Creature")
                    .setButtonText("+")
                    .onClick(async () => {
                        const modal = new NewCreatureModal(this.plugin);
                        modal.open();
                        modal.onClose = async () => {
                            if (!modal.saved) return;

                            this.plugin.data.homebrew.push({
                                ...modal.creature,
                                source: "Homebrew"
                            });
                            await this.plugin.saveSettings();

                            this.display();
                        };
                    });

                return b;
            });

        let monsterFilter: TextComponent;
        const filters = additionalContainer.createDiv(
            "initiative-tracker-monster-filter"
        );
        const searchMonsters = new Setting(filters)
            .setName("Homebrew Monsters")
            .addSearch((t) => {
                t.setPlaceholder("Filter Monsters");
                monsterFilter = t;
            });

        const additional = additionalContainer.createDiv("additional");
        if (!this.plugin.data.homebrew.length) {
            additional
                .createDiv({
                    attr: {
                        style: "display: flex; justify-content: center; padding-bottom: 18px;"
                    }
                })
                .createSpan({
                    text: "No saved monsters! Create one to see it here."
                });
            return;
        }

        let suggester = new HomebrewMonsterSuggestionModal(
            this.plugin,
            monsterFilter.inputEl,
            additional
        );

        searchMonsters.setDesc(
            `Manage homebrew monsters. Currently: ${
                suggester.getItems().length
            } monsters.`
        );

        suggester.onRemoveItem = async (monster) => {
            try {
                await this.plugin.deleteMonster(monster.name);
            } catch (e) {
                new Notice(
                    `There was an error deleting the monster:${
                        `\n\n` + e.message
                    }`
                );
            }
            this.display();
        };
        suggester.onInputChanged = () =>
            searchMonsters.setDesc(
                `Manage homebrew monsters. Currently: ${suggester.filteredItems.length} monsters.`
            );
    }
    private _displayPlayers(additionalContainer: HTMLDivElement) {
        const additional = additionalContainer.createDiv("additional");
        new Setting(additional)
            .setName("Add New Player")
            .setDesc("These players will always be added to new encounters.")
            .addButton((button: ButtonComponent): ButtonComponent => {
                let b = button
                    .setTooltip("Add Player")
                    .setButtonText("+")
                    .onClick(async () => {
                        const modal = new NewPlayerModal(this.plugin);
                        modal.open();
                        modal.onClose = async () => {
                            if (!modal.saved) return;

                            this.plugin.data.players.push({
                                ...modal.player,
                                player: true
                            });
                            await this.plugin.saveSettings();

                            this.display();
                        };
                    });

                return b;
            });
        const playerView = additional.createDiv("initiative-tracker-players");
        if (!this.plugin.players.length) {
            additional
                .createDiv({
                    attr: {
                        style: "display: flex; justify-content: center; padding-bottom: 18px;"
                    }
                })
                .createSpan({
                    text: "No saved players! Create one to see it here."
                });
        } else {
            const headers = playerView.createDiv(
                "initiative-tracker-player headers"
            );

            headers.createDiv({ text: "Name" });
            new ExtraButtonComponent(headers.createDiv())
                .setIcon(HP)
                .setTooltip("Max HP");
            new ExtraButtonComponent(headers.createDiv())
                .setIcon(AC)
                .setTooltip("Armor Class");
            new ExtraButtonComponent(headers.createDiv())
                .setIcon(INITIATIVE)
                .setTooltip("Initiative Modifier");

            headers.createDiv();

            for (let player of this.plugin.players) {
                const playerDiv = playerView.createDiv(
                    "initiative-tracker-player"
                );
                playerDiv.createDiv({ text: player.name });
                playerDiv.createDiv({
                    text: `${player.hp ?? DEFAULT_UNDEFINED}`
                });
                playerDiv.createDiv({
                    text: `${player.ac ?? DEFAULT_UNDEFINED}`
                });
                playerDiv.createDiv({
                    text: `${player.modifier ?? DEFAULT_UNDEFINED}`
                });
                const icons = playerDiv.createDiv(
                    "initiative-tracker-player-icon"
                );
                new ExtraButtonComponent(icons.createDiv())
                    .setIcon(EDIT)
                    .setTooltip("Edit")
                    .onClick(() => {
                        const modal = new NewPlayerModal(this.plugin, player);
                        modal.open();
                        modal.onClose = async () => {
                            if (!modal.saved) return;

                            Object.assign(player, modal.player);

                            await this.plugin.saveSettings();

                            this.display();
                        };
                    });
                new ExtraButtonComponent(icons.createDiv())
                    .setIcon("trash")
                    .setTooltip("Delete")
                    .onClick(async () => {
                        this.plugin.players = this.plugin.players.filter(
                            (p) => p != player
                        );
                        await this.plugin.saveSettings();
                        this.display();
                    });
            }
        }
    }
}

class NewPlayerModal extends Modal {
    player: HomebrewCreature;
    saved: boolean;
    constructor(
        private plugin: InitiativeTracker,
        private original?: HomebrewCreature
    ) {
        super(plugin.app);
        this.player = { ...(original ?? {}) };
    }
    async display(load?: boolean) {
        let { contentEl } = this;

        contentEl.addClass("initiative-tracker-add-player-modal");

        contentEl.empty();

        let error = false;

        contentEl.createEl("h2", { text: "New Player" });

        new Setting(contentEl)
            .setName("Link to Note")
            .setDesc("Link player to a note in your vault.")
            .addText((t) => {
                t.setValue(this.player.note ?? "");
                const modal = new FileSuggestionModal(this.app, t);
                modal.onClose = async () => {
                    if (!modal.file) return;

                    const metaData = this.app.metadataCache.getFileCache(
                        modal.file
                    );

                    this.player.note = modal.file.basename;
                    this.player.name = modal.file.basename;

                    if (!metaData || !metaData.frontmatter) return;

                    const { ac, hp, modifier } = metaData.frontmatter;
                    this.player = {
                        ...this.player,
                        ...{ ac, hp, modifier }
                    };
                    this.display();
                };
            });

        let nameInput: InputValidate,
            hpInput: InputValidate,
            acInput: InputValidate,
            modInput: InputValidate;

        new Setting(contentEl)
            .setName("Name")
            .setDesc("Player name. Must be unique!")
            .addText((t) => {
                nameInput = {
                    input: t.inputEl,
                    validate: (i: HTMLInputElement) => {
                        let error = false;
                        if (
                            (!i.value.length && !load) ||
                            (this.plugin.players.find(
                                (p) => p.name === i.value
                            ) &&
                                this.player.name != this.original.name)
                        ) {
                            i.addClass("has-error");
                            error = true;
                        }
                        return error;
                    }
                };
                t.setValue(this.player.name ?? "");
                t.onChange((v) => {
                    t.inputEl.removeClass("has-error");
                    this.player.name = v;
                });
            });
        new Setting(contentEl).setName("Max Hit Points").addText((t) => {
            hpInput = {
                input: t.inputEl,
                validate: (i: HTMLInputElement) => {
                    let error = false;
                    if (isNaN(Number(i.value))) {
                        i.addClass("has-error");
                        error = true;
                    }
                    return error;
                }
            };
            t.setValue(`${this.player.hp ?? ""}`);
            t.onChange((v) => {
                t.inputEl.removeClass("has-error");
                this.player.hp = Number(v);
            });
        });
        new Setting(contentEl).setName("Armor Class").addText((t) => {
            acInput = {
                input: t.inputEl,
                validate: (i) => {
                    let error = false;
                    if (isNaN(Number(i.value))) {
                        t.inputEl.addClass("has-error");
                        error = true;
                    }
                    return error;
                }
            };
            t.setValue(`${this.player.ac ?? ""}`);
            t.onChange((v) => {
                t.inputEl.removeClass("has-error");
                this.player.ac = Number(v);
            });
        });
        new Setting(contentEl)
            .setName("Initiative Modifier")
            .setDesc("This will be added to randomly-rolled initiatives.")
            .addText((t) => {
                modInput = {
                    input: t.inputEl,
                    validate: (i) => {
                        let error = false;
                        if (isNaN(Number(i.value))) {
                            t.inputEl.addClass("has-error");
                            error = true;
                        }
                        return error;
                    }
                };
                t.setValue(`${this.player.modifier ?? ""}`);
                t.onChange((v) => {
                    this.player.modifier = Number(v);
                });
            });

        let footerEl = contentEl.createDiv();
        let footerButtons = new Setting(footerEl);
        footerButtons.addButton((b) => {
            b.setTooltip("Save")
                .setIcon("checkmark")
                .onClick(async () => {
                    let error = this.validateInputs(
                        nameInput,
                        acInput,
                        hpInput,
                        modInput
                    );
                    if (error) {
                        new Notice("Fix errors before saving.");
                        return;
                    }
                    this.saved = true;
                    this.close();
                });
            return b;
        });
        footerButtons.addExtraButton((b) => {
            b.setIcon("cross")
                .setTooltip("Cancel")
                .onClick(() => {
                    this.saved = false;
                    this.close();
                });
            return b;
        });

        this.validateInputs(nameInput, acInput, hpInput, modInput);
    }
    validateInputs(...inputs: InputValidate[]) {
        let error = false;
        for (let input of inputs) {
            if (input.validate(input.input)) {
                error = true;
            } else {
                input.input.removeClass("has-error");
            }
        }
        return error;
    }
    onOpen() {
        this.display(true);
    }
}
class NewCreatureModal extends Modal {
    creature: HomebrewCreature;
    saved: boolean;
    constructor(
        private plugin: InitiativeTracker,
        private original?: HomebrewCreature
    ) {
        super(plugin.app);
        this.creature = { ...(original ?? {}) };
    }
    async display(load?: boolean) {
        let { contentEl } = this;

        contentEl.addClass("initiative-tracker-add-player-modal");

        contentEl.empty();

        let error = false;

        contentEl.createEl("h2", { text: "New Homebrew Creature" });

        new Setting(contentEl)
            .setName("Link to Note")
            .setDesc("Link creature to a note in your vault.")
            .addText((t) => {
                t.setValue(this.creature.note ?? "");
                const modal = new FileSuggestionModal(this.app, t);
                modal.onClose = async () => {
                    if (!modal.file) return;

                    const metaData = this.app.metadataCache.getFileCache(
                        modal.file
                    );

                    this.creature.note = modal.file.basename;
                    this.creature.name = modal.file.basename;

                    if (!metaData || !metaData.frontmatter) return;

                    const { ac, hp, modifier } = metaData.frontmatter;
                    this.creature = {
                        ...this.creature,
                        ...{ ac, hp, modifier }
                    };
                    this.display();
                };
            });

        let nameInput: InputValidate,
            hpInput: InputValidate,
            acInput: InputValidate,
            modInput: InputValidate;

        new Setting(contentEl)
            .setName("Name")
            .setDesc("Creature name.")
            .addText((t) => {
                nameInput = {
                    input: t.inputEl,
                    validate: (i: HTMLInputElement) => {
                        let error = false;
                        if (
                            (!i.value.length && !load) ||
                            (this.plugin.players.find(
                                (p) => p.name === i.value
                            ) &&
                                this.creature.name != this.original.name)
                        ) {
                            i.addClass("has-error");
                            error = true;
                        }
                        return error;
                    }
                };
                t.setValue(this.creature.name ?? "");
                t.onChange((v) => {
                    t.inputEl.removeClass("has-error");
                    this.creature.name = v;
                });
            });
        new Setting(contentEl).setName("Max Hit Points").addText((t) => {
            hpInput = {
                input: t.inputEl,
                validate: (i: HTMLInputElement) => {
                    let error = false;
                    if (isNaN(Number(i.value))) {
                        i.addClass("has-error");
                        error = true;
                    }
                    return error;
                }
            };
            t.setValue(`${this.creature.hp ?? ""}`);
            t.onChange((v) => {
                t.inputEl.removeClass("has-error");
                this.creature.hp = Number(v);
            });
        });
        new Setting(contentEl).setName("Armor Class").addText((t) => {
            acInput = {
                input: t.inputEl,
                validate: (i) => {
                    let error = false;
                    if (isNaN(Number(i.value))) {
                        t.inputEl.addClass("has-error");
                        error = true;
                    }
                    return error;
                }
            };
            t.setValue(`${this.creature.ac ?? ""}`);
            t.onChange((v) => {
                t.inputEl.removeClass("has-error");
                this.creature.ac = Number(v);
            });
        });
        new Setting(contentEl)
            .setName("Initiative Modifier")
            .setDesc("This will be added to randomly-rolled initiatives.")
            .addText((t) => {
                modInput = {
                    input: t.inputEl,
                    validate: (i) => {
                        let error = false;
                        if (isNaN(Number(i.value))) {
                            t.inputEl.addClass("has-error");
                            error = true;
                        }
                        return error;
                    }
                };
                t.setValue(`${this.creature.modifier ?? ""}`);
                t.onChange((v) => {
                    this.creature.modifier = Number(v);
                });
            });

        let footerEl = contentEl.createDiv();
        let footerButtons = new Setting(footerEl);
        footerButtons.addButton((b) => {
            b.setTooltip("Save")
                .setIcon("checkmark")
                .onClick(async () => {
                    let error = this.validateInputs(
                        nameInput,
                        acInput,
                        hpInput,
                        modInput
                    );
                    if (error) {
                        new Notice("Fix errors before saving.");
                        return;
                    }
                    this.saved = true;
                    this.close();
                });
            return b;
        });
        footerButtons.addExtraButton((b) => {
            b.setIcon("cross")
                .setTooltip("Cancel")
                .onClick(() => {
                    this.saved = false;
                    this.close();
                });
            return b;
        });

        this.validateInputs(nameInput, acInput, hpInput, modInput);
    }
    validateInputs(...inputs: InputValidate[]) {
        let error = false;
        for (let input of inputs) {
            if (input.validate(input.input)) {
                error = true;
            } else {
                input.input.removeClass("has-error");
            }
        }
        return error;
    }
    onOpen() {
        this.display(true);
    }
}
