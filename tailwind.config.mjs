/* eslint-disable import/no-anonymous-default-export */

import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: "#0E8279",
          secondary: "#61ede2",
          accent: "#37cdbe",
          neutral: "#3d4451",
          "base-100": "#ffffff",
          error: "#f21f13",
          success: "#60ed40",
        },
      },
    ],
    darkTheme: "light", // name of one of the included themes for dark mode
  },
};
