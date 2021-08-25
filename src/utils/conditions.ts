import type { Condition } from "../../@types";

export const Conditions: Condition[] = [
    {
        name: "Blinded",
        description: [
            "A blinded creature can’t see and automatically fails any ability check that requires sight.",
            "Attack rolls against the creature have advantage, and the creature’s Attack rolls have disadvantage."
        ]
    },
    {
        name: "Charmed",
        description: [
            "A charmed creature can’t Attack the charmer or target the charmer with harmful Abilities or magical Effects.",
            "The charmer has advantage on any ability check to interact socially with the creature."
        ]
    },
    {
        name: "Concentrating",
        description: [
            "Some spells require you to maintain concentration in order to keep their magic active. If you lose concentration, such a spell ends.",
            "A creature loses concentration when: it casts another spell that requires concentration, is incapacitated, or dies.",
            "When a creature takes damage, it must make a constitution saving throw with a DC of 10 or half the damage it took, whichever is higher. On a failure, concentration is lost."
        ]
    },
    {
        name: "Deafened",
        description: [
            "A deafened creature can’t hear and automatically fails any ability check that requires hearing."
        ]
    },
    {
        name: "Frightened",
        description: [
            "A frightened creature has disadvantage on Ability Checks and Attack rolls while the source of its fear is within Line of Sight.",
            "The creature can’t willingly move closer to the source of its fear."
        ]
    },
    {
        name: "Grappled",
        description: [
            "A grappled creature’s speed becomes 0, and it can’t benefit from any bonus to its speed.",
            "The condition ends if the Grappler is incapacitated.",
            "The condition also ends if an Effect removes the grappled creature from the reach of the Grappler or Grappling Effect, such as when a creature is hurled away by the Thunderwave spell."
        ]
    },
    {
        name: "Incapacitated",
        description: ["An incapacitated creature can’t take Actions or Reactions."]
    },
    {
        name: "Invisible",
        description: [
            "An invisible creature is impossible to see without the aid of magic or a Special sense. For the Purpose of Hiding, the creature is heavily obscured. The creature’s Location can be detected by any noise it makes or any tracks it leaves.",
            "Attack rolls against the creature have disadvantage, and the creature’s Attack rolls have advantage."
        ]
    },
    {
        name: "Paralyzed",
        description: [
            "A paralyzed creature is incapacitated and can’t move or speak.",
            "The creature automatically fails Strength and Dexterity Saving Throws.",
            "Attack rolls against the creature have advantage.",
            "Any Attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature."
        ]
    },
    {
        name: "Petrified",
        description: [
            "A petrified creature is transformed, along with any nonmagical object it is wearing or carrying, into a solid inanimate substance (usually stone). Its weight increases by a factor of ten, and it ceases aging.",
            "The creature is incapacitated, can’t move or speak, and is unaware of its surroundings.",
            "Attack rolls against the creature have advantage.",
            "The creature automatically fails Strength and Dexterity Saving Throws.",
            "The creature has Resistance to all damage.",
            "The creature is immune to poison and disease, although a poison or disease already in its system is suspended, not neutralized."
        ]
    },
    {
        name: "Poisoned",
        description: [
            "A poisoned creature has disadvantage on Attack rolls and Ability Checks."
        ]
    },
    {
        name: "Prone",
        description: [
            "A prone creature’s only Movement option is to crawl, unless it stands up and thereby ends the condition.",
            "The creature has disadvantage on Attack rolls.",
            "An Attack roll against the creature has advantage if the attacker is within 5 feet of the creature. Otherwise, the Attack roll has disadvantage."
        ]
    },
    {
        name: "Reacted",
        description: [
            "A creature, unless otherwise specified, gets one reaction per round of combat.",
            "A reaction is an instant response to a trigger of some kind, which can occur on your turn or on someone else’s.",
            "A reaction can be spent to make an opportunity attack, do a readied action, or use an ability that requires a reaction.",
            "A creature that has already reacted cannot use a reaction until the start of its turn."
        ]
    },
    {
        name: "Restrained",
        description: [
            "A restrained creature’s speed becomes 0, and it can’t benefit from any bonus to its speed.",
            "Attack rolls against the creature have advantage, and the creature’s Attack rolls have disadvantage.",
            "The creature has disadvantage on Dexterity Saving Throws."
        ]
    },
    {
        name: "Stunned",
        description: [
            "A stunned creature is incapacitated, can’t move, and can speak only falteringly.",
            "The creature automatically fails Strength and Dexterity Saving Throws.",
            "Attack rolls against the creature have advantage."
        ]
    },
    {
        name: "Unconscious",
        description: [
            "An unconscious creature is incapacitated, can’t move or speak, and is unaware of its surroundings.",
            "The creature drops whatever it’s holding and falls prone.",
            "The creature automatically fails Strength and Dexterity Saving Throws.",
            "Attack rolls against the creature have advantage.",
            "Any Attack that hits the creature is a critical hit if the attacker is within 5 feet of the creature."
        ]
    },
];
