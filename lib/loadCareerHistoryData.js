import fs from "node:fs";
import path from "node:path";
import {Marked} from "marked";
import toml from "toml";

export default function loadCareerHistoryData(config) {
    const tomlPath = path.resolve(config.data.location, config.data.careerHistoryFileName);
    const tomText = fs.readFileSync(tomlPath, {encoding: `utf8`});
    const data = toml.parse(tomText);

    const marked = new Marked();

    return {
        profile: {
            ...data.profile,
            career_summary: data.profile?.career_summary ? marked.parse(data.profile?.career_summary) : undefined,
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
                    has_name_or_term: (work.name || work.term),
                    has_role_or_stacks: (work.role || work.stacks?.length),
                    has_responsibilities: (work.responsibilities?.length),
                    has_stacks: work.stacks?.length,
                    desc: work.desc ? marked.parse(work.desc) : undefined
                })))
            })) ?? [])
        ],
        promotion: {
            ...data.promotion,
            desc: data.promotion?.desc ? marked.parse(data.promotion?.desc) : undefined
        },
    };
}
