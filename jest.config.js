module.exports = {
    preset: "ts-jest",
    moduleDirectories: ['node_modules', 'src', 'test'],
    moduleNameMapper: {
        "./player/PlayerView.svelte": "mocks/svelte.ts",
        "./ui/App.svelte": "mocks/svelte.ts",
        "./ui/Encounter.svelte": "mocks/svelte.ts",
        "./ui/EncounterLine.svelte": "mocks/svelte.ts",
        "./ui/EncounterTable.svelte": "mocks/svelte.ts",
        "./view/Builder.svelte": "mocks/svelte.ts",
        "obsidian": "mocks/obsidian.ts",
    },
    testMatch: ["**/test/**/*.test.ts"]
}
