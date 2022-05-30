// persistent variables, rest is not saved in local storage
import { createStore } from 'vuex'
import createPersistedState from 'vuex-persistedstate';
import { getField, updateField } from 'vuex-map-fields';

const persisted_state = createPersistedState({ });
// for specific variables add: paths: [ 'project_dir', 'experiment_name', 'output_name' ]

const store = createStore({
  plugins: [persisted_state],
  state: {
    project_dir: '',
    project_dir_history: [],
    settings: {
      smoothing_value: 0.5,
      smoothing_toggle: false,
      show_val: true,
    }
  },
  getters: {
    getField
  },
  mutations: {
    updateField,
    settings(state, settings) {
      state.settings = Object.assign({}, state.settings, settings);
    }
  },
  actions: {
  }
})

export default store;
