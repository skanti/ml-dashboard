<template>
  <!-- search bar -->
  <div class="row q-pa-md" id="div_menu_bar">
    <div class="row items-center q-col-gutter-md" style="width:100%">
      <div class="col-9 col-sm-6">
        <q-input class="q-pa-none" v-model="project_dir" label="Project Directory" outlined bottom-slots>
          <template v-slot:prepend>
            <q-icon name="folder"/>
          </template>
          <template v-slot:append>
            <q-icon name="close" @click="project_dir = ''" class="cursor-pointer"/>
          </template>
        </q-input>
      </div>
      <div class="col-3 col-sm-3 q-gutter-sm">
        <q-btn @click="click_search_experiments" label="Checkout" color="blue-5" icon="expand_more" :disable='project_dir == ""' unelevated/>
        <q-btn label="Refresh" icon="update" color="green-5" @click="click_refresh" unelevated />
        <q-circular-progress :value="parseInt(100*timer.value/timer.max)" size="md" color="orange-5" :max="100.0" show-value />
      </div>
    </div>
  </div>
  <!-- search bar -->

  <!-- table -->
  <div class="row q-pa-md q-col-gutter-lg">
    <div class="col-12 col-sm-3">
      <q-card color="blue-5">
        <q-table ref="my_table" tabindex="0" title="Experiments" :rows="experiments" :loading="loading"
          :columns="columns" :pagination="pagination" row-key="id" :filter="filter" @row-click="click_experiment">
          <!-- header -->
          <template v-slot:top>
            <q-card class="fit" flat>
              <q-card-section>
                <q-input dense debounce="300" v-model="filter" placeholder="Fuzzy Search">
                  <template v-slot:append>
                    <q-icon name="search" />
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
              <q-td key="color" :props="props" >
                <q-avatar v-if="data[props.row.id] && selected.has(props.row.id)" size="sm"
                  icon="palette" :style="'background-color: white; color:' + data[props.row.id].color"
                  font-size="16px" />
              </q-td>
              <q-td  key="id" :props="props">
                <q-btn color="dark" class="text-bold" size="sm"
                  @click="e => click_copy_to_clipboard(e, props.row.id)" flat dense no-caps>
                  <div class="ellipsis"> {{ props.row.id }} </div>
                  <q-tooltip> Copy to clipboard </q-tooltip>
                </q-btn>
              </q-td>
              <q-td key="timestamp" :props="props" >
                <q-btn size="sm" icon="schedule" dense flat>
                  <q-tooltip> {{ props.row.timestamp }} </q-tooltip>
                </q-btn>
              </q-td>
            </q-tr>
          </template>
          <!-- body -->

        </q-table>
      </q-card>
    </div>
    <!-- table -->

    <div class="col-12 col-sm-9">
      <div class="q-pb-md q-gutter-md">
      </div>
      <div class="row q-col-gutter-md" >
        <div :class="'col-12 col-sm-' + card_size" v-for="[k,v] in Object.entries(charts)"
          :key="'root_plot' + k + '_idx' + counter">
          <q-card class="bg-grey-1">
            <q-responsive :ratio="1">
              <Chart :metric="k" :data="v"> </Chart>
            </q-responsive>
          </q-card>
        </div>
      </div>
    </div>

  </div>
</template>

<script>

import axios from 'axios';
//import { mapState } from 'vuex'
import Chart from "@/components/Chart";
import { copyToClipboard } from 'quasar'
import lodash from 'lodash';

export default {
  name: 'App',
  components: { Chart },
  data () {
    return {
      counter: 0,
      experiments: [],
      data: {},
      selected: new Set(),
      charts: {},
      loading: false,
      timer: {
        value: 0,
        max: 30, // <- in seconds
      },
      card_size: 4,
      filter: "",
      pagination: { sortBy: 'timestamp', descending: true, page: 1, rowsPerPage: 50 },
      columns: [
        { name: 'color', align: 'left', label: 'Color', field: 'color' },
        { name: 'id', align: 'left', label: 'ID', field: 'id', sortable: true },
        { name: 'timestamp', align: 'left', label: 'Date', field: 'timestamp', sortable: true },
      ]
    }
  },
  created: function () {
    this.click_refresh();
    this.auto_refresh();
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
  },
  methods: {
    build_charts() {
      let charts = {};
      for (let id of Array.from(this.selected)) {
        const plot_data = this.data[id]["rows"];
        const color = this.data[id]["color"];
        if (plot_data == undefined) {
          continue;
        }
        // group
        const grouper_fn = function(res, item, name){  
          res[item.type] = res[item.type] || {}; 
          res[item.type][name] = item;
        };
        const metrics = lodash(plot_data[0]).omit(["step", "epoch", "stage"]).keys().value();
        for (let metric of metrics) {
          const y_train = lodash(plot_data).filter({stage: 0}).map(x => x[metric]).value()
          const x_train = lodash(plot_data).filter({stage: 0}).map(x => x["step"]).value()
          const y_val = lodash(plot_data).filter({stage: 1}).map(x => x[metric]).value()
          const x_val = lodash(plot_data).filter({stage: 1}).map(x => x["step"]).value()
          const chart = { experiment_id: id, metric: metric,
            train: { y: y_train, x: x_train }, val: { y: y_val, x: x_val}, color: color};

          charts[metric] = charts[metric] || [];
          charts[metric].push(chart);
        }
      }
      this.counter += 1;
      this.charts = charts;
    },
    click_search_experiments: function() {
      this.loading = true;
      let query = { project_dir: this.project_dir };
      return axios.get("/api/project", { params: query }).then(res => {
        this.experiments = res.data;
      }).finally(() => {
        this.loading = false;
      });
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
          const res = await axios.get("/api/experiment", { params: { project_dir: this.project_dir, experiment: row }});
          this.data[id] = { rows: res.data, color: this.random_color() };
          selected.add(id);
        } catch (e) {
          this.$q.notify({ message: 'Failed to load experiment', icon: 'error', color: "red-5" });
        };
      }
      this.selected = selected;
      this.loading = false;
      this.build_charts();
    },
    click_refresh: async function() {
      if (this.project_dir == "")
        return;
      await this.click_search_experiments();
      this.loading = true;
      for (let row of this.experiments) {
        let id = row.id;
        if (this.selected.has(id)) {
          const res = await axios.get("/api/experiment", { params: { project_dir: this.project_dir, experiment: row }});
          let color_old = this.data[id].color;
          this.data[id] = { rows: res.data, color: color_old };
        }
      }
      this.loading = false;
      this.build_charts();
    },
    auto_refresh: function() {
      let timer = setInterval(() => {
        this.timer.value += 1.0;
        if (this.timer.value >= this.timer.max) {
          this.timer.value = 0;
          this.click_refresh();
          clearInterval(timer);
          this.auto_refresh();
        }
      }, 1000);
    },
    click_copy_to_clipboard: function(e, id) {
      copyToClipboard(id).then(() => {
        this.$q.notify({ message: "Copied to clipboard!", icon: 'check_circle', color: "green-5" });
      });
      e.stopPropagation();
    }
  },
}
</script>

<style lang="sass">
</style>
