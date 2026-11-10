<script setup lang="ts">
import { withBase } from 'vitepress';
const groups = [
  { id: 'value', title: 'Value Modulators', number: '01', count: 20, question: 'What flows?', text: 'Transform values, collect packages, and remember state.', example: 'map · scan · reduce · buffer' },
  { id: 'time', title: 'Time Modulators', number: '02', count: 12, question: 'When does it flow?', text: 'Choose the signals and scheduled moments that control delivery.', example: 'audit · sample · throttle · debounce' },
  { id: 'route', title: 'Route Modulators', number: '03', count: 48, question: 'Which path does it take?', text: 'Select values, connect sources, and decide which work stays active.', example: 'take · merge · switchLatest · share' }
];
</script>
<template>
  <section class="learning-section" aria-labelledby="learning-title">
    <div class="learning-heading"><p class="eyebrow">THREE WAYS TO READ A STREAM</p><h2 id="learning-title">Start with behavior.</h2><p>Values move over time, through routes you choose.</p></div>
    <div class="learning-grid">
      <a v-for="g in groups" :key="g.id" :class="['learning-card', g.id]" :href="withBase(`/catalog.html?group=${g.id}`)">
        <div class="learning-top"><span>{{ g.number }}</span><span>{{ g.count }} operators ↗</span></div>
        <h3>{{ g.title }}</h3><p class="learning-question">{{ g.question }}</p><p>{{ g.text }}</p><div class="learning-example">{{ g.example }}</div>
      </a>
    </div>
    <p class="learning-note">These groups are learning lenses. An operator can affect values, timing, and routing together. Cancellation, termination, and sharing remain explicit.</p>
    <div class="policy-panel"><div><p class="eyebrow">ONE FAMILY. VISIBLE POLICY.</p><h2>Read the decision in the code.</h2><p>Choose the behavior first. Then supply its count, signal, time, or projection.</p><a :href="withBase('/MIGRATION.html')">Explore the migration guide →</a></div><pre aria-label="Policy examples"><code>take(withCount(5))
audit(withTime(300))
exhaust(withProjection(submit))
merge(withProjection(load),
      withConcurrency(4))</code></pre></div>
    <div class="learning-footer"><span>Intuition → Specification → Verification</span><a :href="withBase('/guide/getting-started.html')">Begin the learning path →</a></div>
  </section>
</template>
