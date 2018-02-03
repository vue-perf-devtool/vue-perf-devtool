<template>
<div id="app" class="app">
  <component :is="tab" class="container"></component>
</div>
</template>

<script>
import PerfTab from './views/perf/PerfTab.vue'
import { SPECIAL_TOKENS } from '../util'

import { mapState } from 'vuex'

export default {
  name: 'app',
  components: {
    perf: PerfTab
  },
  computed: {
    ...mapState({
      message: state => state.message,
      tab: state => state.tab,
      newEventCount: state => state.events.newEventCount,
      view: state => state.view
    }),
    specialTokens () {
      return SPECIAL_TOKENS
    }
  },
  methods: {
    refresh () {
      const refreshIcon = this.$refs.refresh
      refreshIcon.style.animation = 'none'

      bridge.send('refresh:page')
      bridge.once('flush', () => {
        refreshIcon.style.animation = 'rotate 1s'
      })
    },
    switchView (mediaQueryEvent) {
      this.$store.commit(
        'SWITCH_VIEW',
        mediaQueryEvent.matches ? 'vertical' : 'horizontal'
      )
    },
    updateActiveBar () {
      const activeButton = this.$el.querySelector('.button.active')
      const activeBar = this.$el.querySelector('.active-bar')
      if (activeBar) {
        activeBar.style.top = activeButton.offsetTop + 'px'
        activeBar.style.height = activeButton.offsetHeight + 'px'
      }
    }
  },
  mounted () {
    this.mediaQuery = window.matchMedia('(min-width: 685px)')
    this.switchView(this.mediaQuery)
    this.mediaQuery.addListener(this.switchView)

    this.updateActiveBar()
    window.addEventListener('resize', this.updateActiveBar)
  },
  destroyed () {
    window.removeEventListener('resize', this.updateActiveBar)
    this.mediaQuery.removeListener(this.switchView)
  },
  watch: {
    tab () {
      this.$nextTick(this.updateActiveBar)
    }
  }
}
</script>

<style lang="stylus" src="./global.styl">
</style>

<style lang="stylus" scoped>
@import "./variables"

.app
  width 100%
  height 100%
  user-select none
  background-color $background-color
  display flex
  flex-direction row
  .dark &
    background-color $dark-background-color

.header
  display flex
  align-items center
  border-right 1px solid $border-color
  font-size 14px
  position relative
  flex-direction column
  .dark &
    border-bottom 1px solid $dark-border-color

.logo
  width 30px
  height 30px
  margin 0 15px

.message-container
  height 1em
  cursor default
  display none
  @media (min-width: $wide - 300px)
    display block


.message
  color $active-color
  transition all .3s ease
  position absolute

.button
  padding 10px
  display flex
  align-items center
  cursor pointer
  position relative
  border-bottom-color transparent
  background-color $background-color
  color #888
  transition color .35s ease
  .dark &
    background-color $dark-background-color

  &:hover
    color #555

  &.active
    color $active-color

  &:first-of-type
    margin-left auto

  .material-icons
    font-size 20px
    margin-right 5px
    color inherit

  .pane-name
    display none

  @media (min-width: $wide)
    padding-right 20px
    padding-left 20px
    .pane-name
      display block

  @media (min-height: $tall)
    padding-top 20px
    padding-bottom 20px

.container
  overflow hidden
  flex 1

$event-count-bubble-size = 18px

.event-count
  background-color $active-color
  color #fff
  border-radius 50%
  width $event-count-bubble-size
  height $event-count-bubble-size
  text-align center
  padding-top 4px
  font-size $event-count-bubble-size * 0.5
  position absolute
  right 0
  top 12px
  .dark &
    background-color $dark-background-color

.active-bar
  position absolute
  width 3px
  right 0px;
  height 0px
  background-color $active-color
  transition all .32s cubic-bezier(0,.9,.6,1)
</style>
