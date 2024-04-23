import "obsidian";

declare module "obsidian" {
    interface App {
        plugins: {
            enabledPlugins: Set<string>;
        };
        commands: {
            commands: { [id: string]: Command };
            findCommand(id: string): Command;
            executeCommandById(id: string): void;
            listCommands(): Command[];
        };
    }
    interface WorkspaceItem {
        containerEl: HTMLElement;
    }
    interface Workspace {
        on(
            name: "initiative-tracker:state-change",
            callback: (state: TrackerViewState) => void
        ): EventRef;
        on(
            name: "initiative-tracker:players-updated",
            callback: (pcs: Creature[]) => void
        ): EventRef;
        on(
            name: "initiative-tracker:creatures-added",
            callback: (npcs: Creature[]) => void
        ): EventRef;
        on(
            name: "initiative-tracker:creature-added-at-location",
            callback: (creature: Creature, latlng: any) => void
        ): EventRef;
        on(
            name: "initiative-tracker:add-creature-here",
            callback: (latlng: any) => void
        ): EventRef;
        on(
            name: "initiative-tracker:creature-updated",
            callback: (creature: Creature) => void
        ): EventRef;
        on(
            name: "initiative-tracker:creature-updated-in-settings",
            callback: (creature: Creature) => void
        ): EventRef;
        on(
            name: "initiative-tracker:creatures-removed",
            callback: (npcs: Creature[]) => void
        ): EventRef;
        on(
            name: "initiative-tracker:new-encounter",
            callback: (state: TrackerViewState) => void
        ): EventRef;
        on(
            name: "initiative-tracker:reset-encounter",
            callback: (state: TrackerViewState) => void
        ): EventRef;
        on(
            name: "initiative-tracker:active-change",
            callback: (creature: Creature) => void
        ): EventRef;
        on(name: "initiative-tracker:unload", callback: () => void): EventRef;
        on(
            name: "initiative-tracker:apply-damage",
            callback: (creature: Creature) => void
        ): EventRef;
        on(
            name: "initiative-tracker:add-status",
            callback: (creature: Creature) => void
        ): EventRef;
        on(
            name: "initiative-tracker:enable-disable",
            callback: (creature: Creature, enable: boolean) => void
        ): EventRef;
        on(
            name: "initiative-tracker:remove",
            callback: (creature: Creature) => void
        ): EventRef;
        on(name: "initiative-tracker:closed", callback: () => void): EventRef;
        on(
            name: "initiative-tracker:should-save",
            callback: () => void
        ): EventRef;
        on(
            name: "initiative-tracker:save-state",
            callback: (state?: InitiativeViewState) => void
        ): EventRef;
        /** This event can be used to start an event by sending an object with a name, HP, AC, and initiative modifier at minimum. */
        on(
            name: "initiative-tracker:start-encounter",
            callback: (creatures: HomebrewCreature[]) => void
        ): EventRef;
        on(
            name: "initiative-tracker:stop-viewing",
            callback: (creatures: HomebrewCreature[]) => void
        ): EventRef;
    }

    interface MenuItem {
        setSubmenu: () => Menu;
        submenu: Menu;
    }
}
