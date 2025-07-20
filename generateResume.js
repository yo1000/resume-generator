import toml from "toml";
import concat from "concat-stream";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import Handlebars from "handlebars";

export default function generateResume(config) {
    const today = new Date(config.issue_date);

    fs.createReadStream(path.resolve(config.data, "resume.toml")).pipe(concat(async (tomlPath) => {
        const template = fs.readFileSync(config.template.resume, {encoding: `utf8`})
            .trim()
            .replace(/\r\n/, `\n`)
            .replace(/\r/, `\n`);

        const tomlParams = toml.parse(tomlPath);

        const photoPath = path.resolve(config.data, tomlParams.profile?.photo ?? "");
        const existsPhoto = tomlParams.profile?.photo && fs.existsSync(photoPath);
        const photoExt = existsPhoto && path.extname(tomlParams.profile?.photo).toLowerCase();
        const photoMedia = existsPhoto && photoExt === ".png" ? "image/png"
            : photoExt === ".jpg" || photoExt === ".jpeg" ? "image/jpg"
                : photoExt === ".gif" ? "image/gif"
                    : undefined;

        const birthdate = tomlParams.profile?.birthdate ? new Date(tomlParams.profile?.birthdate) : undefined;
        let age = birthdate ? today.getFullYear() - birthdate.getFullYear() : "";
        if (birthdate && (today.getMonth() > birthdate.getMonth()
            || (today.getMonth() === birthdate.getMonth() && today.getDate() >= birthdate.getDate()))) {
            age--;
        }

        const careers = [
            ...([
                {
                    y: "",
                    m: "",
                    style: "center",
                    title: "学歴"
                },
                ...(tomlParams.career_schools?.length ? tomlParams.career_schools?.map(career => {
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
                ...(tomlParams.career_jobs?.length ? tomlParams.career_jobs?.map(career => {
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

        const handlebarsParams = {
            ...tomlParams,
            profile: {
                ...(tomlParams.profile ?? {}),
                photo_src: photoMedia ? `data:${photoMedia};base64,${
                    fs.readFileSync(photoPath, {encoding: 'base64'})
                }` : undefined,
                y: birthdate && birthdate.getFullYear(),
                m: birthdate && birthdate.getMonth() + 1,
                d: birthdate && birthdate.getDate(),
                age: age
            },
            contact_primary: {
                ...(tomlParams.contact_primary ?? {})
            },
            contact_secondary: {
                ...(tomlParams.contact_secondary ?? {})
            },
            careers1: careers.filter((_, i) => i < 15),
            careers2: careers.filter((_, i) => i >= 15 && i < 22),
            qualifications: [
                ...(tomlParams.qualifications?.map(qualification => {
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
                motivation: tomlParams.intent?.motivation
                    ?.trim()
                    ?.replace(/\r\n|\r/g, "\n")
                    ?.split(/\n\n/g)
                    ?.map(s => s.replace(/\n/g, "<br>"))
                    ?.join(""),
                wishes: [
                    ...(tomlParams.intent?.wishes?.length ? tomlParams.intent?.wishes : []),
                    ...(new Array(4))
                ]?.filter((_, i) => i < 4)
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

        const outPath = `${path.resolve(config.out.location, config.out.resumeFileName)}${
            config.out.withDate
                ? `_${today.getFullYear()}-${
                    `${today.getMonth() + 1}`.padStart(2, "0")}-${
                    `${today.getDate()}`.padStart(2, "0")}`
                : ""
        }`;

        if (config.debug) {
            console.log(`resume params = ${JSON.stringify({
                ...handlebarsParams,
                profile: {
                    ...handlebarsParams.profile,
                    photo_src: handlebarsParams.profile?.photo_src ? "..." : undefined
                },
                font_style: "..."
            }, undefined, "  ")}`);

            fs.writeFileSync(`${outPath}.html`, out);
        }

        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.setContent(out);
        await page.pdf({
            ...config.pdf,
            path: `${outPath}.pdf`
        });

        await browser.close();
    }));
}
