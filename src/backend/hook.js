// this script is injected into every page.

/**
 * Install the hook on window, which is an event emitter.
 * Note because Chrome content scripts cannot directly modify the window object,
 * we are evaling this function by inserting a script tag. That's why we have
 * to inline the whole event emitter implementation here.
 *
 * @param {Window} window
 */

export function installHook (window) {
  let listeners = {}

  const hook = {
    Vue: null,

    on (event, fn) {
      event = '$' + event
      ;(listeners[event] || (listeners[event] = [])).push(fn)
    },

    once (event, fn) {
      const eventAlias = event
      event = '$' + event
      function on () {
        this.off(eventAlias, on)
        fn.apply(this, arguments)
      }
      ;(listeners[event] || (listeners[event] = [])).push(on)
    },

    off (event, fn) {
      event = '$' + event
      if (!arguments.length) {
        listeners = {}
      } else {
        const cbs = listeners[event]
        if (cbs) {
          if (!fn) {
            listeners[event] = null
          } else {
            for (let i = 0, l = cbs.length; i < l; i++) {
              const cb = cbs[i]
              if (cb === fn || cb.fn === fn) {
                cbs.splice(i, 1)
                break
              }
            }
          }
        }
      }
    },

    emit (event) {
      event = '$' + event
      let cbs = listeners[event]
      if (cbs) {
        const args = [].slice.call(arguments, 1)
        cbs = cbs.slice()
        for (let i = 0, l = cbs.length; i < l; i++) {
          cbs[i].apply(this, args)
        }
      }
    }
  }

  const perf = window.performance
  hook.perf = perf
  if (!window.__VUE_DEVTOOLS_PERF__) {
    window.__VUE_DEVTOOLS_PERF__ = {
      active: true,
      list: []
    }
  }
  const listMesuare = window.__VUE_DEVTOOLS_PERF__
  if (perf && perf.clearMeasures && !perf._clearMeasures) {
    perf._clearMeasures = perf.clearMeasures
    perf.clearMeasures = name => {
      if (name && name.indexOf('⚛') === -1 && name.indexOf('Warning:') === -1) {
        const measure = window.performance.getEntries().filter(item => item.entryType === 'measure').map(item => ({
          name: item.name,
          duration: item.duration
        }))[0]
        if (listMesuare.active) {
          listMesuare.list.push(measure)
        }
        hook.emit('perf:measure', measure)
      }
      perf._clearMeasures(name)
    }
  }

  hook.once('init', Vue => {
    hook.Vue = Vue

    Vue.prototype.$inspect = function () {
      const fn = window.__VUE_DEVTOOLS_INSPECT__
      fn && fn(this)
    }
  })

  hook.once('vuex:init', store => {
    hook.store = store
  })

  if (!window.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
    Object.defineProperty(window, '__VUE_DEVTOOLS_GLOBAL_HOOK__', {
      get () {
        return hook
      }
    })
  } else if (!window.__VUE_PERF_DEVTOOLS_GLOBAL_HOOK__) {
    window.__VUE_DEVTOOLS_GLOBAL_HOOK__.once('init', Vue => {
      hook.emit('init', Vue)
    })
    window.__VUE_DEVTOOLS_GLOBAL_HOOK__.on('flush', playload => {
      hook.emit('flush', playload)
    })
    Object.defineProperty(window, '__VUE_PERF_DEVTOOLS_GLOBAL_HOOK__', {
      get () {
        return hook
      }
    })
  }
}
