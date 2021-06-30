import { Plugin, WorkspaceLeaf } from "obsidian";

import { INTIATIVE_TRACKER_VIEW, registerIcons } from "./utils";
import TrackerView from "./view";
import type { InitiativeTrackerData, SRDMonster } from "../@types/index";

import "./main.css";
import InitiativeTrackerSettings from "./settings";
import { Creature } from "./utils/creature";

import { BESTIARY } from "./utils/srd-bestiary";

declare module "obsidian" {
	interface App {
		plugins: {
			plugins: {
				"obsidian-5e-statblocks": {
					data: Map<string, SRDMonster>;
				};
			};
		};
	}
}
export default class InitiativeTracker extends Plugin {
	private view: TrackerView;
	public data: InitiativeTrackerData;
	get players(): Creature[] {
		return this.data.players;
	}
	set players(players) {
		this.data.players = players;
	}

	get homebrew() {
		if (!this.data.sync) return [];
		if (!this.app.plugins.plugins["obsidian-5e-statblocks"]) return [];

		return [
			...Array.from(
				this.app.plugins.plugins["obsidian-5e-statblocks"].data.values()
			).map((m) => {
				return new Creature({
					name: m.name,
					hp: m.hp,
					ac: m.ac,
					source: m.source,
					modifier: Math.floor((m.stats[1] - 10) / 2),
				});
			}),
		];
	}

	get bestiary() {
		return [...BESTIARY, ...this.homebrew];
	}

	async onload() {
		registerIcons();

		await this.loadSettings();

		/* if (this.data.sync) {
			this.loadFromStatblocks();
		} */

		this.addSettingTab(new InitiativeTrackerSettings(this));

		this.registerView(
			INTIATIVE_TRACKER_VIEW,
			(leaf: WorkspaceLeaf) => (this.view = new TrackerView(leaf, this))
		);

		this.addCommand({
			id: "open-tracker",
			name: "Open Initiative Tracker",
			checkCallback: (checking) => {
				if (checking)
					return (
						this.app.workspace.getLeavesOfType(
							INTIATIVE_TRACKER_VIEW
						).length === 0
					);
				this.addTrackerView();
			},
		});

		this.addCommand({
			id: "toggle-encounter",
			name: "Toggle Encounter",
			checkCallback: (checking) => {
				if (checking) {
					return (
						this.app.workspace.getLeavesOfType(
							INTIATIVE_TRACKER_VIEW
						).length != 0
					);
				}
				this.view.toggleState();
			},
		});
		this.addCommand({
			id: "next-combatant",
			name: "Next Combatant",
			checkCallback: (checking) => {
				if (checking) {
					return (
						this.app.workspace.getLeavesOfType(
							INTIATIVE_TRACKER_VIEW
						).length != 0 && this.view.state
					);
				}
				this.view.goToNext();
			},
		});
		this.addCommand({
			id: "prev-combatant",
			name: "Previous Combatant",
			checkCallback: (checking) => {
				if (checking) {
					return (
						this.app.workspace.getLeavesOfType(
							INTIATIVE_TRACKER_VIEW
						).length != 0 && this.view.state
					);
				}
				this.view.goToPrevious();
			},
		});

		if (this.app.workspace.layoutReady) {
			this.addTrackerView();
		} else {
			this.registerEvent(
				this.app.workspace.on(
					"layout-ready",
					this.addTrackerView.bind(this)
				)
			);
		}
		console.log("Initiative Tracker v" + this.manifest.version + " loaded");
	}

	onunload() {
		this.app.workspace
			.getLeavesOfType(INTIATIVE_TRACKER_VIEW)
			.forEach((leaf) => leaf.detach());
		console.log("Initiative Tracker unloaded");
	}

	addTrackerView() {
		if (this.app.workspace.getLeavesOfType(INTIATIVE_TRACKER_VIEW).length) {
			return;
		}
		this.app.workspace.getRightLeaf(false).setViewState({
			type: INTIATIVE_TRACKER_VIEW,
		});
	}

	async loadSettings() {
		const data = Object.assign(
			{},
			{ players: [], version: this.manifest.version, sync: false },
			await this.loadData()
		);

		this.data = data;
	}

	async saveSettings() {
		await this.saveData(this.data);
	}
}
