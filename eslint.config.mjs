import mantine from 'eslint-config-mantine';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	...mantine,
	{ ignores: ['**/*.{mjs,cjs,js,d.ts,d.mts}'] },
	...tseslint.configs.strictTypeChecked,
	{
		languageOptions: {
		  parserOptions: {
			projectService: true,
			tsconfigRootDir: import.meta.dirname,
		  },
		},
	},
	{
		rules: {
			"brace-style": ["error", "1tbs", { "allowSingleLine": true }],
			"semi": ["error", "always"],
			"quotes": ["error", "double"],
			"indent": ["error", "tab", { "SwitchCase": 1 }],
			"no-trailing-spaces": "error",
		}
	}
);