const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const sveltePreprocess = require("svelte-preprocess");

const isDevMode = process.env.NODE_ENV === "development";

const config = require('./webpack.config.js');

module.exports = {
    ...config,
    output: {
        ...config.output,
        path: "C:/Users/jvalentine/Documents/GitHub/Personal/Obsidian-Vault/The Mark of Death/.obsidian/plugins/obsidian-initiative-tracker"
    }
};