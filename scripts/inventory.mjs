import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import * as api from '../dist/index.js';
import * as helpers from '../dist/controls.js';
import * as original from 'rxjs/operators';

const catalog = JSON.parse(await readFile(new URL('../planning/operator-catalog.json', import.meta.url)));
const baseline = JSON.parse(await readFile(new URL('../planning/rxjs-7.8.2-exports.json', import.meta.url)));
const names = Object.keys(api).sort();
const expected = catalog.operators.map(entry => entry.name).sort();
const covered = catalog.operators.filter(entry => entry.kind !== 'creation').flatMap(entry => entry.rxjsNames).sort();
const nativeNames = Object.entries(original).filter(([, value]) => typeof value === 'function').map(([name]) => name).sort();
assert.equal(names.length, 80, 'The root must export exactly 80 names');
assert.deepEqual(names, expected, 'The runtime API and catalog must agree');
assert.ok(Object.values(api).every(value => typeof value === 'function'), 'Every root export must be a function');
assert.deepEqual(covered, baseline.names, 'Every original pipeable name must map exactly once');
assert.deepEqual(nativeNames, baseline.names, 'The pinned RxJS inventory must match the baseline');
assert.ok(Object.keys(helpers).every(name => name.startsWith('with') && !names.includes(name)), 'Helpers must be separate');
assert.equal(catalog.operators.filter(entry => entry.kind === 'family').length, 15);
assert.equal(catalog.operators.filter(entry => entry.kind === 'passthrough').length, 58);
assert.equal(catalog.operators.filter(entry => entry.kind === 'creation').length, 7);
assert.ok(catalog.operators.every(entry => catalog.groups.some(group => group.id === entry.primaryGroup)));

const groups = Object.fromEntries(catalog.groups.map(group => [group.title,
  catalog.operators.filter(entry => entry.primaryGroup === group.id).length]));
console.log(JSON.stringify({ rxjs: '7.8.2', operatorNames: names.length,
  configurationHelpers: Object.keys(helpers).length, groups,
  coveredPipeableNames: covered.length, additionalCreationNames: 7 }, null, 2));

const rows = catalog.operators.map(entry => `| \`${entry.name}\` | ${entry.primaryGroup} | ${entry.kind} | ${entry.rxjsNames.map(n => `\`${n}\``).join(', ')} |`);
const markdown = '# Operator catalog\n\nGenerated from `planning/operator-catalog.json` by `npm run inventory -- --write`.\n\n'
  + 'Exactly **80** public operator/creation functions: **15** consolidated families, **58** unchanged pipeable names, and **7** creation functions.\n\n'
  + 'The comparison scope is 113 names from `rxjs/operators` plus 7 explicitly selected creation names: 120 names represented by 80 public names. Configuration helpers are counted separately; this is not a claim that the complete RxJS API contains only 80 functions.\n\n'
  + '| Public name | Primary learning group | Implementation | Original names represented |\n|---|---|---|---|\n'
  + rows.join('\n') + '\n';
const path = new URL('../docs/OPERATOR-CATALOG.md', import.meta.url);
if (process.argv.includes('--write')) await writeFile(path, markdown);
else assert.equal(await readFile(path, 'utf8'), markdown, 'Regenerate the catalog document with npm run inventory -- --write');
