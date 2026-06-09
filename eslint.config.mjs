import withNuxt from "./.nuxt/eslint.config.mjs";
import prettier from "eslint-config-prettier";

// Nuxt's flat config, with Prettier appended last to switch off rules that would
// fight the formatter. Formatting is owned by Prettier; ESLint owns correctness.
export default withNuxt().append(prettier);
