import { defineConfig } from 'vitepress';
import { readFileSync } from 'node:fs';
const catalog = JSON.parse(readFileSync(new URL('../../planning/operator-catalog.json', import.meta.url), 'utf8'));
const guides = [
  { text: 'Start here', link: '/guide/getting-started' },
  { text: 'Three learning groups', link: '/LEARNING-GROUPS' },
  { text: 'Migration & controls', link: '/MIGRATION' },
  { text: 'Semantic commitments', link: '/SEMANTICS' },
  { text: 'Audit BDD scenarios', link: '/guide/audit-scenarios' },
  { text: 'Roadmap', link: '/ROADMAP' },
  { text: 'Contributors', link: '/contributors' },
  { text: 'Maintain this site', link: '/guide/site-maintenance' }
];
export default defineConfig({
  title: 'rxjs-80',
  description: '80 operator names. Explicit behavior. Learn RxJS through values, time, and routes.',
  lang: 'en',
  base: '/rxjs-80/',
  lastUpdated: true,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/rxjs-80/favicon.svg' }], ['meta', { name: 'theme-color', content: '#9d287c' }]],
  sitemap: { hostname: 'https://hansschenker.github.io/rxjs-80/' },
  themeConfig: {
    logo: '/favicon.svg',
    nav: [
      { text: 'Operators', link: '/catalog', activeMatch: '/(catalog|operators/)' },
      { text: 'Learn', link: '/guide/getting-started', activeMatch: '/(guide/|LEARNING-GROUPS)' },
      { text: 'Migration', link: '/MIGRATION' },
      { text: 'Contributors', link: '/contributors' }
    ],
    sidebar: [
      { text: 'Explore', items: [{ text: 'All 80 operators', link: '/catalog' }, ...guides] },
      ...catalog.groups.map((group: { id: string; title: string }) => ({
        text: `${group.title} · ${catalog.operators.filter((op: { primaryGroup: string }) => op.primaryGroup === group.id).length}`,
        collapsed: true,
        items: catalog.operators.filter((op: { primaryGroup: string }) => op.primaryGroup === group.id).map((op: { name: string }) => ({ text: op.name, link: `/operators/${op.name}` }))
      }))
    ],
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/hansschenker/rxjs-80' }],
    editLink: { pattern: ({ relativePath }) => `https://github.com/hansschenker/rxjs-80/edit/main/${relativePath.startsWith('operators/') ? 'planning/operator-descriptions.json' : 'docs/' + relativePath}`, text: 'View or edit this page on GitHub' },
    outline: { level: [2, 3] },
    footer: { message: 'Built on RxJS 7.8.2 · Released under the MIT License', copyright: 'Hans Schenker · ChatGPT (OpenAI), main contributor and co-author' }
  }
});
