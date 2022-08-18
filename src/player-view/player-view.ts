import { ItemView, WorkspaceLeaf } from "obsidian";
import type InitiativeTracker from "src/main";
import type { Creature } from "src/utils/creature";
import type TrackerView from "src/view";
import { PLAYER_VIEW_VIEW } from "../utils";

import App from "./PlayerView.svelte";

export default class PlayerView extends ItemView {
    _app: App;
    getDisplayText(): string {
        return "Player View";
    }
    getViewType(): string {
        return PLAYER_VIEW_VIEW;
    }
    getIcon(): string {
        return "lucide-view";
    }
    constructor(public leaf: WorkspaceLeaf, public plugin: InitiativeTracker) {
        super(leaf);
    }
    reset(creatures: Creature[]) {
        this._app.$set({ creatures: creatures });
        this._app.$set({ loaded: true });
    }
    setTrackerState(state: boolean) {
        this._app.$set({ state });
    }
    async onOpen() {
        this._app = new App({
            target: this.contentEl,
            props: {}
        });
        this._app.$on("try-load", () =>
            this.plugin.view?.setPlayerViewCreatures()
        );
    }
}
