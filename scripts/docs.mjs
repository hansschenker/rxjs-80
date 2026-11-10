import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
const catalog = JSON.parse(await readFile(new URL('planning/operator-catalog.json', root), 'utf8'));
const descriptions = JSON.parse(await readFile(new URL('planning/operator-descriptions.json', root), 'utf8'));
const check = process.argv.includes('--check');
const names = catalog.operators.map(x => x.name).sort();
assert.equal(names.length, 80);
assert.deepEqual(Object.keys(descriptions).sort(), names, 'Every public name needs a description');
const controls = {
  audit: ['withTime(milliseconds, scheduler?)', 'withSignal(durationSelector)'],
  debounce: ['withTime(milliseconds, scheduler?)', 'withSignal(durationSelector)'],
  sample: ['withTime(period, scheduler?)', 'withSignal(notifier$)'],
  throttle: ['withTime(milliseconds, scheduler?)', 'withSignal(durationSelector)', 'withEdges({ leading, trailing })'],
  buffer: ['withCount(size)', 'withTime(milliseconds, scheduler?)', 'withSignal(boundary$)', 'withClosing(closeFactory)', 'withOpenings(open$), withClosing(closeFor)', 'withStartEvery(every)', 'withMaxSize(size)'],
  window: ['withCount(size)', 'withTime(milliseconds, scheduler?)', 'withSignal(boundary$)', 'withClosing(closeFactory)', 'withOpenings(open$), withClosing(closeFor)', 'withStartEvery(every)', 'withMaxSize(size)'],
  take: ['withCount(count)', 'withCount(count), withFromEnd()', 'withSignal(stop$)', 'withWhile(predicate, inclusive?)'],
  skip: ['withCount(count)', 'withCount(count), withFromEnd()', 'withSignal(start$)', 'withWhile(predicate)'],
  merge: ['withProjection(project)', 'withConcurrency(limit)', 'withSources(...sources)'],
  concat: ['withProjection(project)', 'withSources(...sources)'],
  switchLatest: ['withProjection(project)'],
  exhaust: ['withProjection(project)'],
  map: ['project', 'withConstant(value)', "withProperty('user', 'name')"],
  distinct: ["withHistory('all' | 'lastEmitted')", 'withKey(keySelector)', 'withComparer(compare)', 'withResetSignal(reset$)'],
  share: ["withConnection('auto' | 'manual')", 'withReplay(size, options?)', 'withInitialValue(value)', 'withLastValue()', 'withSharing(config)', 'withSelector(selector)']
};
const sourceFiles = { audit: 'temporal', debounce: 'temporal', sample: 'temporal', throttle: 'temporal', buffer: 'grouping', window: 'grouping', take: 'selection', skip: 'selection', merge: 'flattening', concat: 'flattening', switchLatest: 'flattening', exhaust: 'flattening', map: 'values', distinct: 'values', share: 'sharing' };
const notes = {
 audit: 'A source completion can wait for an active duration. A duration error fails the output. Downstream cancellation closes both subscriptions. See the [audit scenarios](/guide/audit-scenarios).',
 debounce: 'Completing a duration without a next is not a release signal. Source completion does flush; source error or downstream cancellation drops pending delivery.',
 sample: 'Notifier completion does not complete the result or flush the latest value. The source lifetime still controls output completion.',
 throttle: 'The defaults are leading: true and trailing: false. Trailing mode can start another waiting interval; source-completion handling depends on that pending trailing value.',
 buffer: 'Count, time, boundary, closing-factory, and opening/closing variants have different empty-group and completion rules. withStartEvery uses counts with withCount and scheduler time units with withTime. withMaxSize is a time-mode option. Use the migration table to choose a supported combination.',
 window: 'Subscribe to emitted windows while they are live. A window is an inner stream, not an array delivered later. Notifier completion rules vary: windowWhen, selected by withClosing alone, reopens on a closing next or completion. Do not infer this rule from audit.',
 merge: 'Default concurrency is unbounded. Outer completion waits for active and queued work. An inner error terminates the result and cancels the other work. Unsubscription closes active subscriptions; whether that aborts external work depends on producer teardown.',
 concat: 'A non-completing inner prevents the queue from advancing. Outer completion waits for the queue to drain. Cancellation closes active work and discards queued values.',
 exhaust: 'Ignored source values are not queued. Outer completion waits for the active inner; cancellation closes it. The projection is not called for ignored values.',
 switchLatest: 'Closing an inner subscription stops its notifications. Aborting an underlying network request or other external effect requires producer teardown support.',
 take: 'A silent stop-notifier completion does not stop the source. The inclusive while option includes the first failing value before completion. take from the end cannot produce its tail until source completion.',
 skip: 'A silent start-notifier completion does not open the gate. skip from the end emits with a rolling count-based lag and drops the retained tail on completion.',
 distinct: 'All-history uses Set equality and accepts withResetSignal. Last-emitted history accepts withComparer (strict equality by default). These options are not interchangeable. Unbounded all-history can retain many keys.',
 share: 'share() resets on error, completion, and zero consumers by default. withReplay delegates to shareReplay: refCount defaults to false, errors reset, and successful completion retains the replay buffer. Choose refCount: true to disconnect an unfinished source at zero consumers. For manual connections, apply share directly to the source to preserve the connectable TypeScript type; see the migration guide.',
 scan: 'The accumulator state is per subscription. For shared state with one retained value, compose scan with share(withReplay(1, { refCount: true })) and choose reset/reconnection behavior deliberately.',
 partition: 'This export returns a pair of Observables rather than one pipeable output. Each branch has its own predicate evaluation and subscription.',
 from: 'Unsubscription stops forwarding a promise result, but cannot cancel the promise itself. Use a producer with an appropriate teardown when cancellation of external work is required.'
};
await mkdir(new URL('docs/operators/', root), { recursive: true });
for (const op of catalog.operators) {
  const d = descriptions[op.name];
  for (const key of ['summary', 'behavior', 'example']) assert.ok(typeof d[key] === 'string' && d[key].trim(), `${op.name}: missing ${key}`);
  const group = catalog.groups.find(g => g.id === op.primaryGroup);
  const kind = { family: 'Consolidated family', passthrough: 'RxJS compatibility export', creation: 'Creation function' }[op.kind];
  const nativeDir = op.kind === 'creation' ? 'observable' : 'operators';
  const source = op.kind === 'family' ? `src/${sourceFiles[op.name]}.ts` : 'src/index.ts';
  let md = `---\ntitle: ${op.name}\ndescription: ${JSON.stringify(d.summary)}\n---\n\n<!-- Generated by scripts/docs.mjs. Edit planning/operator-descriptions.json or the generator. -->\n\n# ${op.name}\n\n**${group.title} · ${kind}**\n\n## Intuition\n\n${d.summary}\n\n## Specification\n\n${d.behavior}\n\n`;
  if (notes[op.name]) md += `### Lifetime and policy details\n\n${notes[op.name]}\n\n`;
  md += `### Names represented\n\n${op.rxjsNames.map(n => '`' + n + '`').join(', ')}.\n\n`;
  if (controls[op.name]) md += `### Configuration vocabulary\n\n${controls[op.name].map(c => '- `' + c + '`').join('\n')}\n\nThese are available forms and modifiers, not a list to combine indiscriminately. See the [migration guide](/MIGRATION) for supported combinations and signatures.\n\n`;
  md += `## Example\n\nThis is a wiring sketch: streams and application functions such as \`source$\`, \`isValid\`, or \`load\` are supplied by your application. Import operators from \`rxjs-80\`, controls from \`rxjs-80/controls\`, and supporting types, Subjects, and schedulers from \`rxjs\`.\n\n\`\`\`typescript\n${d.example}\n\`\`\`\n\nBuilding this expression does not subscribe. Connect a consumer to start the Observable execution; a live producer may already exist independently. [Run a complete example](/guide/getting-started#first-pipeline).\n\n## Verification\n\n`;
  md += op.kind === 'family'
    ? 'The family selects native RxJS 7.8.2 implementations. The repository contains behavioral comparisons and focused lifecycle tests; these provide evidence for covered cases, not a proof of every possible history.\n\n'
    : 'This name is exported directly from RxJS 7.8.2. The inventory checks the public name and mapping; it does not establish independent semantic verification for this operator.\n\n';
  md += `- [rxjs-80 implementation](https://github.com/hansschenker/rxjs-80/blob/main/${source})\n`;
  md += op.rxjsNames.map(n => `- [RxJS 7.8.2: ${n}](https://github.com/ReactiveX/rxjs/blob/7.8.2/src/internal/${nativeDir}/${n === 'onErrorResumeNext' ? 'onErrorResumeNextWith' : n}.ts)`).join('\n');
  md += '\n- [Verification approach](/SEMANTICS)\n- [Browse all 80 operators](/catalog)\n';
  const file = new URL(`docs/operators/${op.name}.md`, root);
  if (check) assert.equal(await readFile(file, 'utf8'), md, `${op.name} page is stale; run npm run docs:generate`);
  else await writeFile(file, md);
}
const actual = (await readdir(new URL('docs/operators/', root))).filter(n => n.endsWith('.md')).map(n => n.slice(0, -3)).sort();
assert.deepEqual(actual, names, 'Operator pages must exactly match the 80 root names');
const audit = '# Audit: executable stories\n\nThese Given/When/Then scenarios distinguish a duration next from a duration completion. Read the [audit operator page](/operators/audit), then inspect the [tests](https://github.com/hansschenker/rxjs-80/blob/main/test/audit.test.ts).\n\n```gherkin\n' + (await readFile(new URL('docs/AUDIT.feature', root), 'utf8')).trim() + '\n```\n';
await mkdir(new URL('docs/guide/', root), { recursive: true });
if (check) assert.equal(await readFile(new URL('docs/guide/audit-scenarios.md', root), 'utf8'), audit, 'Audit scenarios page is stale');
else await writeFile(new URL('docs/guide/audit-scenarios.md', root), audit);
console.log(`${check ? 'Checked' : 'Generated'} all 80 operator pages and audit scenarios.`);
