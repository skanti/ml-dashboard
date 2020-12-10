<template>
  <q-layout view="lHh Lpr lFf">
    <!-- search bar -->
    <div class="row q-pa-md" id="div_menu_bar">
      <div class="row items-center q-col-gutter-md" style="width:100%">
        <div class="col-6">
          <q-input class="q-pa-none" v-model="project_dir" label="File Path" input-class="text-bold" standout="bg-primary text-white" rounded bottom-slots>
            <template v-slot:prepend> <q-icon name="fas fa-file" /> </template>
            <template v-slot:append> <q-icon name="fas fa-times" @click="project_dir = ''" class="cursor-pointer" /> </template>
          </q-input>
        </div>
        <div class="col-1">
          <q-btn @click="click_search_experiments" label="Grab" class="text-bold fit" color="primary" icon="fas fa-arrow-circle-right" :disable='project_dir == ""'>  </q-btn>
        </div>
      </div>
    </div>
    <!-- search bar -->

    <div class="row q-pa-md q-col-gutter-lg">
      <div class="col-3">
        <q-card color="blue-5">
          <q-table ref="myTable" class="my-header" tabindex="0" title="Experiments" :data="experiments" :columns="columns"
            :pagination="pagination" row-key="id" selection="multiple" :selected.sync="selected" :filter="filter"
            @selection="click_experiment">
            <template v-slot:top>
              <q-card class="fit bg-blue-1" flat>
                <q-card-section>
                  <q-input borderless dense debounce="300" v-model="filter" placeholder="Fuzzy Search">
                    <template v-slot:append>
                      <q-icon name="fas fa-search" />
                    </template>
                  </q-input>
                </q-card-section>
                <q-separator inset> </q-separator>
              </q-card>
            </template>
          </q-table>
        </q-card>
      </div>

      <div class="col-9">
        <div class="row q-col-gutter-md" >
          <div :class="'col-' + card_size" v-for="[k,v] in Object.entries(charts)" :key="'root_plot' + k">
            <q-card class="bg-grey-1">
              <Chart :id="k" :data="v"> </Chart>
            </q-card>
          </div>
        </div>
      </div>

    </div>
  </q-layout>
</template>

<script>

import axios from 'axios';
//import { mapState } from 'vuex'
import Chart from "@/components/Chart";


export default {
  name: 'App',
  components: { Chart },
  data () {
    return {
      counter: 0,
      experiments: [],
      data: {},
      plots: {},
      card_size: 4,
      loading: false,
      filter: "",
      selected: [],
      pagination: { sortBy: 'timestamp', descending: true, page: 1, rowsPerPage: 20 },
      gender: [ { label: "F", value: "female" }, { label: "M", value: "male" } ],
      columns: [
        { name: 'id', align: 'left', label: 'ID', field: 'id', sortable: true },
        { name: 'timestamp', align: 'left', label: 'Timestamp', field: 'timestamp', sortable: true },
      ]
    }
  },
  created: function () {
    this.click_search_experiments();
  },
  computed: {
    //...mapState([ "project_dir" ])
    project_dir: {
      get () {
        return this.$store.state.project_dir;
      },
      set (v) {
        this.$store.commit("project_dir", v);
      }
    },
    charts: function() {
      let charts = {};
      for (let experiment of Object.values(this.selected)) {
        const id = experiment.id;
        const plot_data = this.data[id];
        if (plot_data == undefined)
          continue;

        let x = []
        let y_train = {};
        let y_val = {};

        let logs = plot_data.log;
        for (let log of Object.values(logs)) {
          let train = log.loss.train;
          for (let [stats_name,stats_val] of Object.entries(train)) {
            y_train[stats_name] = y_train[stats_name] || [];
            y_train[stats_name].push(stats_val);
          }
          let val = log.loss.val;
          for (let [stats_name,stats_val] of Object.entries(val)) {
            y_val[stats_name] = y_val[stats_name] || [];
            y_val[stats_name].push(stats_val);
          }
          x.push(log.iteration);
        }

        for (let stats_name in y_val) {
          charts[stats_name] = stats_name[stats_name] || {};
          charts[stats_name][id] = charts[stats_name][id] || {}; 

          charts[stats_name][id]["y_train"] = y_train[stats_name];
          charts[stats_name][id]["y_val"] = y_val[stats_name];
          charts[stats_name][id]["x"] = x;
        }
        console.log(id, charts);
          
      }
      return charts;
    },
  },
  methods: {
    click_search_experiments: function() {
      let query = { project_dir: this.project_dir };
      axios.get(process.env.VUE_APP_URL_SERVER + "/project", { params: query }).then(res => {
        this.experiments = res.data;
      });
    },
    click_experiment: async function(details) {
      this.counter += 1;
      if (!details.added)
        return;
      for (let row of Object.values(details.rows)) {
        let id = row.id;
        let res = await axios.get(process.env.VUE_APP_URL_SERVER + "/experiment", { params: row });
        this.$set(this.data, id, res.data);
      }
    },
    plot_selected_experiments: function () {
      //for (let v of Object.values(this.selected)) {
      //  let id = v.id;
      //}
    }
  },
}
</script>

<style lang="sass">
</style>
