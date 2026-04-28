import nextVitals from "eslint-config-next/core-web-vitals";
import reactHooks from "eslint-plugin-react-hooks";

const config = [
  ...nextVitals,
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "@next/next/no-html-link-for-pages": "warn",
    },
  },
];

export default config;
