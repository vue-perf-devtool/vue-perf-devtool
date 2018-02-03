<template>
  <div>
    <perf-history></perf-history>
  </div>
</template>

<script>
import SplitPane from 'components/SplitPane.vue'
import PerfHistory from './PerfHistory.vue'

import { mapState } from 'vuex'

export default {
  computed: mapState('perf', [
    'enabled'
  ]),
  components: {
    SplitPane,
    PerfHistory
  }
}
</script>
