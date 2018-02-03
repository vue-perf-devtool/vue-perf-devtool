import Vue from 'vue'
import Vuex from 'vuex'
import perf from 'views/perf/module'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    message: '',
    tab: 'perf',
    view: 'vertical'
  },
  mutations: {
    SHOW_MESSAGE (state, message) {
      state.message = message
    },
    SWITCH_TAB (state, tab) {
      state.tab = tab
    },
    SWITCH_VIEW (state, view) {
      state.view = view
    },
    RECEIVE_INSTANCE_DETAILS (state, instance) {
      state.message = 'Instance selected: ' + instance.name
    }
  },
  modules: {
    perf
  }
})

export default store

if (module.hot) {
  module.hot.accept([
    'views/perf/module'
  ], () => {
    try {
      store.hotUpdate({
        modules: {
          perf: require('views/perf/module').default
        }
      })
    } catch (e) {
      console.log(e.stack)
    }
  })
}
