# TTRPG Initiative Tracker for Obsidian.md

This plugin can be used as an initiative tracker within Obsidian.md.

When enabled, the plugin will add an additional view in the right pane, where players and creatures can be added to track their initiatives during combat.

Now features a Player View!

## Creature View

If the TTRPG Statblocks (version 2.0+) is installed, creatures may be viewed by clicking on them in the initiative tracker. A new view will open up with a rendered statblock.

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

> :warning: **Please Note**
>
> If a default [Party](#party) is defined, it will be used to control what players are added to an encounter.
>
> You can override this by specifying a different party, or specifying `party: none`

### Launching Encounters

An encounter can be launched by clicking the "Begin Encounter" button. This will launch a **new encounter** as defined.

Alternatively, the "Add to Encounter" button can be used to add the specified creatures to an existing encounter.

### Encounter Tables

Alternatively to the encounter blocks shown above, you can create encounter tables using the `encounter-table` code block.

Each encounter defined using the [Multiple Encounters](#multiple-encounters) syntax will be added to the table as a row. Encounter tables supports the full list of parameters shown in [Parameters](#parameters) below.

For example:

````
```encounter-table
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

<img src="https://raw.githubusercontent.com/valentine195/obsidian-initiative-tracker/master/assets/encounter-table.PNG">

### Inline Encounters

Inline encounters can be created using the `` `encounter: <creatures>` `` syntax.

Creatures should be formatted as normal, but separated by commas.

For example:

`` `encounter: 3: Hobgoblin, 1d5: Goblin, Custom Monster` ``

> :warning: **Please note:**
>
> It is not possible to customize monster stats or control players using the inline syntax.

This syntax enables Encounters to be used in [Dice Roller](https://github.com/valentine195/obsidian-dice-roller) lookup tables!

```md
| 1d2 | Encounter                                      |
| --- | ---------------------------------------------- |
| 1   | `encounter: 3: Hobgoblin, 1d5: Goblin, Custom` |
| 2   | `encounter: 2 Hobgoblin`                       |

^test-encounter

`dice: [[Encounter#^test-encounter]]`
```

### Parameters

There are 3 parameters for each encounter, with more detail below.

````
```encounter
name: string                            # Name of the encounter. Optional.
rollHP: boolean                         # Override the global plugin.
party: string                           # Name of Party to use. Overrides any defined players. Optional.
players: boolean | string | array       # Which players to include. Optional.
creatures: array                        # Array of creatures to include in the encounter. Optional.
```
````

#### Name

The name of the encounter, which will be displayed both in Preview mode as well as in the Initiative Tracker when the encounter is launched.

#### Roll HP

This can be used to override the global Roll HP setting. Any creature in the encounter with the `hit_dice` property set will roll for HP when being added to the encounter.

#### Party

The `party` parameter specifies what party to use for this encounter. **If a default party is set in settings, it will be used if this parameter is not provided.**

This parameter _always_ takes precendence over the `players` parameter.

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

The basic creature will be defined as an array with the syntax of `[name, hp, ac, initiative modifer, xp]`.

**Please note that in all cases, hp, ac, the modifier, and xp are optional.**

````
```encounter
creatures:
  - My Monster                          # 1 monster named My Monster will be added, with no HP, AC or modifier.
  - Goblin, 7, 15, 2                    # 1 goblin with HP: 7, AC: 15, MOD: 2 will be added.
  - Goblin, 5, 15, 2, 25                # 1 goblin with HP: 7, AC: 15, MOD: 2 worth 25 XP will be added.
```
````

Multiple of the same creature may be added using `X: [name, hp, ac, initiative modifer, xp]`, which will add `X` creatures:

````
```encounter
creatures:
  - 3: Goblin, 7, 15, 2                 # 3 goblins with HP: 7, AC: 15, MOD: 2 will be added.
  - 2: Goblin, 5, 15, 2, 25             # 2 goblins with HP: 7, AC: 15, MOD: 2 worth 25 XP will be added.
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

##### Display Name

You can also create creatures using the any of the following syntaxes to give them display names:

````
```encounter
creatures:
  - [[Hobgoblin, Bob]]          # 1 Hobgoblin named Bob
  -                             # 1 Hobgoblin named Jim with 12 HP, 13 AC, +2 to initiative that
    - [Hobgoblin, Jim]          # is worth 25 XP
    - 12
    - 13
    - 2
    - 25
  - 2:                          # 2 Hobgoblins named Jeff with 12 HP and 13 AC.
    - [Hobgoblin, Jeff]
    - 12
    - 13
  - 5:                          # 5 Hobgoblins named Ted with 12 HP and 13 AC.
      creature: Hobgoblin
      name: Ted
      hp: 12
      ac: 13
  - 1d5:                        # 1d5 Hobgoblins named Sarah with 12 HP and 13 AC.
      creature: Hobgoblin
      name: Sarah
      hp: 12
      ac: 13
```
````

Please note that the plugin will still group equivalent creatures together, but it will take into account display name when grouping.

##### Using Dice Rolls

Creatures may also be specified by a dice roll if the [Dice Roller](https://github.com/valentine195/obsidian-dice-roller) plugin is installed. The plugin will still collapse creatures that are the same into one group, but a Dice Roller with the combined formula will be added to the block.

![](https://raw.githubusercontent.com/valentine195/obsidian-initiative-tracker/master/assets/dice-encounter.png)

Clicking the dice roller will re-roll the number of creatures. This number **is not persistent**, but when you launch the encounter, the encounter will use the number of creatures shown.

##### Creatures from the Bestiary

Creatures from your bestiary can be added by their name. This includes the full SRD creature list as well as any homebrew creatures added in Fantasy Statblocks.

````
```encounter
creatures:
  - 2: Goblin                           # 2 goblins with HP: 7, AC: 15, MOD: 2 will be added.
```
````

Creatures from the SRD Bestiary will auto-calculate their XP based on their challenge rating. Otherwise, you can supply a creature either a CR or an XP when creating it in the Fantasy Statblocks plugin.

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

## Using the Initiative Tracker

Monsters may be added to the combat by clicking the `Add Creature` button, which will open a form where the creature's name, HP, AC and initiative can be set.

### Initiatives

Once all of the creatures in a given combat have been added, initiatives can be modified by clicking on the initiative number and entering the new initiative.

### HP

Creatures can take damage, be healed or gain temporary HP by clicking on their HP.

#### Rolling HP

If a creature's `hit_dice` property is set (whether from the add menu or in the bestiary), there is the option to Roll for HP. This can be set globally in settings, per-encounter, or when adding creatures to a combat.

### Actions

Creatures may be edited, disabled / removed from the combat in the `Actions` menu located to the right of each creature.

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

#### Applying Damage And Status Effects

Creatures can be selected for damage and status effect application by clicking on their HP display, making them appear in a separate table where application can be adjusted.

Right clicking (or clicking the creature's edit menu) and selecting "Set HP/Status" or <kbd>Ctrl<kbd>-clicking a creature will also open or add them to the table.

#### Next Combatant

If the encounter is active, this command can be used to make the next enabled combatant active (similar to clicking the `Next` button).

#### Previous Combatant

If the encounter is active, this command can be used to make the previous enabled combatant active (similar to clicking the `Previous` button).

### The Tracker Menu

The Initiative Tracker has a tracker menu located in the top right of the view. This can be used to do several things, such as creating a new encounter, resetting HP, or changing parties.

<img height="200" src="https://raw.githubusercontent.com/valentine195/obsidian-initiative-tracker/master/assets/menu.gif"></img>

#### New Encounter

This will clear any creatures from the encounter, reset HP and status effects, enable all party members, and roll new initiatives.

#### Reset HP & Status

This will reset all creature's (including party members) HP and status effects, but will _not_ roll new initiatives or re-enable disabled creatures.

#### Re-roll Initiatives

This will re-roll initiatives for _all_ creatures, including players.

#### Switch Party

All players will be removed from the encounter and replaced with the new party members.

Please note that if the same player is in both parties, they will receive a new initiative.

#### Group / Ungroup Creatures

Any equivalent creatures (Name and AC are the same) will be "grouped" and roll a single initiative value.

#### Saving Encounters

If an encounter is in-progress (combat has been started), the plugin will automatically track it and reload the encounter state when Obsidian is re-opened.

You can also save and load encounters by opening the initiative tracker menu and choosing "Save Encounter" or "Load Encounter".

Saving an encounter saves a **snapshot** of the encounter at that moment. Any further changes to the encounter will not be saved -- it must be saved again.

![](https://raw.githubusercontent.com/valentine195/obsidian-initiative-tracker/master/assets/save-encounter.png)

#### Open Leaflet Map

This will open a battlemap using the [Obsidian Leaflet](https://github.com/valentine195/obsidian-leaflet-plugin) plugin, if it is [enabled in settings](#integrate-with-obsidian-leaflet).

# Settings

The setting tab has several options for adding and managing players and homebrew creatures, as well as the ability to change the formula used to calculate the initiative.

## Basic Settings

### Display Beginner Tips

`Default: Enabled`

Display instructions in the intiative tracker, helping you get used to the workflow.

### Display Encounter Difficulty

`Default: Enabled`

The plugin will calculate and display encounter difficulty based on the challenge rating of the creatures and levels of your party members.

Creatures and players without this information will be ignored for the calculation.

### Roll Equivalent Creatures Together

`Default: Enabled`

Equivalent creatures (same HP, AC, and Name) will roll initiatives as a group.

## Battle

### Clamp Minimum HP

`default: Enabled`

When a creature takes damage that would reduce its HP below 0, its HP is set to 0 instead.

### Overflow Healing

`default: Ignore`

Set what happens to healing which goes above creatures' max HP threshold.

-   Ignore: Any healing above the creature's max HP is ignored
-   Temp: Any healing above the creature's max HP is added as temporary HP
-   Current: Any healing above the creature's max HP is added to the current HP total

### Automatic Unconscious Status Application

`Default: Enabled`

When a creature takes damage that would reduce its HP below 0, it gains the "Unconscious" status effect.

### Additive Temporary HP

`Default: Disabled`

Any temporary HP added to a creature will be added on top of exsiting temporary HP.

### Roll for HP

Enable this setting to automatically roll HP for any creature that has the `hit_dice` property set in the bestiary.

### Logging

Enables a logging system that will log actions taken during encounters. Each new encounter will create a new log file.

### Log folder

New log files will be placed here.

## Players

Players added here will be available to add to [Parties](#parties).

If you do not have any parties, all the players added here will be considered as a default party and will all be added to new encounters.

### Players from Notes

When adding a new player, there is the option to add a player based on a note.

The plugin will keep the player's data in sync with the frontmatter if it is changed.

Frontmatter should be formatted like this (all fields are optional):

```
---
hp: 23
ac: 17
modifier: 2
level: 2
---
```

## Parties

Parties allow you to create different groups of your players. Each player can be a member of multiple parties.

You can set a default party for encounters to use, or specify the party for the encounter in the encounter block. While running an encounter in the tracker, you can change the active party, allowing you to quickly switch which players are in combat.

## Statuses

Add and manage statuses available to apply to creatures here.

If any default statuses are deleted, you can re-add them by clicking the "Re-add Default Statuses" button. This button is only available if default statuses have been deleted.

## Plugin Integrations

### Sync Monsters from TTRPG Statblocks Plugin

`Default: Disabled`
If the [5e Statblocks](https://github.com/valentine195/obsidian-5e-statblocks) plugin is installed, the homebrew creatures saved to that plugin can be used in this plugin by enabling the sync in settings.

### Initiative Formula

`Default: 1d20 + %mod%`

> This setting can only be modified when the [Dice Roller](https://github.com/valentine195/obsidian-dice-roller) plugin is installed.

This setting can be used to modify how a creature's initiative is calculated by the plugin. Use `%mod%` as a placeholder for the creature's initiative modifier.

This will support any dice formula supported by the Dice Roller plugin.

### Integrate with Obsidian Leaflet

`Default: Disabled`

If the [Obsidian Leaflet](https://github.com/valentine195/obsidian-leaflet-plugin) plugin is installed, it can be used as a battle map for encounters by turning this setting on.

# Roadmap

This is a list of features that are planned for the plugin. Some of these may or may not be developed.

-   Wikilink Player Characters
    -   Automatically pull HP/AC from PC Note Wikilinked in settings
-   Wikilink Creatures
    -   stat blocks on hover
-   Wikilink Tags (e.g., condition tag to display condition rules, spell tags for spell effects, etc.)
    ~~- Creature stat blocks in separate moveable tab of sidebar~~
    ~~- auto-update displayed stat block based on active creature in the encounter~~
-   ~~An option to build an encounter in a Note and send it to Initiative Tracker on demand (e.g., in an Obsidian Note, create some code block indicating 3 Goblins and 1 Bugbear in an area; press a button, add the 3 Goblins and Bugbear to the Initiative tracker)~~
-   ~~Encounter difficulty/XP tracker for creatures with CR~~
    ~~- For the currently active creature, display any actions that would need a dice roll and an integrated dice roller with the specific dice and bonuses for the action already pre-loaded (e.g., for a Bugbear, display "Morningstar" and a to-hit dice with 1d20+4, as well as a damage dice of 2d8+2; Also display for the Javelin action)~~
-   Support for multiple parties
    ~~- Integrated dice roller~~

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
