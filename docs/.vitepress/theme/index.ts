import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import OperatorCatalog from './OperatorCatalog.vue';
import LearningGroups from './LearningGroups.vue';
import './custom.css';
export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('OperatorCatalog', OperatorCatalog);
    app.component('LearningGroups', LearningGroups);
  }
} satisfies Theme;
