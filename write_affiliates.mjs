import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const target = join(__dirname, "src", "pages", "Affiliates.tsx");
writeFileSync(target, readFileSync(join(__dirname, "affiliates_new.tsx"), "utf8"), "utf8");
console.log("done");
