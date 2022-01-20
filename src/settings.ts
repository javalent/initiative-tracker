import {
    ExtraButtonComponent,
    Notice,
    PluginSettingTab,
    setIcon,
    Setting
} from "obsidian";

import type InitiativeTracker from "./main";

import { FileSuggestionModal } from "./utils/suggester";
import { AC, DEFAULT_UNDEFINED, EDIT, HP, INITIATIVE } from "./utils";
import type { HomebrewCreature, InputValidate } from "@types";

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

            this._displayBase(containerEl.createDiv());
            this._displayPlayers(
                containerEl.createDiv("initiative-tracker-additional-container")
            );

            this._displayIntegrations(containerEl.createDiv());
            this._displayHomebrew(
                containerEl.createDiv("initiative-tracker-additional-container")
            );

            const div = containerEl.createDiv("coffee");
            div.createEl("a", {
                href: "https://www.buymeacoffee.com/valentine195"
            }).createEl("img", {
                attr: {
                    src: "https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=valentine195&button_colour=e3e7ef&font_colour=262626&font_family=Inter&outline_colour=262626&coffee_colour=ff0000"
                }
            });
        } catch (e) {
            console.error(e);
            new Notice(
                "There was an error displaying the settings tab for Obsidian Initiative Tracker."
            );
        }
    }
    private _displayBase(containerEl: HTMLDivElement) {
        containerEl.empty();
        new Setting(containerEl).setHeading().setName("Basic Settings");
        new Setting(containerEl)
            .setName("Display Encounter Difficulty")
            .setDesc(
                "Display encounter difficulty based on creature CR and player level. Creatures without CR or level will not be considered in the calculation."
            )
            .addToggle((t) => {
                t.setValue(this.plugin.data.displayDifficulty).onChange(
                    async (v) => {
                        this.plugin.data.displayDifficulty = v;
                        await this.plugin.saveSettings();
                    }
                );
            });
        new Setting(containerEl)
            .setName("Roll Equivalent Creatures Together")
            .setDesc(
                "Equivalent creatures (same HP, AC and Name) will roll the same initiative by default."
            )
            .addToggle((t) => {
                t.setValue(this.plugin.data.condense).onChange(async (v) => {
                    this.plugin.data.condense = v;
                    const view = this.plugin.view;
                    if (view) {
                        view.setCondensed(this.plugin.data.condense);
                    }
                    await this.plugin.saveSettings();
                });
            });

/*         new Setting(containerEl)
            .setName("Monster Property used for Modifier")
            .setDesc(
                "The tracker will try to use this property on a monster to calculate initiative."
            )
            .addText((t) => {
                t.setValue(this.plugin.data.modifier).onChange((v) => {
                    this.plugin.data.modifier = v;
                });
                t.inputEl.onblur = async () => {
                    const view = this.plugin.view;
                    if (view) view.rollInitiatives();
                    await this.plugin.saveSettings();
                };
            }); */
    }
    private async _displayIntegrations(containerEl: HTMLDivElement) {
        containerEl.empty();
        new Setting(containerEl).setHeading().setName("Plugin Integrations");
        const syncEl = containerEl.createDiv("initiative-sync");
        console.log(
            "🚀 ~ file: settings.ts ~ line 106 ~ this.plugin.canUseStatBlocks",
            this.plugin.canUseStatBlocks
        );
        if (!this.plugin.canUseStatBlocks) {
            this.plugin.data.sync = false;
            await this.plugin.saveSettings();
        }
        new Setting(syncEl)
            .setName("Sync Monsters from 5e Statblocks")
            .setDesc(
                createFragment((e) => {
                    e.createSpan({
                        text: "Homebrew creatures saved to the TTRPG Statblocks plugin will be available in the quick-add."
                    });
                    if (!this.plugin.canUseStatBlocks) {
                        e.createEl("br");
                        e.createEl("br");
                        e.createSpan({
                            text: "Install and enable the "
                        });
                        e.createEl("a", {
                            text: "5e Statblocks",
                            href: "obsidian://show-plugin?id=obsidian-5e-statblocks"
                        });
                        e.createSpan({
                            text: " plugin to use homebrew creatures."
                        });
                    }
                })
            )
            .addToggle((t) => {
                t.setDisabled(!this.plugin.canUseStatBlocks).setValue(
                    this.plugin.data.sync
                );
                t.onChange(async (v) => {
                    this.plugin.data.sync = v;
                    await this.plugin.saveSettings();
                    this._displayIntegrations(containerEl);
                });
            });
        if (this.plugin.data.sync) {
            const synced = new Setting(syncEl).setDesc(
                `${this.plugin.statblock_creatures.length} creatures synced.`
            );
            synced.settingEl.addClass("initiative-synced");
            setIcon(synced.nameEl, "check-in-circle");
            synced.nameEl.appendChild(createSpan({ text: "Synced" }));
        }

        new Setting(containerEl)
            .setName("Initiative Formula")
            .setDesc(
                createFragment((e) => {
                    e.createSpan({
                        text: "Initiative formula to use when calculating initiative. Use "
                    });
                    e.createEl("code", { text: "%mod%" });
                    e.createSpan({
                        text: " for the modifier placeholder."
                    });
                    if (!this.plugin.canUseDiceRoller) {
                        e.createEl("br");
                        e.createEl("br");
                        e.createSpan({
                            attr: {
                                style: `color: var(--text-error);`
                            },
                            text: "Requires the "
                        });
                        e.createEl("a", {
                            text: "Dice Roller",
                            href: "https://github.com/valentine195/obsidian-dice-roller",
                            cls: "external-link"
                        });
                        e.createSpan({
                            attr: {
                                style: `color: var(--text-error);`
                            },
                            text: " plugin to modify."
                        });
                    }
                })
            )
            .addText((t) => {
                if (!this.plugin.canUseDiceRoller) {
                    t.setDisabled(true);
                    this.plugin.data.initiative = "1d20 + %mod%";
                }
                t.setValue(this.plugin.data.initiative);
                t.onChange((v) => {
                    this.plugin.data.initiative = v;
                });
                t.inputEl.onblur = async () => {
                    const view = this.plugin.view;
                    if (view) view.rollInitiatives();
                    await this.plugin.saveSettings();
                };
            });
        new Setting(containerEl)
            .setName("Integrate with Obsidian Leaflet")
            .setDesc(
                createFragment((e) => {
                    e.createSpan({
                        text: "Integrate with the Obsidian Leaflet plugin and display combats on a map."
                    });

                    if (!this.plugin.canUseLeaflet) {
                        e.createEl("br");
                        e.createEl("br");
                        e.createSpan({
                            attr: {
                                style: `color: var(--text-error);`
                            },
                            text: "Requires  "
                        });
                        e.createEl("a", {
                            text: "Obsidian Leaflet",
                            href: "https://github.com/valentine195/obsidian-leaflet-plugin",
                            cls: "external-link"
                        });
                        e.createSpan({
                            attr: {
                                style: `color: var(--text-error);`
                            },
                            text: " version 4.0.0 to modify."
                        });
                    }
                })
            )
            .addToggle((t) => {
                if (!this.plugin.canUseLeaflet) {
                    t.setDisabled(true);
                    this.plugin.data.leafletIntegration = false;
                }
                t.setValue(this.plugin.data.leafletIntegration);
                t.onChange(async (v) => {
                    this.plugin.data.leafletIntegration = v;
                    this.plugin.view.setMapState(v);
                    await this.plugin.saveSettings();
                    this._displayIntegrations(containerEl);
                });
            });

        if (this.plugin.canUseLeaflet && this.plugin.data.leafletIntegration) {
            new Setting(containerEl)
                .setName("Default Player Marker Type")
                .setDesc(
                    createFragment((e) => {
                        if (this.plugin.data.playerMarker) {
                            const div = e.createDiv("marker-type-display");
                            const inner = div.createDiv("marker-icon-display");

                            const marker = this.plugin.leaflet.markerIcons.find(
                                (icon) =>
                                    icon.type == this.plugin.data.playerMarker
                            );
                            if (marker) {
                                inner.innerHTML = marker.html;
                            }
                        }
                    })
                )
                .addDropdown((drop) => {
                    for (let marker of this.plugin.leaflet.markerIcons) {
                        drop.addOption(marker.type, marker.type);
                    }
                    drop.setValue(this.plugin.data.playerMarker ?? "default");
                    drop.onChange(async (v) => {
                        this.plugin.data.playerMarker = v;
                        await this.plugin.saveSettings();
                        this._displayIntegrations(containerEl);
                    });
                });
            new Setting(containerEl)
                .setName("Default Monster Marker Type")
                .setDesc(
                    createFragment((e) => {
                        if (this.plugin.data.monsterMarker) {
                            const div = e.createDiv("marker-type-display");
                            const inner = div.createDiv("marker-icon-display");

                            const marker = this.plugin.leaflet.markerIcons.find(
                                (icon) =>
                                    icon.type == this.plugin.data.monsterMarker
                            );
                            if (marker) {
                                inner.innerHTML = marker.html;
                            }
                        }
                    })
                )
                .addDropdown((drop) => {
                    for (let marker of this.plugin.leaflet.markerIcons) {
                        drop.addOption(marker.type, marker.type);
                    }
                    drop.setValue(this.plugin.data.monsterMarker);
                    drop.onChange(async (v) => {
                        this.plugin.data.monsterMarker = v;
                        await this.plugin.saveSettings();
                        this._displayIntegrations(containerEl);
                    });
                });
        }
    }
    private _displayHomebrew(additionalContainer: HTMLElement) {
        additionalContainer.empty();
        if (this.plugin.data.homebrew.length) {
            const additional = additionalContainer.createDiv("additional");
            new Setting(additional).setHeading().setName("Homebrew Creatures");
            const warning = additional
                .createDiv({
                    attr: {
                        style: "display: flex; justify-content: center; padding: 18px;"
                    }
                })
                .createEl("strong");
            warning.createSpan({
                text: "Homebrew creatures have moved to the "
            });
            warning.createEl("a", {
                text: "5e Statblocks",
                href: "obsidian://show-plugin?id=obsidian-5e-statblocks"
            });
            warning.createSpan({
                text: " plugin."
            });
            if (this.plugin.canUseStatBlocks) {
                new Setting(additional)
                    .setName("Migrate Hombrew")
                    .setDesc(
                        "Move all created homebrew creatures to the 5e Statblocks plugin."
                    )
                    .addButton((b) => {
                        b.setIcon("install")
                            .setTooltip("Migrate")
                            .onClick(async () => {
                                const existing = this.app.plugins.getPlugin(
                                    "obsidian-5e-statblocks"
                                ).settings.monsters.length;
                                await this.app.plugins
                                    .getPlugin("obsidian-5e-statblocks")
                                    .saveMonsters(this.plugin.data.homebrew);
                                new Notice(
                                    `${
                                        this.app.plugins.getPlugin(
                                            "obsidian-5e-statblocks"
                                        ).settings.monsters.length - existing
                                    } of ${
                                        this.plugin.data.homebrew.length
                                    } Homebrew Monsters saved.`
                                );
                            });
                    })
                    .addExtraButton((b) => {
                        b.setIcon("cross-in-box")
                            .setTooltip("Delete Homebrew")
                            .onClick(async () => {
                                if (
                                    await confirmWithModal(
                                        this.app,
                                        "Are you sure you want to delete all homebrew creatures?"
                                    )
                                ) {
                                    this.plugin.data.homebrew = [];
                                    await this.plugin.saveSettings();
                                    this._displayHomebrew(additionalContainer);
                                }
                            });
                    });
            } else {
                additional
                    .createDiv({
                        attr: {
                            style: "display: flex; justify-content: center; padding: 18px;"
                        }
                    })
                    .createEl("strong");
                warning.createSpan({
                    text: "Install the "
                });
                warning.createEl("a", {
                    text: "5e Statblocks",
                    href: "obsidian://show-plugin?id=obsidian-5e-statblocks"
                });
                warning.createSpan({
                    text: " plugin to migrate."
                });
            }
        }
    }
    private _displayPlayers(additionalContainer: HTMLDivElement) {
        additionalContainer.empty();
        new Setting(additionalContainer).setHeading().setName("Players");
        new Setting(additionalContainer)
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

                            await this.plugin.savePlayer({
                                ...modal.player,
                                player: true
                            });

                            this._displayPlayers(additionalContainer);
                        };
                    });

                return b;
            });
        const additional = additionalContainer.createDiv("additional");
        const playerView = additional.createDiv("initiative-tracker-players");
        if (!this.plugin.data.players.length) {
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

            for (let player of this.plugin.data.players) {
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
                            await this.plugin.updatePlayer(
                                player,
                                modal.player
                            );
                            this.plugin.app.workspace.trigger(
                                "initiative-tracker:creature-updated-in-settings",
                                player
                            );

                            this._displayPlayers(additionalContainer);
                        };
                    });
                new ExtraButtonComponent(icons.createDiv())
                    .setIcon("trash")
                    .setTooltip("Delete")
                    .onClick(async () => {
                        this.plugin.data.players =
                            this.plugin.data.players.filter((p) => p != player);

                        await this.plugin.saveSettings();
                        this._displayPlayers(additionalContainer);
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

        contentEl.createEl("h2", {
            text: this.original ? "Edit Player" : "New Player"
        });

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

                    const { ac, hp, modifier, level } = metaData.frontmatter;
                    this.player = {
                        ...this.player,
                        ...{ ac, hp, modifier, level }
                    };
                    this.display();
                };
            });

        let nameInput: InputValidate,
            levelInput: InputValidate,
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
                            (this.plugin.data.players.find(
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
        new Setting(contentEl)
            .setName("Level")
            .setDesc("Player level.")
            .addText((t) => {
                levelInput = {
                    input: t.inputEl,
                    validate: (i: HTMLInputElement) => {
                        let error = false;
                        if (isNaN(Number(i.value)) || Number(i.value) <= 0) {
                            i.addClass("has-error");
                            error = true;
                        }
                        return error;
                    }
                };
                t.setValue(`${this.player.level ?? ""}`);
                t.onChange((v) => {
                    t.inputEl.removeClass("has-error");
                    this.player.level = Number(v);
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

        if (this.plugin.canUseLeaflet) {
            const markerSetting = new Setting(contentEl)
                .setName("Leaflet Marker")
                .addDropdown((drop) => {
                    for (let marker of this.plugin.leaflet.markerIcons) {
                        drop.addOption(marker.type, marker.type);
                    }
                    drop.setValue(
                        this.player.marker ??
                            this.plugin.data.playerMarker ??
                            "default"
                    );
                    drop.onChange(async (v) => {
                        this.player.marker = v;
                        this.display();
                    });
                });

            if (this.player.marker) {
                const div = createDiv("marker-type-display");
                const inner = div.createDiv("marker-icon-display");

                const marker = this.plugin.leaflet.markerIcons.find(
                    (icon) => icon.type == this.player.marker
                );
                if (marker) {
                    inner.innerHTML = marker.html;

                    markerSetting.descEl.appendChild(div);
                }
            }
        }

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

import { App, ButtonComponent, Modal } from "obsidian";

export async function confirmWithModal(
    app: App,
    text: string,
    buttons: { cta: string; secondary: string } = {
        cta: "Yes",
        secondary: "No"
    }
): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const modal = new ConfirmModal(app, text, buttons);
        modal.onClose = () => {
            resolve(modal.confirmed);
        };
        modal.open();
    });
}

export class ConfirmModal extends Modal {
    constructor(
        app: App,
        public text: string,
        public buttons: { cta: string; secondary: string }
    ) {
        super(app);
    }
    confirmed: boolean = false;
    async display() {
        new Promise((resolve) => {
            this.contentEl.empty();
            this.contentEl.addClass("confirm-modal");
            this.contentEl.createEl("p", {
                text: this.text
            });
            const buttonEl = this.contentEl.createDiv(
                "fantasy-calendar-confirm-buttons"
            );
            new ButtonComponent(buttonEl)
                .setButtonText(this.buttons.cta)
                .setCta()
                .onClick(() => {
                    this.confirmed = true;
                    this.close();
                });
            new ButtonComponent(buttonEl)
                .setButtonText(this.buttons.secondary)
                .onClick(() => {
                    this.close();
                });
        });
    }
    onOpen() {
        this.display();
    }
}
