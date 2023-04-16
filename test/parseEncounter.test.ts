import { App, PluginManifest, parseYaml } from 'obsidian';
import YAML from 'yaml';
import InitiativeTracker from '../src/main';
import { EncounterParameters, EncounterParser, ParsedParams } from '../src/encounter';
import { DEFAULT_SETTINGS } from '../src/utils/constants';
import { BESTIARY } from '../src/utils/srd-bestiary';
import type { Creature } from '../src/utils/creature';

export const MANIFEST: PluginManifest = {
    "id": "initiative-tracker",
    "name": "Initiative Tracker",
    "version": "9.5.0",
    "minAppVersion": "0.15.0",
    "author": "Jeremy Valentine",
    "description": ""
}

jest.mock('obsidian', () => ({
    App: jest.fn().mockImplementation(),
    Platform: jest.fn().mockImplementation(() => {
        return {
            isMobile: false,
        };
    }),
    MarkdownRenderChild: jest.fn().mockImplementation(),
    parseYaml: (yaml: string) => YAML.parse(yaml),
}));

jest.mock('../src/main', () => {
    return jest.fn().mockImplementation(() => {
        return {
            defaultParty: [],
            bestiary: BESTIARY,
            homebrew: [],
            data: DEFAULT_SETTINGS
        };
    });
});

describe('Encounter Parser', () => {
    const plugin = new InitiativeTracker(new App(), MANIFEST);
    const parser = new EncounterParser(plugin);

    test('parseEncounter: single line', async () => {
        // Rat, Giant is not in the SRD, so it should be treated as a custom creature
        // will use the name Snuggletooth (adorable), but no other stats
        const encounter = `2: [["Rat, Giant", Snuggletooth]]`;

        const params: EncounterParameters = {};
        params.creatures = parseYaml('[' + encounter + ']');

        const result: ParsedParams = await parser.parse(params);
        expect(result).toHaveProperty('creatures');
        expect(result.creatures.size).toBe(1);

        const creature: Creature = result.creatures.keys().next().value;
        const amount = result.creatures.get(creature);
        expect(creature.name).toBe('Rat, Giant');
        expect(creature.display).toBe('Snuggletooth');
        expect(creature.hp).toBeUndefined();
        expect(creature.ac).toBeUndefined();
        expect(creature.modifier).toBe(0); // 0 is the default
        expect(creature.friendly).toBe(false);
        expect(amount).toBe(2);
    });

    test('parseEncounter: single line friend', async () => {
        // Rat, Giant is not in the SRD, so it should be treated as a custom creature
        // will use assigned values and the name Snuggletooth
        const encounter = `2: [["Rat, Giant", Snuggletooth], 12, 13,ally]`;

        const params: EncounterParameters = {};
        params.creatures = parseYaml('[' + encounter + ']');

        const result: ParsedParams = await parser.parse(params);
        expect(result).toHaveProperty('creatures');
        expect(result.creatures.size).toBe(1);

        const creature: Creature = result.creatures.keys().next().value;
        const amount = result.creatures.get(creature);
        expect(creature.name).toBe('Rat, Giant');
        expect(creature.display).toBe('Snuggletooth');
        expect(creature.hp).toBe(12);
        expect(creature.ac).toBe(13);
        expect(creature.modifier).toBe(0); // 0 is the default
        expect(creature.friendly).toBe(true);
        expect(amount).toBe(2);
    });


    test('parseEncounter: creature stats', async () => {
        // Goblins are found in the SRD (7 hp, 15, ac, +2 modifier)
        // goblins w/ the same stats are combined

        const encounter = `
creatures:
- My Monster
- Goblin, friend
- Goblin, 5, 15, 2, 25
- 2: Goblin, 5, 15, 2, 25
`;
        const params: EncounterParameters = parseYaml(encounter);

        const result = await parser.parse(params);
        expect(result).toHaveProperty('creatures');
        expect(result.creatures.size).toBe(3); 

        const k = result.creatures.keys();

        let creature: Creature = k.next().value;
        let amount = result.creatures.get(creature);
        expect(creature.name).toBe('My Monster');
        expect(creature.hp).toBeUndefined();
        expect(creature.ac).toBeUndefined();
        expect(creature.modifier).toBe(0); // 0 is the default
        expect(creature.friendly).toBe(false);
        expect(amount).toBe(1);

        creature = k.next().value;
        amount = result.creatures.get(creature);
        expect(creature.name).toBe('Goblin');
        expect(creature.hp).toBe(7);
        expect(creature.ac).toBe(15);
        expect(creature.modifier).toBe(2);
        expect(creature.friendly).toBe(true);
        expect(amount).toBe(1);

        creature = k.next().value;
        amount = result.creatures.get(creature);
        expect(creature.name).toBe('Goblin');
        expect(creature.hp).toBe(5);
        expect(creature.ac).toBe(15);
        expect(creature.modifier).toBe(2);
        expect(creature.friendly).toBe(false);
        expect(amount).toBe(3);
    });


    test('parseEncounter: creature names', async () => {
        // Giant Rat called TeddyBear is in the SRD
        // Giant Rat called Snuggletooth overrides those stats (and is combined across two formats)
        // Giant Rat called Sarah uses same stats as Snuggletooth, but is not combined
        const encounter = `
creatures:
- 2: [["Giant Rat", "TeddyBear"]]
- [["Giant Rat", Snuggletooth], 12, 13]
-
    - ["Giant Rat", Snuggletooth]
    - 12
    - 13
- 1d5:
    creature: "Giant Rat"
    name: Sarah
    hp: 12
    ac: 13
    friend: true
`;

        const params: EncounterParameters = parseYaml(encounter);
        const result = await parser.parse(params);
        expect(result).toHaveProperty('creatures');
        expect(result.creatures.size).toBe(3); // goblins w/ the same stats are combined

        const k = result.creatures.keys();

        let creature: Creature = k.next().value;
        let amount = result.creatures.get(creature);
        expect(creature.name).toBe('Giant Rat');
        expect(creature.hp).toBe(7);
        expect(creature.ac).toBe(12);
        expect(creature.modifier).toBe(2);
        expect(creature.friendly).toBe(false);
        expect(amount).toBe(2);

        creature = k.next().value;
        amount = result.creatures.get(creature);
        expect(creature.name).toBe('Giant Rat');
        expect(creature.display).toBe('Snuggletooth');
        expect(creature.hp).toBe(12);
        expect(creature.ac).toBe(13);
        expect(creature.modifier).toBe(2);
        expect(creature.friendly).toBe(false);
        expect(amount).toBe(2);

        creature = k.next().value;
        amount = result.creatures.get(creature);
        expect(creature.name).toBe('Giant Rat');
        expect(creature.display).toBe('Sarah');
        expect(creature.hp).toBe(12);
        expect(creature.ac).toBe(13);
        expect(creature.modifier).toBe(2);
        expect(creature.friendly).toBe(true);
        expect(amount).toBeGreaterThan(0);
        expect(amount).toBeLessThan(6);
    });


    test('parseEncounter: creature names', async () => {
        // Hobgoblins are found in the SRD
        // Most have different names and/or stats.. some gotchas
        const encounter = `
creatures:
- [[Hobgoblin, Bob]]
-
    - [Hobgoblin, Jim]
    - 12
    - 13
    - 2
    - 25
- [[Hobgoblin, Jim], 12, 13, 2, 25]
- 2:
    - [Hobgoblin, Jeff]
    - 21
    - 13
- 2: [[Hobgoblin, Jim], 12, 13, friend]
- 5:
    creature: Hobgoblin
    name: Ted
    hp: 12
    ac: 13
- 1d5:
    creature: Hobgoblin
    name: Sarah
    hp: 36
    ac: 13
    friend: true
`;

        const params: EncounterParameters = parseYaml(encounter);
        const result = await parser.parse(params);

        let k = result.creatures.keys();

        let creature: Creature = k.next().value;
        let amount = result.creatures.get(creature);
        expect(creature.name).toBe('Hobgoblin');
        expect(creature.display).toBe('Bob');
        expect(creature.hp).toBe(11);
        expect(creature.ac).toBe(18);
        expect(creature.modifier).toBe(1);
        expect(creature.friendly).toBe(false);
        expect(creature.xp).toBe(100);
        expect(amount).toBe(1);

        creature = k.next().value;
        amount = result.creatures.get(creature);
        expect(creature.name).toBe('Hobgoblin');
        expect(creature.display).toBe('Jim');
        expect(creature.hp).toBe(12);
        expect(creature.ac).toBe(13);
        expect(creature.modifier).toBe(2);
        expect(creature.xp).toBe(25);
        expect(creature.friendly).toBe(false);
        expect(amount).toBe(2);

        creature = k.next().value;
        amount = result.creatures.get(creature);
        expect(creature.name).toBe('Hobgoblin');
        expect(creature.display).toBe('Jeff');
        expect(creature.hp).toBe(21);
        expect(creature.ac).toBe(13);
        expect(creature.modifier).toBe(1);
        expect(creature.xp).toBe(100);
        expect(creature.friendly).toBe(false);
        expect(amount).toBe(2);

        creature = k.next().value;
        amount = result.creatures.get(creature);
        expect(creature.name).toBe('Hobgoblin');
        expect(creature.display).toBe('Jim');
        expect(creature.hp).toBe(12);
        expect(creature.ac).toBe(13);
        expect(creature.modifier).toBe(1);
        expect(creature.xp).toBe(100);
        expect(creature.friendly).toBe(true);
        expect(amount).toBe(2);

        creature = k.next().value;
        amount = result.creatures.get(creature);
        expect(creature.name).toBe('Hobgoblin');
        expect(creature.display).toBe('Ted');
        expect(creature.hp).toBe(12);
        expect(creature.ac).toBe(13);
        expect(creature.modifier).toBe(1);
        expect(creature.xp).toBe(100);
        expect(creature.friendly).toBe(false);
        expect(amount).toBe(5);

        creature = k.next().value;
        amount = result.creatures.get(creature);
        expect(creature.name).toBe('Hobgoblin');
        expect(creature.display).toBe('Sarah');
        expect(creature.hp).toBe(36);
        expect(creature.ac).toBe(13);
        expect(creature.modifier).toBe(1);
        expect(creature.xp).toBe(100);
        expect(creature.friendly).toBe(true);
        expect(amount).toBeGreaterThan(0);
        expect(amount).toBeLessThan(6);
    });
});