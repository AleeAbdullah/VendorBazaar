/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,jsx,ts,tsx}',
        './src/components/**/*.{js,jsx,ts,tsx}',
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                "primary": "#0b6623",
                "primary_secondary": "#557754",

                "primary-dark": "#0b6649",
                "grey": "#808080",
                "grey-light": "#E6E6E6",
            },
            fontSize: {
                "hero": "40px",
                "heading": "24px",
                "large": "22px",
                'text': '20px',
                "btn_title": "18px",
                "medium": "16px",
                "small": "14px",
                "extra_small": '12px',
                "icon_text": '10px'

            },
            fontFamily: {
                MuseoModerno_BoldItalic: ["MuseoModerno_BoldItalic"],
                MuseoModerno_Bold: ["MuseoModerno_Bold"],
                MuseoModerno_SemiBoldItalic: ["MuseoModerno_SemiBoldItalic"],
                MuseoModerno_SemiBold: ["MuseoModerno_SemiBold"],
                MuseoModerno_Regular: ["MuseoModerno_Regular"],
                MuseoModerno_italic: ["MuseoModerno_italic"],
                MuseoModerno_MediumItalic: ["MuseoModerno_MediumItalic"],
                MuseoModerno_Medium: ["MuseoModerno_Medium"],
                MuseoModerno_LightItalic: ["MuseoModerno_LightItalic"],
                MuseoModerno_Light: ["MuseoModerno_Light"],

                Fredoka_Regular: ["Fredoka_Regular"],
                Fredoka_Medium: ["Fredoka_Medium"],
                Fredoka_SemiBold: ["Fredoka_SemiBold"],

                SpaceMono: ["SpaceMono"],
            },
        },
    },
    plugins: [],
}

