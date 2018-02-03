export default {
  App: {
    refresh: {
      tooltip: '[[{{keys.ctrl}}]] + [[{{keys.alt}}]] + [[R]] Force Refresh'
    }
  },
  PerfHistory: {
    filter: {
      tooltip: '[[{{keys.ctrl}}]] + [[F]] To filter on components, type <input><<search>> &lt;MyComponent&gt;</input> or just <input><<search>> &lt;mycomp</input>.'
    },
    clear: {
      tooltip: '[[{{keys.ctrl}}]] + [[{{keys.del}}]] Clear Log'
    },
    startRecording: {
      tooltip: '[[R]] Start recording'
    },
    stopRecording: {
      tooltip: '[[R]] Stop recording'
    },
    table: {
      init: 'Time taken in "beforeCreated" and "created" of lifecycle',
      render: 'Time taken to create the instance in javascript',
      patch: 'Time taken to render in dom'
    }
  }
}
