import { register } from "node:module";

await register("./ts-loader.mjs", import.meta.url);
