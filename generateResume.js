import fs from "node:fs";
import path from "node:path";
import generate from "./generate.js";

export default function generateResume(config) {
    generate({
        config: config,
        dataPath: path.resolve(config.data, "resume.toml"),
        templatePath: config.template.resume,
        buildParams: ({data, issueDate}) => {
            const photoPath = path.resolve(config.data, data.profile?.photo ?? "");
            const existsPhoto = data.profile?.photo && fs.existsSync(photoPath);
            const photoExt = existsPhoto && path.extname(data.profile?.photo).toLowerCase();
            const photoMedia = existsPhoto && resultMediaType(photoExt);

            const birthdate = data.profile?.birthdate ? new Date(data.profile?.birthdate) : undefined;
            let age = calcAge(issueDate, birthdate)

            const careers = [
                ...([
                    {
                        y: "",
                        m: "",
                        style: "center",
                        title: "学歴"
                    },
                    ...(data.career_schools?.length ? data.career_schools?.map(career => {
                        const yearMonth = new Date(`${career.year_month}-01`);
                        return {
                            y: yearMonth.getFullYear(),
                            m: yearMonth.getMonth() + 1,
                            style: "",
                            title: career.title
                        };
                    }) : []),
                    {
                        y: "",
                        m: "",
                        style: "center",
                        title: "職歴"
                    },
                    ...(data.career_jobs?.length ? data.career_jobs?.map(career => {
                        const yearMonth = new Date(`${career.year_month}-01`);
                        return {
                            y: yearMonth.getFullYear(),
                            m: yearMonth.getMonth() + 1,
                            style: "",
                            title: career.title
                        };
                    }) : [])
                ].filter((_, i) => i < 22)),
                {
                    y: "",
                    m: "",
                    style: "end",
                    title: "現在に至る"
                },
                ...(new Array(22))
            ];

            return {
                ...data,
                profile: {
                    ...(data.profile ?? {}),
                    photo_src: photoMedia ? `data:${photoMedia};base64,${
                        fs.readFileSync(photoPath, {encoding: 'base64'})
                    }` : undefined,
                    y: birthdate && birthdate.getFullYear(),
                    m: birthdate && birthdate.getMonth() + 1,
                    d: birthdate && birthdate.getDate(),
                    age: age
                },
                contact_primary: {
                    ...(data.contact_primary ?? {})
                },
                contact_secondary: {
                    ...(data.contact_secondary ?? {})
                },
                careers1: careers.filter((_, i) => i < 15),
                careers2: careers.filter((_, i) => i >= 15 && i < 22),
                qualifications: [
                    ...(data.qualifications?.map(qualification => {
                        const date = new Date(`${qualification.year_month}-01`);
                        return {
                            ...qualification,
                            y: date.getFullYear(),
                            m: date.getMonth() + 1
                        };
                    }) ?? []),
                    ...(new Array(6))
                ].filter((_, i) => i < 6),
                intent: {
                    motivation: data.intent?.motivation
                        ?.trim()
                        ?.replace(/\r\n|\r/g, "\n")
                        ?.split(/\n\n/g)
                        ?.map(s => s.replace(/\n/g, "<br>"))
                        ?.join(""),
                    wishes: [
                        ...(data.intent?.wishes?.length ? data.intent?.wishes : []),
                        ...(new Array(4))
                    ]?.filter((_, i) => i < 4)
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

function resultMediaType(ext) {
    return ext === ".png" ? "image/png"
        : ext === ".jpg" || ext === ".jpeg" ? "image/jpg"
            : ext === ".gif" ? "image/gif"
                : undefined
}

function calcAge(date, birthDate) {
    let age = birthDate ? date.getFullYear() - birthDate.getFullYear() : "";
    if (birthDate && (date.getMonth() < birthDate.getMonth()
        || (date.getMonth() === birthDate.getMonth() && date.getDate() < birthDate.getDate()))) {
        age--;
    }

    return age;
}
