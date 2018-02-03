import Vue from 'vue'
import storage from '../../storage'

import { classify } from 'src/util'

const ENABLED_KEY = 'PERF_ENABLED'
const CLASSIFY_COMPONENTS_KEY = 'CLASSIFY_COMPONENTS'
const enabled = storage.get(ENABLED_KEY)
const classifyComponents = storage.get(CLASSIFY_COMPONENTS_KEY)

const state = {
  enabled: enabled == null ? true : enabled,
  inspectedInstance: {},
  instances: [],
  instancesMap: {},
  events: [],
  sort: 'total',
  inspectedIndex: -1,
  newEventCount: 0,
  filter: '',
  classifyComponents: classifyComponents == null ? true : classifyComponents
}

const mutations = {
  FLUSH (state, payload) {
    let start
    if (process.env.NODE_ENV !== 'production') {
      start = window.performance.now()
    }

    // Instance ID map
    // + add 'parent' properties
    const map = {}
    function walk (instance) {
      map[instance.id] = instance
      if (instance.children) {
        instance.children.forEach(child => {
          child.parent = instance
          walk(child)
        })
      }
    }
    payload.instances.forEach(walk)

    // Mutations
    state.instances = Object.freeze(payload.instances)
    state.inspectedInstance = Object.freeze(payload.inspectedInstance)
    state.instancesMap = Object.freeze(map)

    if (process.env.NODE_ENV !== 'production') {
      Vue.nextTick(() => {
        console.log(`devtools render took ${window.performance.now() - start}ms.`)
      })
    }
  },
  CLASSIFY_COMPONENTS (state, value) {
    state.classifyComponents = value
  },
  'RECEIVE_MEASURE' (state, payload) {
    const listNameEvents = state.events.map(event => event.instanceName)
    const indexEvent = listNameEvents.indexOf(payload.instanceName)
    let inspectedIndex
    if (indexEvent > -1) {
      const listEvents = state.events.slice()
      listEvents[indexEvent].timestamp = payload.timestamp
      listEvents[indexEvent].perfTimes[payload.eventName] = payload.duration
      state.events = listEvents
      inspectedIndex = indexEvent
    } else {
      state.events.push({
        ...payload,
        perfTimes: {
          [payload.eventName]: payload.duration
        }
      })
      inspectedIndex = state.events.length - 1
    }
    if (!state.filter) {
      state.inspectedIndex = inspectedIndex
    }
  },
  'RESET' (state) {
    state.events = []
    state.inspectedIndex = -1
  },
  'INSPECT' (state, index) {
    if (index < 0) index = 0
    if (index >= state.events.length) index = state.events.length - 1
    state.inspectedIndex = index
  },
  'RESET_NEW_EVENT_COUNT' (state) {
    state.newEventCount = 0
  },
  'INCREASE_NEW_EVENT_COUNT' (state) {
    state.newEventCount++
  },
  'UPDATE_FILTER' (state, filter) {
    state.filter = filter
  },
  'TOGGLE' (state) {
    storage.set(ENABLED_KEY, state.enabled = !state.enabled)
    bridge.send('perf:toggle-recording', state.enabled)
  }
}

const actions = {
  init: {
    handler ({ state }) {
      bridge.send('config:classifyComponents', state.classifyComponents)
    },
    root: true
  }
}

const getters = {
  activeEvent: state => {
    return state.events[state.inspectedIndex]
  },
  filteredEvents: (state, getters, rootState) => {
    const classifyComponents = rootState.perf.classifyComponents
    let searchText = state.filter.toLowerCase()
    const searchComponent = /<|>/g.test(searchText)
    if (searchComponent) {
      searchText = searchText.replace(/<|>/g, '')
    }
    return state.events.filter(
      e => (searchComponent ? (classifyComponents ? classify(e.instanceName) : e.instanceName) : e.eventName).toLowerCase().indexOf(searchText) > -1
    )
  },
  toggleClassifyComponents ({ state, commit }) {
    const newValue = !state.classifyComponents
    commit('CLASSIFY_COMPONENTS', newValue)
    storage.set(CLASSIFY_COMPONENTS_KEY, newValue)
    bridge.send('config:classifyComponents', newValue)
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  getters,
  actions
}
