import adapter from '@sveltejs/adapter-auto'; // or svelte-adapter-bun
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),

		alias: {
			'@shared-backend': path.resolve('../../shared-backend/src')
		}
	}
};

export default config;
