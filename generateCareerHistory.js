import fs from "node:fs";
import path from "node:path";
import {Marked} from "marked";
import generate from "./generate.js";

export default function generateCareerHistory(config) {
    generate({
        config: config,
        dataPath: path.resolve(config.data, "career_history.toml"),
        templatePath: config.template.careerHistory,
        buildParams: ({data, issueDate}) => {
            const marked = new Marked();
            return {
                profile: {
                    ...data.profile,
                    career_summary: marked.parse(data.profile?.career_summary),
                    has_links: data.profile?.links?.length,
                    links: data.profile?.links?.map(link => ({
                        url: link.url,
                        text: link.text ?? link.url
                    }))
                },
                career_histories: [
                    ...(data.career_histories?.map(history => ({
                        ...history,
                        has_term_or_summary: (history.term || history.summary),
                        summary: history.summary ? marked.parse(history.summary) : undefined,
                        has_works: history.works?.length,
                        works: (history.works?.map(work => ({
                            ...work,
                            name_or_term: (work.name || work.term),
                            role_or_stacks: (work.role || work.stacks?.length),
                            has_responsibilities: (work.responsibilities?.length),
                            has_stacks: work.stacks?.length,
                            desc: marked.parse(work.desc)
                        })))
                    })) ?? [])
                ],
                promotion: {
                    ...data.promotion,
                    desc: marked.parse(data.promotion?.desc)
                },
                y: issueDate.getFullYear(),
                m: issueDate.getMonth() + 1,
                d: issueDate.getDate(),
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
        }
    });
}
