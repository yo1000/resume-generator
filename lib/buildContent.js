import fs from "node:fs";
import Handlebars from "handlebars";
import {JSDOM} from "jsdom";

/**
 *
 * @param config
 * @param templatePath
 * @param data
 * @returns {Promise<string>}
 */
export default async function buildContent({config, templatePath, data}) {
    const template = fs.readFileSync(templatePath, {encoding: `utf8`});
    const buildHtml = Handlebars.compile(template);
    const html = buildHtml(data);

    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const htmlElm = doc.querySelector("html");
    htmlElm.style.width = `calc(${config.pdf.width} - ${config.pdf.margin.left} - ${config.pdf.margin.right})`;
    htmlElm.style.height = `calc(${config.pdf.height} - ${config.pdf.margin.top} - ${config.pdf.margin.bottom})`;

    return dom.serialize();
}
