import type { ExperienceThreshold } from "@types";
import { ItemView, WorkspaceLeaf } from "obsidian";
import type InitiativeTracker from "src/main";
import { BUILDER_VIEW } from "../utils";

import Builder from "./view/Builder.svelte";

interface BuilderContext {
    plugin: InitiativeTracker;
    playerCount: number;
    thresholds: ExperienceThreshold;
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
