import { ItemView, Platform, WorkspaceLeaf } from "obsidian";
import { BASE, INTIATIVE_TRACKER_VIEW, MIN_WIDTH_FOR_HAMBURGER } from "./utils";

import type InitiativeTracker from "./main";

import App from "./svelte/App.svelte";
import { Creature } from "./utils/creature";
import type {
    Condition,
    InitiativeViewState,
    TrackerEvents,
    TrackerViewState
} from "@types";

export default class TrackerView extends ItemView {
    public creatures: Creature[] = [];
    public current: number = 0;

    public state: boolean = false;

    public name: string;

    private _app: App;
    private _rendered: boolean = false;

    get pcs() {
        return this.players;
    }
    get npcs() {
        return this.creatures.filter((c) => !c.player);
    }

    get players() {
        return Array.from(this.plugin.playerCreatures.values());
    }

    updatePlayers() {
        this.trigger("initiative-tracker:players-updated", this.pcs);
        this.setAppState({
            creatures: this.ordered
        });
    }

    updateState() {
        this.setAppState(this.appState);
    }

    constructor(public leaf: WorkspaceLeaf, public plugin: InitiativeTracker) {
        super(leaf);

        if (this.plugin.data.state?.creatures?.length) {
            this.newEncounterFromState(this.plugin.data.state);
        } else {
            this.newEncounter();
        }

        this.registerEvent(
            this.app.workspace.on(
                "initiative-tracker:add-creature-here",
                async (latlng: L.LatLng) => {
                    this.app.workspace.revealLeaf(this.leaf);
                    let addNewAsync = this._app.$on("add-new-async", (evt) => {
                        const creature = evt.detail;
                        this._addCreature(creature);

                        this.trigger(
                            "initiative-tracker:creature-added-at-location",
                            creature,
                            latlng
                        );
                        addNewAsync();
                        cancel();
                    });
                    let cancel = this._app.$on("cancel-add-new-async", () => {
                        addNewAsync();
                        cancel();
                    });
                    this._app.$set({ addNewAsync: true });
                }
            )
        );
        this.registerEvent(
            this.app.workspace.on(
                "initiative-tracker:creature-updated-in-settings",
                (creature: Creature) => {
                    const existing = this.creatures.find((c) => c == creature);

                    if (existing) {
                        this.updateCreature(existing, creature);
                    }
                }
            )
        );
        this.registerEvent(
            this.app.workspace.on(
                "initiative-tracker:remove",
                (creature: Creature) => {
                    const existing = this.creatures.find(
                        (c) => c.id == creature.id
                    );

                    if (existing) {
                        this.removeCreature(existing);
                    }
                }
            )
        );
        this.registerEvent(
            this.app.workspace.on(
                "initiative-tracker:enable-disable",
                (creature: Creature, enable: boolean) => {
                    const existing = this.creatures.find(
                        (c) => c.id == creature.id
                    );

                    if (existing) {
                        this.setCreatureState(existing, enable);
                    }
                }
            )
        );
        this.registerEvent(
            this.app.workspace.on(
                "initiative-tracker:apply-damage",
                (creature: Creature) => {
                    const existing = this.creatures.find(
                        (c) => c.id == creature.id
                    );

                    if (existing) {
                        this.setAppState({
                            updatingHP: existing
                        });
                    }
                }
            )
        );
        this.registerEvent(
            this.app.workspace.on(
                "initiative-tracker:add-status",
                (creature: Creature) => {
                    const existing = this.creatures.find(
                        (c) => c.id == creature.id
                    );

                    if (existing) {
                        this.setAppState({
                            updatingStatus: existing
                        });
                    }
                }
            )
        );
    }
    newEncounterFromState(initiativeState: InitiativeViewState) {
        if (!initiativeState || !initiativeState?.creatures.length) {
            this.newEncounter();
        }
        const { creatures, state, name, current } = initiativeState;
        this.creatures = [...creatures.map((c) => Creature.fromJSON(c))];

        if (name) {
            this.name = name;
            this.setAppState({
                name: this.name
            });
        }
        this.state = state;
        this.current = current;
        this.trigger("initiative-tracker:new-encounter", this.appState);

        this.setAppState({
            creatures: this.ordered
        });
    }
    private _addCreature(creature: Creature) {
        this.creatures.push(creature);

        this.setAppState({
            creatures: this.ordered
        });
    }
    onResize() {
        if (!this.leaf.getRoot() || !this.leaf.getRoot().containerEl) return;
        if (Platform.isMobile) return;

        this.setAppState({
            show:
                this.leaf.getRoot().containerEl.clientWidth <
                MIN_WIDTH_FOR_HAMBURGER
        });
    }
    get ordered() {
        this.creatures.sort((a, b) => b.initiative - a.initiative);

        return this.creatures;
    }

    get enabled() {
        return this.ordered
            .map((c, i) => c.enabled && i)
            .filter((i) => typeof i === "number");
    }

    addCreatures(...creatures: Creature[]) {
        for (let creature of creatures) {
            this.creatures.push(creature);
        }

        this.trigger("initiative-tracker:creatures-added", creatures);

        this.setAppState({
            creatures: this.ordered
        });
    }

    removeCreature(...creatures: Creature[]) {
        for (let creature of creatures) {
            this.creatures = this.creatures.filter((c) => c != creature);
        }

        this.trigger("initiative-tracker:creatures-removed", creatures);
        this.setAppState({
            creatures: this.ordered
        });
    }

    async newEncounter({
        name,
        players = true,
        creatures = [],
        roll = true
    }: {
        name?: string;
        players?: boolean | string[];
        creatures?: Creature[];
        roll?: boolean;
    } = {}) {
        if (players instanceof Array && players.length) {
            this.creatures = [
                ...this.players.filter((p) => players.includes(p.name))
            ];
        } else if (players === true) {
            this.creatures = [...this.players];
        } else {
            this.creatures = [];
        }
        if (creatures) this.creatures = [...this.creatures, ...creatures];

        if (name) {
            this.name = name;
            this.setAppState({
                name: this.name
            });
        }

        for (let creature of this.creatures) {
            creature.enabled = true;
        }

        this.trigger("initiative-tracker:new-encounter", this.appState);

        if (roll) await this.rollInitiatives();
        else {
            this.setAppState({
                creatures: this.ordered
            });
        }
    }

    resetEncounter() {
        for (let creature of this.creatures) {
            creature.hp = creature.max;
            this.setCreatureState(creature, true);
            const statuses = Array.from(creature.status);
            statuses.forEach((status) => {
                this.removeStatus(creature, status);
            });
        }

        this.current = this.enabled[0];

        this.setAppState({
            creatures: this.ordered
        });
    }
    setMapState(v: boolean) {
        this.setAppState({
            map: v
        });
    }
    async getInitiativeValue(modifier: number = 0): Promise<number> {
        let initiative = Math.floor(Math.random() * 19 + 1) + modifier;
        if (this.plugin.canUseDiceRoller) {
            const num = await this.plugin.app.plugins.plugins[
                "obsidian-dice-roller"
            ].parseDice(
                this.plugin.data.initiative.replace(/%mod%/g, `(${modifier})`)
            );

            initiative = num.result;
        }
        return initiative;
    }

    async rollInitiatives() {
        for (let creature of this.creatures) {
            creature.initiative = await this.getInitiativeValue(
                creature.modifier
            );
        }

        this.setAppState({
            creatures: this.ordered
        });
    }
    get appState(): TrackerViewState {
        return {
            state: this.state,
            current: this.current,
            pcs: this.pcs,
            npcs: this.npcs,
            creatures: this.ordered
        };
    }
    goToNext() {
        const current = this.enabled.indexOf(this.current);

        const next =
            (((current + 1) % this.enabled.length) + this.enabled.length) %
            this.enabled.length;

        this.current = this.enabled[next];

        this.trigger(
            "initiative-tracker:active-change",
            this.ordered[this.current]
        );

        this.setAppState({
            state: this.state,
            current: this.current
        });
    }
    goToPrevious() {
        const current = this.enabled.indexOf(this.current);
        const next =
            (((current - 1) % this.enabled.length) + this.enabled.length) %
            this.enabled.length;

        this.current = this.enabled[next];

        this.trigger(
            "initiative-tracker:active-change",
            this.ordered[this.current]
        );

        this.setAppState({
            state: this.state,
            current: this.current
        });
    }
    toggleState() {
        this.state = !this.state;

        if (this.state) {
            this.current = this.enabled[0];

            this.trigger(
                "initiative-tracker:active-change",
                this.ordered[this.current]
            );
        } else {
            this.trigger("initiative-tracker:active-change", null);
        }

        this.setAppState({
            state: this.state,
            current: this.current
        });
    }
    addStatus(creature: Creature, tag: Condition) {
        creature.status.add(tag);

        this.trigger("initiative-tracker:creature-updated", creature);

        this.setAppState({
            creatures: this.ordered
        });
    }
    removeStatus(creature: Creature, tag: Condition) {
        creature.status.delete(tag);

        this.trigger("initiative-tracker:creature-updated", creature);

        this.setAppState({
            creatures: this.ordered
        });
    }
    updateCreature(
        creature: Creature,
        {
            hp,
            ac,
            initiative,
            name,
            marker
        }: {
            hp?: number;
            ac?: number;
            initiative?: number;
            name?: string;
            marker?: string;
        }
    ) {
        if (initiative) {
            creature.initiative = Number(initiative);
        }
        if (name) {
            creature.name = name;
        }
        if (hp) {
            creature.hp += Number(hp);
        }
        if (ac) {
            creature.ac = ac;
        }
        if (marker) {
            creature.marker = marker;
        }

        this.trigger("initiative-tracker:creature-updated", creature);

        this.setAppState({
            creatures: this.ordered
        });
    }
    async copyInitiativeOrder() {
        const contents = this.ordered
            .map((creature) => `${creature.initiative} ${creature.name}`)
            .join("\n");
        await navigator.clipboard.writeText(contents);
    }
    setCreatureState(creature: Creature, enabled: boolean) {
        if (enabled) {
            this._enableCreature(creature);
        } else {
            this._disableCreature(creature);
        }
        if (!this.enabled.length) {
            this.current = null;
        }

        this.trigger("initiative-tracker:creature-updated", creature);

        this.setAppState({
            creatures: this.ordered,
            current: this.current
        });
    }
    private _enableCreature(creature: Creature) {
        creature.enabled = true;

        if (this.enabled.length == 1) {
            this.current = this.enabled[0];
        }
    }
    private _disableCreature(creature: Creature) {
        if (this.ordered[this.current] == creature) {
            this.goToNext();
        }
        creature.enabled = false;
    }

    setAppState(state: { [key: string]: any }) {
        if (this._app && this._rendered) {
            this.plugin.app.workspace.trigger(
                "initiative-tracker:state-change",
                this.appState
            );
            this._app.$set(state);
        }

        this.plugin.data.state = this.toState();
        this.trigger("initiative-tracker:should-save");
    }
    async onOpen() {
        let show = Platform.isMobile
            ? true
            : this.leaf.getRoot?.().containerEl?.clientWidth <
                  MIN_WIDTH_FOR_HAMBURGER ?? true;
        this._app = new App({
            target: this.contentEl,
            props: {
                view: this,
                creatures: this.ordered,
                show: show,
                state: this.state,
                current: this.current,
                map: this.plugin.data.leafletIntegration
            }
        });
        this._rendered = true;
    }

    async onClose() {
        console.log("onclose");
        this._app.$destroy();
        this._rendered = false;
        this.trigger("initiative-tracker:closed");
    }
    getViewType() {
        return INTIATIVE_TRACKER_VIEW;
    }
    getDisplayText() {
        return "Initiative Tracker";
    }
    getIcon() {
        return BASE;
    }
    openInitiativeView() {
        this.plugin.leaflet.openInitiativeView(this.pcs, this.npcs);
    }

    trigger(...args: TrackerEvents) {
        const [name, ...data] = args;
        this.app.workspace.trigger(name, ...data);
    }
    toState() {
        if (!this.state) return null;
        return {
            creatures: [...this.ordered.map((c) => c.toJSON())],
            state: this.state,
            current: this.current,
            name: this.name
        };
    }
    async onunload() {
        this.plugin.data.state = this.toState();
        await this.plugin.saveSettings();
    }
}
