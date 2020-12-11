<template>
  <q-layout view="lHh Lpr lFf">
    <!-- search bar -->
    <div class="row q-pa-md" id="div_menu_bar">
      <div class="row items-center q-col-gutter-md" style="width:100%">
        <div class="col-9 col-sm-6">
          <q-input class="q-pa-none" v-model="project_dir" label="File Path" input-class="text-bold"
            standout="bg-primary text-white" rounded bottom-slots>
            <template v-slot:prepend>
              <q-icon name="fas fa-file"/>
            </template>
            <template v-slot:append>
              <q-icon name="fas fa-times" @click="project_dir = ''" class="cursor-pointer"/>
            </template>
          </q-input>
        </div>
        <div class="col-3 col-sm-1">
          <q-btn @click="click_search_experiments" label="Grab" class="text-bold fit"
            color="primary" icon="fas fa-arrow-circle-right" :disable='project_dir == ""'/>
        </div>
      </div>
    </div>
    <!-- search bar -->

    <!-- table -->
    <div class="row q-pa-md q-col-gutter-lg">
      <div class="col-12 col-sm-3">
        <q-card color="blue-5">
          <q-table ref="my_table" tabindex="0" title="Experiments" :data="experiments" :loading="loading"
            :columns="columns" :pagination="pagination" row-key="id" :filter="filter" @row-click="click_experiment">
            <!-- header -->
            <template v-slot:top>
              <q-card class="fit" flat>
                <q-card-section>
                  <q-input dense debounce="300" v-model="filter" placeholder="Fuzzy Search">
                    <template v-slot:append>
                      <q-icon name="fas fa-search" />
                    </template>
                  </q-input>
                </q-card-section>
              </q-card>
            </template>
            <!-- header -->

            <!-- body -->
            <template v-slot:body="props">
              <q-tr class="cursor-pointer" :class="selected.has(props.row.id) ? 'bg-blue-3' : 'bg-grey-1'"
                :props="props" @click="click_experiment(props.row)">
                <q-td  v-for="col in props.cols" :key="col.name" :props="props" >
                  <div v-if="col.name != 'color'">
                    {{ col.value }}
                  </div>
                  <q-btn v-if="col.name == 'color' && data[props.row.id] && selected.has(props.row.id)"
                    icon="fas fa-palette" :style="'background-color: white; color:' + data[props.row.id].color"
                    dense />
                </q-td>
              </q-tr>
            </template>
            <!-- body -->

          </q-table>
        </q-card>
      </div>
      <!-- table -->

      <div class="col-12 col-sm-9">
        <div class="q-pa-md">
          <q-btn label="Refresh" icon="fas fa-sync-alt" color="orange-5" @click="click_refresh" />
        </div>
        <div class="row q-col-gutter-md" >
          <div :class="'col-12 col-sm-' + card_size" v-for="[k,v] in Object.entries(charts)"
            :key="'root_plot' + k + '_no_' + counter">
            <q-card class="bg-grey-1">
              <q-responsive :ratio="1">
                <Chart :id="k" :data="v"> </Chart>
              </q-responsive>
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
      selected: new Set(),
      loading: false,
      card_size: 4,
      filter: "",
      pagination: { sortBy: 'timestamp', descending: true, page: 1, rowsPerPage: 20 },
      columns: [
        { name: 'id', align: 'left', label: 'ID', field: 'id', sortable: true },
        { name: 'timestamp', align: 'left', label: 'Timestamp', field: 'timestamp', sortable: true },
        { name: 'color', align: 'right', label: 'Color', field: 'color' },
      ]
    }
  },
  created: function () {
    if (this.project_dir)
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
      for (let id of Array.from(this.selected)) {
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
          charts[stats_name] = charts[stats_name] || {};
          charts[stats_name][id] = charts[stats_name][id] || {};

          charts[stats_name][id]["y_train"] = y_train[stats_name];
          charts[stats_name][id]["y_val"] = y_val[stats_name];
          charts[stats_name][id]["x"] = x;
          charts[stats_name][id]["color"] = plot_data.color;
        }
      }
      this.counter += 1;
      return charts;
    },
  },
  methods: {
    click_search_experiments: async function() {
      this.loading = true;
      let query = { project_dir: this.project_dir };
      let res = await axios.get(process.env.VUE_APP_URL_SERVER + "/project", { params: query });
      this.experiments = res.data;
      this.loading = false;
    },
    random_color: function() {
      let letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++)
        color += letters[Math.floor(Math.random() * 16)];
      return color;
    },
    click_experiment: async function(row) {
      let id = row.id;
      this.loading = true;
      let selected = new Set(this.selected);
      if (selected.has(id)) {
        selected.delete(id);
      } else {
        try {
          let res = await axios.get(process.env.VUE_APP_URL_SERVER + "/experiment", { params: row });
          this.data[id] = res.data;
          this.data[id]["color"] = this.random_color();
          selected.add(id);
        } catch (e) {
          this.$q.notify({ message: 'Failed to load experiment', icon: 'fas fa-exclamation-triangle',
            color: "red-5" });
        }
      }
      this.selected = selected;
      this.loading = false;
    },
    click_refresh: async function() {
      this.loading = true;
      for (let row of this.experiments) {
        let id = row.id;
        if (this.selected.has(id)) { 
          let res = await axios.get(process.env.VUE_APP_URL_SERVER + "/experiment", { params: row });
          let data_old = this.data[id];
          this.data[id] = res.data;
          this.data[id].color = data_old.color;
        }
      }
      this.counter += 1;
      this.loading = false;
    }
  },
}
</script>

<style lang="sass">
</style>
