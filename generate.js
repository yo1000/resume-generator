import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import {JSDOM} from "jsdom";
import puppeteer from "puppeteer";
import concat from "concat-stream";
import toml from "toml";

/**
 *
 * @param config
 * @param dataPath
 * @param templatePath
 * @param {({data, issueDate}) => object} buildParams
 * @returns {Promise<void>}
 */
export default async function generate({config, dataPath, templatePath, buildParams}) {
    const today = new Date(config.issue_date);

    fs.createReadStream(dataPath).pipe(concat(async (tomlPath) => {
        const template = fs.readFileSync(templatePath, {encoding: `utf8`})
            .trim()
            .replace(/\r\n/, `\n`)
            .replace(/\r/, `\n`);

        const params = buildParams({
            data: toml.parse(tomlPath),
            issueDate: today
        });

        const buildHtml = Handlebars.compile(template);
        const html = buildHtml(params);

        const dom = new JSDOM(html);
        const doc = dom.window.document;
        const htmlElm = doc.querySelector("html");
        htmlElm.style.width = `calc(${config.pdf.width} - ${config.pdf.margin.left} - ${config.pdf.margin.right})`;
        htmlElm.style.height = `calc(${config.pdf.height} - ${config.pdf.margin.top} - ${config.pdf.margin.bottom})`;

        const out = dom.serialize();
        const outPath = `${path.resolve(config.out.location, config.out.careerHistoryFileName)}${
            config.out.withDate
                ? `_${today.getFullYear()}-${
                    `${today.getMonth() + 1}`.padStart(2, "0")}-${
                    `${today.getDate()}`.padStart(2, "0")}`
                : ""
        }`;

        if (config.debug) {
            console.log(`params = ${JSON.stringify({
                ...params,
                font_style: "..."
            }, undefined , "  ")}`);

            fs.writeFileSync(`${outPath}.html`, out);
        }

        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            headless: "new"
        });

        const page = await browser.newPage();
        await page.setContent(out);
        await page.pdf({
            ...config.pdf,
            path: `${outPath}.pdf`
        });

        await browser.close();
    }));
}
