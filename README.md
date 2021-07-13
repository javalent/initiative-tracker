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

### Commands

The plugin registers several commands to Obsidian that can be assigned to hotkeys or used with the Command Palette (<kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>P</kbd>).

#### Open Initiative Tracker

If the initiative tracker view has been closed for any reason, use this command to add it back to the right pane.

#### Toggle Encounter

This command can be used to start or stop an encounter.

#### Next Combatant

If the encounter is active, this command can be used to make the next enabled combatant active (similar to clicking the `Next` button).

#### Previous Combatant

If the encounter is active, this command can be used to make the previous enabled combatant active (similar to clicking the `Previous` button).

# Settings

The setting tab has several options for adding and managing players and homebrew creatures, as well as the ability to change the formula used to calculate the initiative.
## Players

Players may be added in settings. Players created in this way will be automatically added to encounters.

### Players from Notes

When adding a new player, there is the option to add a player based on a note.

Currently, this functionality will only read the frontmatter of a note to pull in the relevant fields - hp, ac, and initiative modifier.

Frontmatter should be formatted like this:

```
---
hp: 23
ac: 17
modifier: 2
---
```

In the future, this will be used to display more information about the player during combat, and also will update the player's information when the frontmatter is changed.

## Homebrew Content

Homebrew monsters may be created and managed in settings. Homebrew monsters will be available in the monster picker when adding a creature to the combat.

### 5e Statblocks Plugin

If the [5e Statblocks](https://github.com/valentine195/obsidian-5e-statblocks) plugin is installed, the homebrew creatures saved to that plugin can be used in this plugin by enabling the sync in settings.

### Import Homebrew

**Only import content that you own.**

Homebrew monsters can be imported from DnDAppFile XML files or Improved Initiative JSON files in settings.

## Initiative Formula

> This setting can only be modified when the [Dice Roller](https://github.com/valentine195/obsidian-dice-roller) plugin is installed.

This setting can be used to modify how a creature's initiative is calculated by the plugin. Use `%mod` as a placeholder for the creature's initiative modifier.

It defaults to `1d20 + %mod%`.

This will support any dice formula supported by the Dice Roller plugin.

# Roadmap

This is a list of features that are planned for the plugin. Some of these may or may not be developed.

-   Wikilink Player Characters
    -   Automatically pull HP/AC from PC Note Wikilinked in settings
-   Wikilink Creatures
    -   stat blocks on hover
-   Wikilink Tags (e.g., condition tag to display condition rules, spell tags for spell effects, etc.)
-   Creature stat blocks in separate moveable tab of sidebar
    -   auto-update displayed stat block based on active creature in the encounter
-   An option to build an encounter in a Note and send it to Initiative Tracker on demand (e.g., in an Obsidian Note, create some code block indicating 3 Goblins and 1 Bugbear in an area; press a button, add the 3 Goblins and Bugbear to the Initiative tracker)
-   Encounter difficulty/XP tracker for creatures with CR
-   For the currently active creature, display any actions that would need a dice roll and an integrated dice roller with the specific dice and bonuses for the action already pre-loaded (e.g., for a Bugbear, display "Morningstar" and a to-hit dice with 1d20+4, as well as a damage dice of 2d8+2; Also display for the Javelin action)
-   Support for multiple parties
-   Integrated dice roller

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
-   [5e Statblocks](https://github.com/valentine195/obsidian-5e-statblocks) - Format statblocks 5e-style
