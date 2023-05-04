import { Modal } from "obsidian";

import copy from "fast-copy";
import Filters from "./Filters.svelte";
import { type Filter } from "./filter";

export class HeadersModal extends Modal {
    canceled: boolean = false;
    reset = false;
    constructor(public filters: Filter[]) {
        super(app);
    }
    onOpen() {
        this.titleEl.setText("Edit Headers");
        const app = new Filters({
            target: this.contentEl,
            props: {
                filters: copy(this.filters)
            }
        });
        app.$on("update", (evt) => {
            this.filters = copy(evt.detail);
        });
        app.$on("cancel", () => {
            this.canceled = true;
            this.close();
        });
        app.$on("reset", () => {
            this.reset = true;
            this.close();
        });
    }
}
