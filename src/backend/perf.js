import { stringify, getTagName } from '../util'

function getLastWord (words) {
  var n = words.split(' ')
  return n[n.length - 1]
}

export function initPerfBackend (listMesuare, hook, bridge) {
  let recording = true

  // deal with multiple backend injections
  hook.off('perf:measure')
  // application -> devtool
  hook.on('perf:measure', measure => {
    if (!recording) return
    const lastWord = getLastWord(measure.name)
    if (lastWord === 'render' || lastWord === 'patch' || lastWord === 'init') {
      bridge.send('perf:measure', stringify({
        measure,
        type: '$emit',
        instanceId: 0,
        duration: measure.duration,
        eventName: lastWord,
        instanceName: getTagName(measure.name),
        timestamp: Date.now()
      }))
    }
  })

  // init application
  hook.emit('perf:init')
  listMesuare.list.forEach(measure => {
    hook.emit('perf:measure', measure)
  })
  listMesuare.active = false
  listMesuare.list = []

  // devtool -> application
  bridge.on('perf:toggle-recording', enabled => {
    recording = enabled
  })
}
