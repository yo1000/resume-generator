import toml from "toml";
import concat from "concat-stream";
import fs from "fs";
import path from "path";
import Handlebars from "handlebars"
import puppeteer from "puppeteer";

export default function generateCareerHistory(config) {
    const today = new Date(config.issue_date);

    fs.createReadStream(path.resolve(config.data, "career_history.toml")).pipe(concat(async (tomlPath) => {
        const template = fs.readFileSync(config.template.careerHistory, {encoding: `utf8`})
            .trim()
            .replace(/\r\n/, `\n`)
            .replace(/\r/, `\n`);

        const tomlParams = toml.parse(tomlPath);

        const handlebarsParams = {
            profile: {
                ...tomlParams.profile,
                career_summaries: tomlParams.profile?.career_summary
                    ?.trim()
                    ?.replace(/\r\n|\r/g, "\n")
                    ?.split(/\n\n/g)
                    ?.map(s => s.replace(/\n/g, "<br>")),
                links_not_empty: tomlParams.profile?.links?.length,
                links: tomlParams.profile?.links?.map(link => ({
                    url: link.url,
                    text: link.text ?? link.url
                }))
            },
            career_histories: [
                ...(tomlParams.career_histories?.map(history => ({
                    ...history,
                    term_or_summary: (history.term || history.summary),
                    works_not_empty: history.works?.length,
                    works: (history.works?.map(work => ({
                        ...work,
                        name_or_term: (work.name || work.term),
                        role_or_stacks: (work.role || work.stacks?.length),
                        stacks_not_empty: work.stacks?.length,
                        desc: work.desc
                            ?.trim()
                            ?.replace(/\r\n|\r/g, "\n")
                            ?.split(/\n/g)
                            ?.join('<br>')
                    })))
                })) ?? [])
            ],
            promotion: {
                ...tomlParams.promotion,
                descs: tomlParams.promotion?.desc
                    ?.trim()
                    ?.replace(/\r\n|\r/g, "\n")
                    ?.split(/\n\n/g)
                    ?.map(s => s.replace(/\n/g, "<br>"))
            },
            y: today.getFullYear(),
            m: today.getMonth() + 1,
            d: today.getDate(),
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
            `.trim().replace(/\s+/g, " ")
        };

        const buildHtml = Handlebars.compile(template);
        const out = buildHtml(handlebarsParams);

        const outPath = `${path.resolve(config.out.location, config.out.careerHistoryFileName)}${
            config.out.withDate
                ? `_${today.getFullYear()}-${
                    `${today.getMonth() + 1}`.padStart(2, "0")}-${
                    `${today.getDate()}`.padStart(2, "0")}`
                : ""
        }`;

        if (config.debug) {
            console.log(`career_history params = ${JSON.stringify({
                ...handlebarsParams,
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
