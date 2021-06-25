// persistent variables, rest is not saved in local storage
import { createStore } from 'vuex'
import createPersistedState from 'vuex-persistedstate';

const persisted_state = createPersistedState({ });
// for specific variables add: paths: [ 'project_dir', 'experiment_name', 'output_name' ]

const store = createStore({
  plugins: [persisted_state],
  state: {
    project_dir: '',
    settings: {
      smoothing_value: 0.5,
      smoothing_toggle: false,
      show_val: true,
    }
  },
  mutations: {
    settings(state, settings) {
      state.settings = Object.assign({}, state.settings, settings);
    },
  },
  actions: {
  }
})

export default store;
