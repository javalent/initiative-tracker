import { ItemView, setIcon, WorkspaceLeaf } from "obsidian";
import { INITIATIVE_TRACKER_BACKWARD, INITIATIVE_TRACKER_BASE, INITIATIVE_TRACKER_FORWARD, INITIATIVE_TRACKER_ICON, INITIATIVE_TRACKER_PLAY, INITIATIVE_TRACKER_SAVE, INTIATIVE_TRACKER_VIEW } from "./utils";

export default class TrackerView extends ItemView {
    private readonly buttons: HTMLElement = createDiv('initiative-tracker-buttons');
    private active: boolean = false;
    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
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

        setIcon(this.buttons.createDiv('play'), INITIATIVE_TRACKER_PLAY);
        setIcon(this.buttons.createDiv('prev'), INITIATIVE_TRACKER_BACKWARD);
        setIcon(this.buttons.createDiv('next'), INITIATIVE_TRACKER_FORWARD);

        contentEl.appendChild(this.buttons);

        contentEl.createEl('button', {
            cls: 'mod-cta',
            text: "Add"
        })

        containerEl.empty();
        containerEl.appendChild(contentEl);


    }

}