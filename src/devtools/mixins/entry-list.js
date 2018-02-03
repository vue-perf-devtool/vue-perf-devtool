import { scrollIntoView } from 'src/util'

export default {
  watch: {
    inspectedIndex (value) {
      this.$nextTick(() => {
        const el = value === -1 ? this.$refs.baseEntry : this.$refs.entries[value]
        let elScroll
        if (this.$globalRefs.leftScroll) {
          elScroll = this.$globalRefs.leftScroll
        } else {
          elScroll = this.$globalRefs.centerScroll
        }
        el && scrollIntoView(elScroll, el, false)
      })
    }
  }
}
