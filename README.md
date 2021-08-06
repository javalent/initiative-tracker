# TTRPG Initiative Tracker for Obsidian.md

This plugin can be used as an initiative tracker within Obsidian.md.

When enabled, the plugin will add an additional view in the right pane, where players and creatures can be added to track their initiatives during combat.

## Creating Encounters in Notes

Encounters can be created and launched directly from notes as of `2.0.0` using the "encounter" code block, like so:

````
```encounter
name: Example
creatures:
 - 3: Goblin
```
````

This will render like this in Preview:

<img src="https://raw.githubusercontent.com/valentine195/obsidian-initiative-tracker/master/assets/encounter.PNG">

Clicking on the button next to the encounter name will then launch the encounter in the Initiative Tracker.

### Parameters

There are 3 parameters for each encounter, with more detail below.

````
```encounter
name: string                            # Name of the encounter. Optional.
players: boolean | string | array       # Which players to include. Optional.
creatures: array                        # Array of creatures to include in the encounter. Optional.
```
````

#### Name

The name of the encounter, which will be displayed both in Preview mode as well as in the Initiative Tracker when the encounter is launched.

#### Players

The `players` parameter can be used to filter the players stored in settings before starting the encounter.

If the `players` parameter is omitted, all players will be added to the encounter.

````
```encounter
players: false                          # No players will be added to the encounter.
players: none                           # Same as players: false
players: true                           # All players will be added. Same as omitting the parameter.
players:                                # Players will only be added to the encounter if they match the provided names.
 - Name
 - Name 2
```
````

#### Creatures

The most complicated parameter, `creatures` may be used to add additional creatures to the encounter.

The basic creature will be defined as an array with the syntax of `[name, hp, ac, initiative modifer]`.

**Please note that in all cases, hp, ac and the modifier are optional.**

````
```encounter
creatures:
  - My Monster                          # 1 monster named My Monster will be added, with no HP, AC or modifier.
  - Goblin, 7, 15, 2                    # 1 goblin with HP: 7, AC: 15, MOD: 2 will be added.
```
````

Multiple of the same creature may be added using `X: [name, hp, ac, initiative modifer]`, which will add `X` creatures:

````
```encounter
creatures:
  - 3: Goblin, 7, 15, 2                 # 3 goblins with HP: 7, AC: 15, MOD: 2 will be added.
```
````

You may _also_ add multiple creatures by simply adding additional lines; this will also allow you to change HP, AC and modifier values for different creatures:

````
```encounter
creatures:
  - 2: Goblin, 7, 15, 2                 # 2 goblins with HP: 7, AC: 15, MOD: 2 will be added.
  - Goblin, 6, 15, 2                    # 1 goblin with HP: 6, AC: 15, MOD: 2 will be added.
  - Goblin, 9, 15, 2                    # 1 goblin with HP: 9, AC: 15, MOD: 2 will be added.
```
````

##### Creatures from the Bestiary

Creatures from your bestiary can be added by their name. This includes the full SRD creature list as well as any homebrew creatures added in Settings.

````
```encounter
creatures:
  - 2: Goblin                           # 2 goblins with HP: 7, AC: 15, MOD: 2 will be added.
```
````

### Multiple Encounters

The encounter code block supports an arbitrary number of encounters in one block, separated using `---`:

````
```encounter
name: Example 1
creatures:
 - Hobgoblin
 - 3: Goblin

---

name: Example 2
creatures:
 - 3: Hobgoblin
 - Goblin

```
````

### Parameters

## Using the Initiative Tracker

Monsters may be added to the combat by clicking the `Add Creature` button, which will open a form where the creature's name, HP, AC and initiative can be set.

Once all of the creatures in a given combat have been added, initiatives can be modified by clicking on the initiative number and entering the new initiative. Names for non-player creatures can be modified in the same way.

### Actions

Creatures may be disabled or removed from the combat, or statuses (such as "poisoned") may be added in the `Actions` menu on the right of each creature.

### Controls

Combat can be started by clicking the `play` button. This will display the currently active creature. Clicking `next` or `previous` will move to the next enabled combatant.

Initiatives can be re-rolled for all creatures in the combat by clicking the `Re-roll Initiatives` button.

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

Homebrew creatures may be created and managed in settings. Homebrew creatures will be available in the monster picker when adding a creature to the combat.

### 5e Statblocks Plugin

If the [5e Statblocks](https://github.com/valentine195/obsidian-5e-statblocks) plugin is installed, the homebrew creatures saved to that plugin can be used in this plugin by enabling the sync in settings.

### Import Homebrew

**Only import content that you own.**

Homebrew creatures can be imported from DnDAppFile XML files or Improved Initiative JSON files in settings.

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
-   ~~An option to build an encounter in a Note and send it to Initiative Tracker on demand (e.g., in an Obsidian Note, create some code block indicating 3 Goblins and 1 Bugbear in an area; press a button, add the 3 Goblins and Bugbear to the Initiative tracker)~~
-   Encounter difficulty/XP tracker for creatures with CR
-   For the currently active creature, display any actions that would need a dice roll and an integrated dice roller with the specific dice and bonuses for the action already pre-loaded (e.g., for a Bugbear, display "Morningstar" and a to-hit dice with 1d20+4, as well as a damage dice of 2d8+2; Also display for the Javelin action)
-   Support for multiple parties
-   Integrated dice roller

# Installation

## From within Obsidian

From Obsidian v0.9.8, you can activate this plugin within Obsidian by doing the following:

-   Open Settings > Third-party plugin
-   Make sure Safe mode is **off**
-   Click Browse community plugins
-   Search for this plugin
-   Click Install
-   Once installed, close the community plugins window and activate the newly installed plugin

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

<a href="https://www.buymeacoffee.com/valentine195"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=valentine195&button_colour=e3e7ef&font_colour=262626&font_family=Inter&outline_colour=262626&coffee_colour=ff0000"></a>