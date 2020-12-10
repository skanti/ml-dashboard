import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from "vuex-persistedstate";

const dataState = createPersistedState({
  paths: ['project_dir']
})

Vue.use(Vuex)

export default new Vuex.Store({
  plugins: [dataState],
  state: {
    project_dir: "",
    dummy: 0,
  },
	mutations: {
    project_dir(state, project_dir) {
      state.project_dir = project_dir
    },
    dummy_increment(state) {
			state.dummy += 1
		},
	}
});

