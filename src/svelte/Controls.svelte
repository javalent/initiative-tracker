<script lang="ts">
    import { ExtraButtonComponent } from "obsidian";

    import { view } from "./store";
    import type TrackerView from "src/view";

    let TrackerView: TrackerView;
    view.subscribe((view) => {
        TrackerView = view;
    });

    let button: ExtraButtonComponent;
    const stateButton = (node: HTMLElement) => {
        button = new ExtraButtonComponent(node)
            .setIcon(TrackerView.stateIcon)
            .setTooltip(TrackerView.stateMessage)
            /* .setDisabled(creatures.length == 0) */
            .onClick(() => {
                TrackerView.state = !TrackerView.state;
            });
    };

    $: {
        if (button) {
            button
                .setIcon(TrackerView.stateIcon)
                .setTooltip(TrackerView.stateMessage);
        }
    }
</script>

<div class="buttons">
    <div use:stateButton />
</div>

<style>
    .buttons {
        display: flex;
        justify-content: flex-start;
        align-items: center;
    }

    .buttons > *:not(:last-child) {
        margin-right: 0.25rem;
    }
</style>
