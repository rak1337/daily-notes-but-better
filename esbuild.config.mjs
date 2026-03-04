import process from "process";
import esbuild from "esbuild";

const prod = process.argv[2] === "production";

const buildOptions = {
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
    target: "es2022",
    logLevel: "info",
    sourcemap: prod ? false : "inline",
    minify: prod,
    treeShaking: true,
    outfile: "main.js",
};

if (prod) {
    esbuild.build(buildOptions).catch(() => process.exit(1));
} else {
    esbuild.context(buildOptions).then((context) => {
        context.watch();
    }).catch(() => process.exit(1));
}
