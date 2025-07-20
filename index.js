import fs from "fs";
import generateResume from "./generateResume.js";
import generateCareerHistory from "./generateCareerHistory.js";
import {config} from "./config.js";

(async () => {
    const now = new Date();
    const today = `${now.getFullYear()}-${
        `${now.getMonth() + 1}`.padStart(2, "0")}-${
        `${now.getDate()}`.padStart(2, "0")}`

    const mergedConfig = {
        issue_date: process.env.RESUME_ISSUE_DATE ?? config.issue_date ?? today,
        data: process.env.RESUME_DATA ?? config.data,
        template: {
            resume: process.env.RESUME_TEMPLATE_RESUME ?? config.template.resume,
            careerHistory: process.env.RESUME_TEMPLATE_CAREER_HISTORY ?? config.template.careerHistory
        },
        out: {
            location: process.env.RESUME_OUT_LOCATION ?? config.out.location,
            resumeFileName: process.env.RESUME_OUT_RESUME_FILE_NAME ?? config.out.resumeFileName,
            careerHistoryFileName: process.env.RESUME_OUT_CAREER_HISTORY_FILE_NAME ?? config.out.careerHistoryFileName,
            withDate: process.env.RESUME_OUT_WITH_DATE ?? config.out.withDate
        },
        font: {
            serif: {
                name: process.env.RESUME_TEMPLATE_FONT_SERIF_NAME ?? config.font.serif.name,
                file: process.env.RESUME_TEMPLATE_FONT_SERIF_FILE ?? config.font.serif.file
            },
            sansSerif: {
                name: process.env.RESUME_TEMPLATE_FONT_SANS_SERIF_NAME ?? config.font.sansSerif.name,
                file: process.env.RESUME_TEMPLATE_FONT_SANS_SERIF_FILE ?? config.font.sansSerif.file
            },
            monospace: {
                name: process.env.RESUME_TEMPLATE_FONT_MONOSPACE_NAME ?? config.font.monospace.name,
                file: process.env.RESUME_TEMPLATE_FONT_MONOSPACE_FILE ?? config.font.monospace.file
            }
        },
        pdf: {
            format: process.env.RESUME_TEMPLATE_PDF_FORMAT ?? config.pdf.format,
            margin: {
                top: process.env.RESUME_TEMPLATE_PDF_MARGIN_TOP ?? config.pdf.margin.top,
                right: process.env.RESUME_TEMPLATE_PDF_MARGIN_RIGHT ?? config.pdf.margin.right,
                bottom: process.env.RESUME_TEMPLATE_PDF_MARGIN_BOTTOM ?? config.pdf.margin.bottom,
                left: process.env.RESUME_TEMPLATE_PDF_MARGIN_LEFT ?? config.pdf.margin.left
            }
        },
        debug: process.env.RESUME_DEBUG ?? config.debug
    };

    if (!fs.existsSync(mergedConfig.out.location)) {
        fs.mkdirSync(mergedConfig.out.location);
    }

    generateResume(mergedConfig);
    generateCareerHistory(mergedConfig);
})();
