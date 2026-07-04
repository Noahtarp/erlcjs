// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import fs from 'node:fs';
import path from 'node:path';

const sidebarFilePath = path.resolve('./src/api-sidebar.json');
const apiSidebarItems = fs.existsSync(sidebarFilePath)
  ? JSON.parse(fs.readFileSync(sidebarFilePath, 'utf-8'))
  : [];

export default defineConfig({
    site: 'https://erlcjs.xyz',
    base: '/',
	integrations: [
		starlight({
			title: 'erlc.js',
            customCss: [ './src/styles/custom.css' ],
            editLink: {
                baseUrl: 'https://github.com/erlc-js/erlcjs/edit/main/apps/docs',
            },
			social: [
                { icon: 'github', label: 'GitHub', href: 'https://github.com/erlc-js/erlcjs' },
                { icon: 'discord', label: 'Discord', href: 'https://discord.gg/yMK7Szrn8Q' },
            ],
			sidebar: [
				{
					label: 'Guides',
					items: [
						{ label: 'Getting Started', slug: 'guides/getting-started' },
						{ label: 'Instantiating Client', slug: 'guides/client' },
						{ label: 'Managing Players', slug: 'guides/players' },
						{ label: 'Server & Command Management', slug: 'guides/server-commands' },
						{ label: 'Handling Events', slug: 'guides/events' },
                        { label: 'Accessing the Cache', slug: 'guides/cache' },
                        { 
                            label: 'Using Presets', 
                            items: [
                                { label: 'Getting Started', slug: 'guides/presets/getting-started' },
                            ],
                        },
					],
				},
				{
					label: 'API Reference',
					items: [
                        { label: 'Overview', slug: 'api' },
                        ...apiSidebarItems
                    ]
				},
			],
		}),
	],
});
