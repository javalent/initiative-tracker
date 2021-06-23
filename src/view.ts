import {
    ExtraButtonComponent,
    ItemView,
    setIcon,
    WorkspaceLeaf
} from "obsidian";
import {
    INITIATIVE_TRACKER_BACKWARD,
    INITIATIVE_TRACKER_BASE,
    INITIATIVE_TRACKER_FORWARD,
    INITIATIVE_TRACKER_ICON,
    INITIATIVE_TRACKER_PLAY,
    INITIATIVE_TRACKER_SAVE,
    INTIATIVE_TRACKER_VIEW
} from "./utils";

export default class TrackerView extends ItemView {
    private readonly buttons: HTMLElement = createDiv(
        "initiative-tracker-buttons nav-buttons-container"
    );
    private readonly table: HTMLElement = createDiv("initiative-tracker-table");

    public creatures: any[] = [];

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);

        setIcon(
            this.buttons.createDiv("play nav-action-button"),
            INITIATIVE_TRACKER_PLAY
        );
        setIcon(
            this.buttons.createDiv("back nav-action-button"),
            INITIATIVE_TRACKER_BACKWARD
        );
        setIcon(
            this.buttons.createDiv("next nav-action-button"),
            INITIATIVE_TRACKER_FORWARD
        );
    }
    getViewType() {
        return INTIATIVE_TRACKER_VIEW;
    }
    getDisplayText() {
        return "Initiative Tracker";
    }
    getIcon() {
        return INITIATIVE_TRACKER_BASE;
    }
    async onOpen() {
        console.log(this);
        this.build();
    }

    private build() {
        const { containerEl } = this;

        const contentEl = createDiv("obsidian-initiative-tracker");

        contentEl.appendChild(this.buttons);

        contentEl.appendChild(this.table);

        const addEl = contentEl.createDiv("initiative-add-creature-container");

        const add = new ExtraButtonComponent(
            addEl.createDiv("initiative-add-creature-button")
        )
            .setTooltip("Add Creature")
            .setIcon("plus-with-circle")
            .onClick(() => {
                console.log("Add New");
            });

        containerEl.empty();
        containerEl.appendChild(contentEl);
    }
}
