import { createRequire } from "module";
const require = createRequire(import.meta.url);
const nconf = require("nconf");

export default function loadConfig(defaultConfig) {
    nconf
        .env({
            separator: "__",
            transform: (obj) => {
                if (!obj.key.startsWith("RESUME__")) return false;

                // Remove prefix
                const key = obj.key.slice(8);
                return {
                    key: key.split("__").map(snakeToCamel).join(":"),
                    value: obj.value,
                };
            },
        })
        .defaults(defaultConfig);

    return nconf.get();
}

function snakeToCamel(s) {
    return s.toLowerCase()
        .replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}
