import type { ExperienceThreshold } from "index";
import { ItemView, ViewStateResult, WorkspaceLeaf } from "obsidian";
import type InitiativeTracker from "src/main";
import { BUILDER_VIEW } from "../utils";

import Builder from "./view/Builder.svelte";
import { encounter } from "./stores/encounter";
import { get } from "svelte/store";
import type { SRDMonster } from "obsidian-overload";

interface BuilderContext {
    plugin: InitiativeTracker;
    playerCount: number;
}
declare module "svelte" {
    function setContext<T extends keyof BuilderContext>(
        key: T,
        context: BuilderContext[T]
    ): BuilderContext[T];
    function getContext<T extends keyof BuilderContext>(
        key: T
    ): BuilderContext[T];
}

export default class BuilderView extends ItemView {
    constructor(leaf: WorkspaceLeaf, public plugin: InitiativeTracker) {
        super(leaf);
    }
    getState() {
        return [...get(encounter).entries()];
    }
    async setState(
        state: [SRDMonster, number][],
        result: ViewStateResult
    ): Promise<void> {
        if (state && Array.isArray(state)) encounter.setMultiple(state);
        super.setState(state, result);
    }
    ui: Builder;
    async onOpen() {
        this.ui = new Builder({
            target: this.contentEl,
            props: {
                plugin: this.plugin
            }
        });
    }
    async onClose() {
        this.ui.$destroy();
    }
    getDisplayText(): string {
        return "Encounter Builder";
    }
    getIcon(): string {
        return BUILDER_VIEW;
    }
    getViewType(): string {
        return BUILDER_VIEW;
    }
}
