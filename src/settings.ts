import {
    App,
    ButtonComponent,
    ExtraButtonComponent,
    Modal,
    Notice,
    PluginSettingTab,
    setIcon,
    Setting
} from "obsidian";
import type InitiativeTracker from "./main";
import type { Creature } from "./view";
import { FileSuggestionModal } from "./utils/suggester";
import { AC, EDIT, HP, INITIATIVE, REMOVE } from "./utils";
import type { InputValidate } from "@types";

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

            const additional = additionalContainer.createDiv("additional");
            new Setting(additional)
                .setName("Add New Player")
                .setDesc(
                    "These players will always be added to new encounters."
                )
                .addButton((button: ButtonComponent): ButtonComponent => {
                    let b = button
                        .setTooltip("Add Player")
                        .setButtonText("+")
                        .onClick(async () => {
                            const modal = new NewPlayerModal(this.plugin);
                            modal.open();
                            modal.onClose = async () => {
                                if (!modal.saved) return;

                                this.plugin.players.push({ ...modal.player });
                                await this.plugin.saveSettings();

                                this.display();
                            };
                        });

                    return b;
                });
            const playerView = additional.createDiv(
                "initiative-tracker-players"
            );
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
                return;
            }
            const headers = playerView.createDiv(
                "initiative-tracker-player headers"
            );

            headers.createDiv({ text: "Name" });
            setIcon(headers.createDiv(), HP);
            setIcon(headers.createDiv(), AC);
            setIcon(headers.createDiv(), INITIATIVE);
            headers.createDiv();

            for (let player of this.plugin.players) {
                const playerDiv = playerView.createDiv(
                    "initiative-tracker-player"
                );
                playerDiv.createDiv({ text: player.name });
                playerDiv.createDiv({ text: `${player.hp}` });
                playerDiv.createDiv({ text: `${player.ac}` });
                playerDiv.createDiv({ text: `${player.modifier}` });
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
                            console.log(
                                "🚀 ~ file: settings.ts ~ line 104 ~ player",
                                player,
                                ...this.plugin.players
                            );
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
        } catch (e) {
            new Notice(
                "There was an error displaying the settings tab for TTRPG Initiative Tracker."
            );
        }
    }
}

class NewPlayerModal extends Modal {
    player: Creature = {};
    saved: boolean;
    constructor(
        private plugin: InitiativeTracker,
        private original: Creature = {}
    ) {
        super(plugin.app);
        this.player = { ...original };
    }
    async display() {
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
                            this.plugin.players.find(
                                (p) => p.name === i.value
                            ) &&
                            this.player.name != this.original.name
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
        this.display();
    }
}
