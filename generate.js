import fs from "node:fs";
import path from "node:path";
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
 * @param outBaseName
 * @param {({data, issueDate}) => object} buildParams
 * @returns {Promise<void>}
 */
export default async function generate({config, dataPath, templatePath, outBaseName, buildParams}) {
    const issueDate = new Date(config.issueDate);

    fs.createReadStream(dataPath).pipe(concat(async (tomlPath) => {
        const template = fs.readFileSync(templatePath, {encoding: `utf8`})
            .trim()
            .replace(/\r\n/, `\n`)
            .replace(/\r/, `\n`);

        const params = buildParams({
            data: toml.parse(tomlPath),
            issueDate: issueDate
        });

        const buildHtml = Handlebars.compile(template);
        const html = buildHtml(params);

        const dom = new JSDOM(html);
        const doc = dom.window.document;
        const htmlElm = doc.querySelector("html");
        htmlElm.style.width = `calc(${config.pdf.width} - ${config.pdf.margin.left} - ${config.pdf.margin.right})`;
        htmlElm.style.height = `calc(${config.pdf.height} - ${config.pdf.margin.top} - ${config.pdf.margin.bottom})`;

        const out = dom.serialize();
        const outPath = `${path.resolve(config.out.location, outBaseName)}${
            config.out.withProfileName && params.profile?.name
                ? `_${params.profile.name.replace(/[\s　]+/, "")}`
                : ""
        }${
            config.out.withDate
                ? `_${issueDate.getFullYear()}-${
                    String(issueDate.getMonth() + 1).padStart(2, "0")}-${
                    String(issueDate.getDate()).padStart(2, "0")}`
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
