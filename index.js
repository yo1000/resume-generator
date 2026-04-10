import fs from "node:fs";
import loadResumeData from "./lib/loadResumeData.js";
import loadCareerHistoryData from "./lib/loadCareerHistoryData.js";
import {config} from "./config.js";
import loadConfig from "./lib/loadConfig.js";
import path from "node:path";
import buildContent from "./lib/buildContent.js";
import generatePdf from "./lib/generatePdf.js";

(async () => {
    const mergedConfig = loadConfig(config);
    const preparedConfig = {
        ...mergedConfig,
        issueDate: new Date(mergedConfig.issueDate),
    };

    if (!fs.existsSync(mergedConfig.out.location)) {
        fs.mkdirSync(mergedConfig.out.location);
    }

    const genericParams = {
        y: preparedConfig.issueDate.getFullYear(),
        m: preparedConfig.issueDate.getMonth() + 1,
        d: preparedConfig.issueDate.getDate(),
        font_style: `
            @font-face {
                font-family: ${config.font.serif.name};
                src: url(data:font/ttf;base64,${fs.readFileSync(config.font.serif.file, {encoding: 'base64'})});
            }
            @font-face {
                font-family: ${config.font.sansSerif.name};
                src: url(data:font/ttf;base64,${fs.readFileSync(config.font.sansSerif.file, {encoding: 'base64'})});
            }
            @font-face {
                font-family: ${config.font.monospace.name};
                src: url(data:font/ttf;base64,${fs.readFileSync(config.font.monospace.file, {encoding: 'base64'})});
            }
        `.trim().replace(/\s+/g, " "),
    };

    const resumeConfig = {
        ...preparedConfig,
        pdf: {
            ...preparedConfig.pdf,
            ...preparedConfig.pdf.resume
        }
    };
    const resumeData = {
        ...loadResumeData(preparedConfig),
        ...genericParams,
    };
    const resumeContent = await buildContent({
        config: resumeConfig,
        templatePath: path.resolve(preparedConfig.template.location, preparedConfig.template.resumeFileName),
        outBaseName: preparedConfig.out.resumeBaseName,
        data: resumeData,
    });

    const careerHistoryConfig = {
        ...preparedConfig,
        pdf: {
            ...preparedConfig.pdf,
            ...preparedConfig.pdf.careerHistory,
        }
    };
    const careerHistoryData = {
        ...loadCareerHistoryData(preparedConfig),
        ...genericParams,
    };
    const careerHistoryContent = await buildContent({
        config: careerHistoryConfig,
        templatePath: path.resolve(preparedConfig.template.location, preparedConfig.template.careerHistoryFileName),
        outBaseName: preparedConfig.out.careerHistoryBaseName,
        data: careerHistoryData,
    });

    if (preparedConfig.debug) {
        console.log(`resume data = ${JSON.stringify({
            ...resumeData,
            font_style: "..."
        }, undefined , "  ")}`);

        console.log(`career-history data = ${JSON.stringify({
            ...careerHistoryData,
            font_style: "..."
        }, undefined , "  ")}`);
    }

    if (preparedConfig.mergeDocs) {
        generatePdf({
            config: resumeConfig,
            outContent: `
                <html lang="ja"><head><title>履歴書・職務経歴書</title></head></html>
                ${resumeContent}
                <div style="page-break-after: always; margin-bottom: calc(${resumeConfig.pdf.margin.bottom} + ${careerHistoryConfig.pdf.margin.top});"></div>
                <div></div>
                ${careerHistoryContent}
            `,
            outBaseName: `${preparedConfig.out.resumeBaseName}_${preparedConfig.out.careerHistoryBaseName}`,
            profileName: resumeData.profile.name,
        });
    } else {
        generatePdf({
            config: resumeConfig,
            outContent: resumeContent,
            outBaseName: preparedConfig.out.resumeBaseName,
            profileName: resumeData.profile?.name,
        });

        generatePdf({
            config: careerHistoryConfig,
            outContent: careerHistoryContent,
            outBaseName: preparedConfig.out.careerHistoryBaseName,
            profileName: careerHistoryData.profile?.name,
        });
    }
})();
