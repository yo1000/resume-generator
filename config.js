export const config = {
    data: "./data",
    template: {
        resume: "./templates/resume-template.html",
        careerHistory: "./templates/career-history-template.html"
    },
    out: {
        location: "./out",
        resumeFileName: "resume",
        careerHistoryFileName: "career-history",
        withDate: true
    },
    font: {
        serif: {
            name: "Noto Serif JP",
            file: "./fonts/NotoSerifJP-VariableFont_wght.ttf"
        },
        sansSerif: {
            name: "Noto Sans JP",
            file: "./fonts/NotoSansJP-VariableFont_wght.ttf"
        },
        monospace: {
            name: "Noto Sans Mono",
            file: "./fonts/NotoSansMono-VariableFont_wdth,wght.ttf"
        }
    },
    pdf: {
        format: "A4",
        margin: {
            top: "10mm",
            right: "10mm",
            bottom: "10mm",
            left: "10mm"
        }
    },
    debug: false
};
