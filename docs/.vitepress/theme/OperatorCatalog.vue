<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { withBase } from 'vitepress';
import catalog from '../../../planning/operator-catalog.json';
import descriptions from '../../../planning/operator-descriptions.json';
const query = ref('');
const group = ref('all');
const kind = ref('all');
const entries = catalog.operators.map(op => ({ ...op, ...descriptions[op.name as keyof typeof descriptions] }));
const filtered = computed(() => {
  const words = query.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return entries.filter(op => (group.value === 'all' || group.value === op.primaryGroup)
    && (kind.value === 'all' || kind.value === op.kind)
    && words.every(word => [op.name, op.summary, ...op.rxjsNames, ...op.tags].join(' ').toLowerCase().includes(word)));
});
function reset() { query.value = ''; group.value = 'all'; kind.value = 'all'; }
onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  const selected = params.get('group');
  if (catalog.groups.some(g => g.id === selected)) group.value = selected!;
  query.value = params.get('q') ?? '';
  watch([query, group, kind], () => {
    const url = new URL(window.location.href);
    for (const [key, value] of [['q', query.value.trim()], ['group', group.value === 'all' ? '' : group.value]]) {
      if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
    }
    window.history.replaceState(null, '', url);
  });
});
</script>

<template>
  <section class="operator-browser" aria-label="Operator catalog">
    <div class="catalog-tools">
      <div class="catalog-input">
        <label for="operator-search">Find a behavior or an operator</label>
        <input id="operator-search" v-model="query" type="search" placeholder="Try auditTime, cancellation, or buffer…" autocomplete="off" />
      </div>
      <div class="catalog-kind">
        <label for="operator-kind">API form</label>
        <select id="operator-kind" v-model="kind">
          <option value="all">All forms</option>
          <option value="family">Consolidated families</option>
          <option value="passthrough">Compatibility exports</option>
          <option value="creation">Creation functions</option>
        </select>
      </div>
    </div>
    <div class="group-filters" role="group" aria-label="Filter by learning group">
      <button :aria-pressed="group === 'all'" @click="group = 'all'">All <span>80</span></button>
      <button v-for="g in catalog.groups" :key="g.id" :class="g.id" :aria-pressed="group === g.id" @click="group = g.id">
        {{ g.title }} <span>{{ entries.filter(op => op.primaryGroup === g.id).length }}</span>
      </button>
    </div>
    <div class="catalog-result-bar">
      <p role="status" aria-live="polite">{{ filtered.length }} of 80 operators</p>
      <button v-if="query || group !== 'all' || kind !== 'all'" @click="reset">Clear filters</button>
    </div>
    <div v-if="filtered.length" class="operator-grid">
      <a v-for="op in filtered" :key="op.name" class="operator-card" :class="op.primaryGroup" :href="withBase(`/operators/${op.name}.html`)">
        <div class="operator-card-top"><span class="operator-group">{{ op.primaryGroup }}</span><span class="operator-arrow" aria-hidden="true">↗</span></div>
        <h2>{{ op.name }}</h2>
        <p>{{ op.summary }}</p>
        <div class="operator-aliases">{{ op.kind === 'family' ? `${op.rxjsNames.length} RxJS names · one family` : op.kind === 'creation' ? 'Create a source' : 'RxJS compatibility export' }}</div>
      </a>
    </div>
    <div v-else class="catalog-empty"><h2>No matching operators</h2><p>Try an original RxJS name or clear the filters to browse all 80.</p><button @click="reset">Show all operators</button></div>
  </section>
</template>
