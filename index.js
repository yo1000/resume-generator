import fs from "node:fs";
import generateResume from "./generateResume.js";
import generateCareerHistory from "./generateCareerHistory.js";
import {config} from "./config.js";

(async () => {
    const now = new Date();
    const today = `${now.getFullYear()}-${
        `${now.getMonth() + 1}`.padStart(2, "0")}-${
        `${now.getDate()}`.padStart(2, "0")}`

    const mergedConfig = {
        ...config,
        issue_date: config.issue_date ?? today,
        pdf: {
            ...config.pdf,
            ...config.pdf.resume
        },
        debug: process.env.RESUME_DEBUG ?? config.debug
    };

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
