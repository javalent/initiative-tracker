# TTRPG Initiative Tracker for Obsidian.md

This plugin can be used as an initiative tracker within Obsidian.md.

When enabled, the plugin will add an additional view in the right pane, where players and creatures can be added to track their initiatives during combat.

## Using the Plugin

Monsters may be added to the combat by clicking the `Add Creature` button, which will open a form where the creature's name, HP, AC and initiative can be set.

Once all of the creatures in a given combat have been added, initiatives can be modified by clicking on the initiative number and entering the new initiative. Names for non-player creatures can be modified in the same way.

### Actions

Creatures may be disabled or removed from the combat, or statuses (such as "poisoned") may be added in the `Actions` menu on the right of each creature.

### Controls

Combat can be started by clicking the `play` button. This will display the currently active creature. Clicking `next` or `previous` will move to the next enabled combatant.

Initiatives can be re-rolled for all monsters in the combat by clicking the `Re-roll Initiatives` button.

The creatures HP and status effects can be reset by clicking `Reset HP and Status`.

A new encounter (just player characters) can be started by clicking `New Encounter`.

## Players

Players may be added in settings. Players created in this way will be automatically added to encounters.

## Homebrew Content

If the [5e Statblocks](https://github.com/valentine195/obsidian-5e-statblocks) plugin is installed, the homebrew creatures saved to that plugin can be used in this plugin by enabling the sync in settings.

# Installation

<!-- ## From within Obsidian

From Obsidian v0.9.8, you can activate this plugin within Obsidian by doing the following:

-   Open Settings > Third-party plugin
-   Make sure Safe mode is **off**
-   Click Browse community plugins
-   Search for this plugin
-   Click Install
-   Once installed, close the community plugins window and activate the newly installed plugin -->

## From GitHub

-   Download the Latest Release from the Releases section of the GitHub Repository
-   Extract the plugin folder from the zip to your vault's plugins folder: `<vault>/.obsidian/plugins/`  
    Note: On some machines the `.obsidian` folder may be hidden. On MacOS you should be able to press `Command+Shift+Dot` to show the folder in Finder.
-   Reload Obsidian
-   If prompted about Safe Mode, you can disable safe mode and enable the plugin.
    Otherwise head to Settings, third-party plugins, make sure safe mode is off and
    enable the plugin from there.

### Updates

You can follow the same procedure to update the plugin

# Warning

This plugin comes with no guarantee of stability and bugs may delete data.
Please ensure you have automated backups.

# TTRPG plugins

If you're using Obsidian to run/plan a TTRPG, you may find my other plugin useful:

-   [Obsidian Leaflet](https://github.com/valentine195/obsidian-leaflet-plugin) - Add interactive maps to Obsidian.md notes
-   [Dice Roller](https://github.com/valentine195/obsidian-dice-roller) - Inline dice rolling for Obsidian.md
-   [5e Statblocks](https://github.com/valentine195/obsidian-5e-statblocks)
