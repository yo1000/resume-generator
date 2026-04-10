import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";

/**
 *
 * @param config
 * @param templatePath
 * @param outBaseName
 * @param profileName
 * @returns {Promise<void>}
 */
export default async function generatePdf({config, outContent, outBaseName, profileName}) {
    const outPath = `${path.resolve(config.out.location, outBaseName)}${
        config.out.withProfileName && profileName
            ? `_${profileName.replace(/[\s　]+/, "")}`
            : ""
    }${
        config.out.withDate
            ? `_${config.issueDate.getFullYear()}-${
                String(config.issueDate.getMonth() + 1).padStart(2, "0")}-${
                String(config.issueDate.getDate()).padStart(2, "0")}`
            : ""
    }`;

    if (config.debug) {
        fs.writeFileSync(`${outPath}.html`, outContent);
    }

    const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: "new"
    });

    const page = await browser.newPage();
    await page.setContent(outContent);
    await page.pdf({
        ...config.pdf,
        path: `${outPath}.pdf`
    });

    await browser.close();
}
