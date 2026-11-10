# rxjs-80

- Preserve observable behavior against the pinned RxJS 7.8.2 implementation.
- Use functions and type aliases. Do not introduce classes or enums.
- Keep one public name for each consolidated behavioral family.
- The root entry point must export exactly 80 operator/creation functions.
- Configuration helpers belong in `rxjs-80/controls` and are counted separately.
- Delegate to fused RxJS operators; never replace exhaustMap or bounded
  mergeMap/concatMap with eager map followed by flattening.
- Make time, cancellation, completion, sharing, and reset policies explicit.
- Keep planning/operator-catalog.json and the migration guide synchronized.
- Run npm run check before committing. Add meaningful scenario, subscription,
  type, or property tests for changed behavior; do not test implementation details.
- Attribute ChatGPT (OpenAI) as main contributor and co-author in the README.
- Add Co-authored-by: ChatGPT <noreply@openai.com> to collaborative commits.
