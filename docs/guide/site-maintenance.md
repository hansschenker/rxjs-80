# Maintain the operator site

The public names come from `planning/operator-catalog.json`. Teaching summaries and examples live in `planning/operator-descriptions.json`. `scripts/docs.mjs` generates exactly one detail page per public name and checks that all 80 exist. The catalog, page generation, and sidebar use the same inventory.

```bash
npm run docs:generate  # after editing descriptions or the generation template
npm run docs:dev       # local development
npm run docs:build     # generated-page check, then production build
npm run docs:preview   # serve the production build
```

The generator owns `docs/operators/*.md` and `docs/guide/audit-scenarios.md`; edit the source metadata or template instead of those generated pages. All other guides are ordinary Markdown. Site styling and components are under `docs/.vitepress/theme`.

## GitHub Pages

The base path is `/rxjs-80/`. The workflow in `.github/workflows/pages.yml` verifies the library and builds documentation for pull requests. On `main`, it also publishes the resulting static site to GitHub Pages.

GitHub Pages must use **GitHub Actions** as the publishing source under repository **Settings → Pages**. If Pages is not yet enabled, an administrator must select that source once. After enabling it, run **Actions → Build and deploy VitePress → Run workflow** once. Later main-branch pushes rebuild and deploy automatically. While Pages is disabled, the workflow still verifies and builds the site, uploads its artifact, and skips deployment with a setup warning.

Expected address: `https://hansschenker.github.io/rxjs-80/`.

VitePress local search runs in the browser and requires no external search service. The operator catalog also searches original RxJS names and can be filtered by learning group and API form.
