import {
    type EditorPosition,
    type EditorSuggestContext,
    type EditorSuggestTriggerInfo,
    Editor,
    EditorSuggest,
    TFile,
    parseYaml
} from "obsidian";
import type InitiativeTracker from "../../main";

enum SuggestContext {
    Players,
    Creatures,
    Party,
    RollHP,
    Name,
    None
}

interface ParsedEncounter {
    name?: string;
    players?: string[];
    party?: string;
    rollHP?: boolean;
    creatures?: Array<{ [key: number]: string } | string>;
}

export class EncounterSuggester extends EditorSuggest<string> {
    _context: SuggestContext = SuggestContext.None;
    _encounter: ParsedEncounter = {};
    constructor(public plugin: InitiativeTracker) {
        super(plugin.app);
    }
    getSuggestions(ctx: EditorSuggestContext) {
        let suggestions: string[] = [];

        switch (this._context) {
            case SuggestContext.Name: {
                suggestions = [];
                break;
            }
            case SuggestContext.Players:
                suggestions = [...this.plugin.players.keys()].filter(
                    (p) => !this._encounter.players?.includes(p)
                );
                break;
            case SuggestContext.Creatures:
                suggestions = this.plugin.bestiaryNames;
                break;
            case SuggestContext.Party:
                suggestions = [
                    "false",
                    ...this.plugin.data.parties?.map((p) => p.name)
                ];
                break;
            case SuggestContext.RollHP:
                suggestions = ["true", "false"];
                break;
            case SuggestContext.None:
                suggestions = [
                    "players",
                    "creatures",
                    "party",
                    "rollHP",
                    "name"
                ].filter((k) => !(k in this._encounter));
                break;
        }
        return suggestions.filter(
            (s) =>
                !ctx.query.length ||
                s.toLowerCase().contains(ctx.query.toLowerCase())
        );
    }
    renderSuggestion(text: string, el: HTMLElement) {
        el.createSpan({ text });
    }
    selectSuggestion(value: string, evt: MouseEvent | KeyboardEvent): void {
        if (!this.context) return;
        switch (this._context) {
            case SuggestContext.None: {
                value = `${value}:`;
                if (/^(players|creatures):/.test(value)) {
                    value = `${value}\n  - `;
                } else {
                    value = `${value} `;
                }
                break;
            }
            case SuggestContext.Creatures:
            case SuggestContext.Players: {
                const spaces = this.context.editor
                    .getLine(this.context.start.line)
                    .search(/\S/);
                value = `${value}\n${" ".repeat(spaces)}- `;
                break;
            }
            case SuggestContext.Party:
            case SuggestContext.RollHP: {
                const endsWithSpace = /\s$/.test(
                    this.context.editor.getLine(this.context.start.line)
                );
                value = `${endsWithSpace ? "" : " "}${value.trim()}`;
                break;
            }
            case SuggestContext.Name:
                break;
        }

        this.context.editor.replaceRange(
            `${value}`,
            this.context.start,
            {
                ...this.context.end,
                ch: this.context.start.ch + this.context.query.length
            },
            "initiative-tracker"
        );

        this.context.editor.setCursor(
            this.context.start.line,
            this.context.start.ch + value.length
        );

        this.close();
    }
    onTrigger(
        cursor: EditorPosition,
        editor: Editor,
        file: TFile
    ): EditorSuggestTriggerInfo | null {
        this._context = SuggestContext.None;
        const range = editor.getRange({ line: 0, ch: 0 }, cursor);

        if (range.indexOf("```encounter\n") === -1) return null;

        const split = range.split("\n");

        let inEncounter = false,
            start: number;
        for (let i = split.length - 1; i >= 0; i--) {
            let line = split[i];
            if (/^```$/.test(line)) return null;
            if (/^```encounter/.test(line)) {
                inEncounter = true;
                start = i;
                break;
            }
        }
        if (!inEncounter) return null;

        /** get all the keys in the encounter block */
        try {
            let doc = editor.getValue().split("\n");
            // just remove the current line to prevent yaml parsing issues
            doc.splice(cursor.line, 1);
            doc = doc.slice(start + 1);
            let end = doc.findIndex((l) => /^```$/.test(l));
            if (end < 0) end = doc.length;

            //parse as yaml so we can use this state later, e.g. to get already loaded players
            this._encounter = parseYaml(doc.slice(0, end).join("\n"));
        } catch (e) {
            this._encounter = {};
        }
        if (!this._encounter) this._encounter = {};

        const line = editor.getLine(cursor.line);
        //don't suggest anything for name
        if (/^name/.test(line)) return null;
        if (/^rollHP:/.test(line)) {
            this._context = SuggestContext.RollHP;
            const [_, query] = line.match(/^rollHP:\s?(.*)$/);
            if (query === "true" || query === "false") return null;
            return {
                end: cursor,
                start: {
                    ch: line.length - query.length,
                    line: cursor.line
                },
                query
            };
        }
        if (/^party:/.test(line)) {
            this._context = SuggestContext.Party;
            const [_, query] = line.match(/^party:\s?(.*)$/);
            if (this.plugin.data.parties.find((p) => p.name === query))
                return null;
            return {
                end: cursor,
                start: {
                    ch: line.length - query.length,
                    line: cursor.line
                },
                query
            };
        }
        if (/\s+- (?:\d:)?/.test(line)) {
            //in creature or player context... try to figure out which
            let found = false;
            for (let i = split.length - 1; i >= 0; i--) {
                let line = split[i];
                if (/^```$/.test(line)) return null;
                if (/^```encounter/.test(line)) return null;
                if (/^players:/.test(line)) {
                    this._context = SuggestContext.Players;
                    found = true;
                    break;
                }
                if (/^creatures:/.test(line)) {
                    this._context = SuggestContext.Creatures;
                    found = true;
                    break;
                }
            }
            //panic
            if (!found) return null;

            const [_, query] = line.match(/^\s+- (?:\d:)?(.*)$/);
            return {
                end: cursor,
                start: {
                    ch: line.length - query.length,
                    line: cursor.line
                },
                query
            };
        }
        return {
            end: cursor,
            start: {
                ch: 0,
                line: cursor.line
            },
            query: line
        };
    }
}
