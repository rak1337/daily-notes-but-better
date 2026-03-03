import process from "process";
import esbuild from "esbuild";

const prod = process.argv[2] === "production";

esbuild.build({
    entryPoints: ["main.ts"],
    bundle: true,
    external: [
        "obsidian",
        "electron",
        "@codemirror/autocomplete",
        "@codemirror/collab",
        "@codemirror/commands",
        "@codemirror/language",
        "@codemirror/lint",
        "@codemirror/search",
        "@codemirror/state",
        "@codemirror/view",
        "@lezer/common",
        "@lezer/highlight",
        "@lezer/lr",
    ],
    format: "cjs",
    watch: !prod,
    target: "es2022",
    logLevel: "info",
    sourcemap: prod ? false : "inline",
    minify: prod,
    treeShaking: true,
    outfile: "main.js",
}).then(() => {
    console.log("Build successful.");
    process.exit(0);
}).catch((e) => {
    console.error(e);
    process.exit(1);
});
