import fs from "node:fs";
import generateResume from "./generateResume.js";
import generateCareerHistory from "./generateCareerHistory.js";
import {config} from "./config.js";
import loadConfig from "./loadConfig.js";

(async () => {
    const mergedConfig = loadConfig(config);

    if (!fs.existsSync(mergedConfig.out.location)) {
        fs.mkdirSync(mergedConfig.out.location);
    }

    generateResume({
        ...mergedConfig,
        pdf: {
            ...mergedConfig.pdf,
            ...mergedConfig.pdf.resume
        }
    });
    generateCareerHistory({
        ...mergedConfig,
        pdf: {
            ...mergedConfig.pdf,
            ...mergedConfig.pdf.careerHistory
        }
    });
})();
