<template>
  <scroll-pane>
    <div slot="header">
      <table class="table table-header">
        <thead>
          <tr>
            <th class="table-header-item table-header-item--first">
            <action-header>
              <div
                class="search"
                v-tooltip="$t('PerfHistory.filter.tooltip')"
              >
                <i class="search-icon material-icons">search</i>
                <input
                  ref="filterEvents"
                  placeholder="Filter components"
                  v-model.trim="filter"
                >
              </div>
              <a
                class="button reset"
                :class="{ disabled: !events.length }"
                v-tooltip="$t('PerfHistory.clear.tooltip')"
                @click="reset"
              >
                <i class="material-icons small">do_not_disturb</i>
                <span>Clear</span>
              </a>
              <a
                class="button toggle-recording"
                v-tooltip="$t(`PerfHistory.${enabled ? 'stopRecording' : 'startRecording'}.tooltip`)"
                @click="toggleRecording"
              >
                <i class="material-icons small" :class="{ enabled }">lens</i>
                <span>{{ enabled ? 'Recording' : 'Paused' }}</span>
              </a>
            </action-header>
            </th>
            <th class="table-header-item-rest">
                <div class="header-name" v-tooltip="$t('PerfHistory.table.init')">
                  <span>Init</span>
                </div>
            </th>
            <th class="table-header-item-rest">
                <div class="header-name" v-tooltip="$t('PerfHistory.table.render')">
                  <span>Render</span>
                </div>
            </th>
            <th class="table-header-item-rest">
                <div class="header-name" v-tooltip="$t('PerfHistory.table.patch')">
                  <span>Patch</span>
                </div>
            </th>
            <th class="table-header-item-rest">
                <div class="header-name">
                  <span>Instances</span>
                </div>
            </th>
            <th class="table-header-item-rest">
                <div class="header-name">
                  <span>Total Time (ms)</span>
                </div>
            </th>
            <th class="table-header-item-rest">
                <div class="header-name">
                  <span>Last Update</span>
                </div>
            </th>
          </tr>
        </thead>
      </table>
    </div>
    <div slot="scroll" class="history">
      <div v-if="filteredEvents.length === 0" class="no-events">
        No measures found<span v-if="!enabled"><br>(Recording is paused)</span>
      </div>
      <template v-else>
        <table class="table">
          <tbody>
            <tr
                ref="entries"
                v-for="(event, index) in filteredEvents"
                :key="index"
                class="entry list-item"
                :class="{ active: inspectedIndex === events.indexOf(event) }"
                @click="inspect(events.indexOf(event))">
                <td><div class="perf-name"><span>&lt;</span>{{ displayComponentName(event.instanceName) }}<span>&gt;</span></div></td>
                <td><div class="perf-value">{{ event.perfTimes.init | miliseconds }}ms</div></td>
                <td><div class="perf-value">{{ event.perfTimes.render | miliseconds }}ms</div></td>
                <td><div class="perf-value">{{ event.perfTimes.patch | miliseconds }}ms</div></td>
                <td><div class="perf-value">{{ listInstance[event.instanceName] }}</div></td>
                <td><div class="perf-value">{{ listTotal[event.instanceName] | miliseconds }}ms</div></td>
                <td><div class="perf-value">{{ event.timestamp | formatTime }}</div></td>
            </tr>
          </tbody>
        </table>
      </template>
    </div>
    
    <div slot="bottom">
      <div class="row-bottom">
        <div class="flex-bottom">Time taken by all components <span>{{ totals.totalTime | miliseconds }}ms</span> | <span>{{ totals.instances }}</span> instances</div>
        <div class="button" v-tooltip="$t('App.refresh.tooltip')" @click="refresh">Refresh</div>
      </div>
    </div>
  </scroll-pane>
</template>

<script>
import ScrollPane from 'components/ScrollPane.vue'
import ActionHeader from 'components/ActionHeader.vue'
import TableBody from 'components/TableBody.vue'

import Keyboard, { UP, DOWN, DEL, BACKSPACE } from '../../mixins/keyboard'
import EntryList from '../../mixins/entry-list'
import { mapState, mapGetters, mapMutations } from 'vuex'
import { classify, focusInput } from 'src/util'

export default {
  mixins: [
    Keyboard({
      onKeyDown ({ key, code, modifiers }) {
        switch (modifiers) {
          case 'ctrl+alt':
            if (key === 'r' || code === 'KeyR') {
              this.refresh()
              return false
            }
            break
          case 'ctrl':
            if (key === DEL || key === BACKSPACE) {
              this.reset()
              return false
            } else if (key === 'f') {
              focusInput(this.$refs.filterEvents)
              return false
            }
            break
          case '':
            if (key === UP) {
              this.inspect(this.inspectedIndex - 1)
              return false
            } else if (key === DOWN) {
              this.inspect(this.inspectedIndex + 1)
              return false
            } else if (key === 'r') {
              this.toggleRecording()
            }
        }
      }
    }),
    EntryList
  ],

  components: {
    ScrollPane,
    ActionHeader,
    TableBody
  },

  computed: {
    ...mapState('perf', ['instances', 'classifyComponents', 'enabled', 'events', 'inspectedIndex', 'sort']),

    ...mapGetters('perf', ['filteredEvents']),

    filter: {
      get () {
        return this.$store.state.perf.filter
      },
      set (filter) {
        this.$store.commit('perf/UPDATE_FILTER', filter)
      }
    },

    listInstance: {
      get () {
        function findChildrens (listInstance) {
          const output = {}
          function re (instances) {
            if (instances.length) {
              instances.forEach(inst => {
                const nameComponent = classify(inst.name)
                if (output[nameComponent]) {
                  output[nameComponent] = output[nameComponent] + 1
                } else {
                  output[nameComponent] = 1
                }
                re(inst.children)
              })
            }
          }
          re(listInstance)
          return output
        }
        return findChildrens(this.instances)
      }
    },

    listTotal: {
      get () {
        const output = {}
        this.filteredEvents.forEach(event => {
          const { init, render, patch } = event.perfTimes
          const instanceName = event.instanceName
          const instances = this.listInstance[instanceName] || 1
          output[instanceName] = (init + render + patch) * instances
        })
        return output
      }
    },

    totals: {
      get () {
        const output = {
          init: 0,
          render: 0,
          patch: 0,
          instances: 0,
          totalTime: 0
        }
        this.filteredEvents.forEach(({ perfTimes, instanceName }) => {
          const instances = this.listInstance[instanceName]
            ? this.listInstance[instanceName]
            : 0
          const totalTime = this.listTotal[instanceName]

          output.init = output.init + perfTimes.init
          output.render = output.render + perfTimes.render
          output.patch = output.patch + perfTimes.patch
          output.instances = output.instances + instances
          output.totalTime = output.totalTime + totalTime
        })
        return output
      }
    }
  },

  methods: {
    ...mapMutations('perf', {
      inspect: 'INSPECT',
      reset: 'RESET',
      toggleRecording: 'TOGGLE'
    }),

    displayComponentName (name) {
      return this.classifyComponents ? classify(name) : name
    },

    refresh () {
      bridge.send('refresh:page')
    }
  },

  filters: {
    formatTime (timestamp) {
      return new Date(timestamp).toString().match(/\d\d:\d\d:\d\d/)[0]
    },
    miliseconds (num) {
      return Math.round(num * 100) / 100
    }
  }
}
</script>

<style lang="stylus" scoped>
@import "../../variables"

th
  font-weight normal

.table
  border-collapse collapse
  width 100%
  &.table-header
    border-bottom 1px solid $border-color
    .dark &
        border-bottom 1px solid $dark-border-color
        background #2c2c2c
        color #9a9fa1

.table-header-item-rest
  border-left: 1px solid $border-color
  .dark &
      border-left-color $dark-border-color
  .header-name
    min-width 120px
    font-size 12px
    font-weight normal
    height 35px
    align-items center
    display flex
    justify-content center
    span
      flex 1
      align-items center
      justify-content center

.row-bottom
  background #eeeeee
  font-size 12px
  padding 7px 20px
  border-top 1px solid #cccccc
  display flex
  span
    color: #881391
    font-family Menlo, Consolas, monospace
  .dark &
    background #2c2c2c
    border-top-color #3d3d3d
    color #a1a1a1
    span
      color white
  .button
    text-decoration underline
    cursor pointer
    color $active-color

.bottom-first
  min-width 260px
  @media (min-width: $wide)
    min-width 357px

.flex-bottom
  flex 1

.table-bottom-item-rest
  .bottom-name
    text-align right
    min-width 120px
    font-size 12px
    font-weight normal
    padding: 0 20px
    padding-right 28px

.no-events
  color #ccc
  text-align center
  margin-top 50px
  line-height 30px

.header-main
  display flex

.entry-text
  flex: 1
  padding-top 10px
  padding-bottom 10px

.perf-value
  min-width 120px
  padding: 0 20px
  text-align right

.perf-name
  padding: 0 20px
  min-width 260px
  @media (min-width: $wide)
    min-width 357px

.entry
  position relative
  font-family Menlo, Consolas, monospace
  cursor pointer
  font-size 12px
  .event-name
    padding: 0 20px
    font-weight 600
  .event-source
    color #999
  .component-name
    color $component-color
  .event-type
    color #999
    margin-left 8px
  &.active
    .time, .event-type, .component-name
      color lighten($active-color, 75%)
    .event-name
      color: #fff
    .event-source
      color #ddd
  .table-body
    width 765px

.time
  font-size 11px
  color #999
  float right
</style>
