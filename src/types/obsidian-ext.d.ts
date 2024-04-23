import "obsidian";
import type { HomebrewCreature } from "src/types/creatures";

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
        trigger(
            name: "link-hover",
            popover: any, //hover popover, but don't need
            target: HTMLElement, //targetEl
            note: string, //linkText
            source: string //source
        ): void;
    }

    interface MenuItem {
        setSubmenu: () => Menu;
        submenu: Menu;
    }
}
