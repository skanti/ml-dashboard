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
      <div class="col-3 col-sm-1">
        <q-btn @click="click_search_experiments" label="Checkout" color="blue-5" icon="expand_more" :disable='project_dir == ""'/>
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
                <q-btn color="grey-8" class="text-bold" size="sm"
                  @click="e => click_copy_to_clipboard(e, props.row.id)" dense no-caps>
                  <div class="ellipsis"> {{ props.row.id }} </div>
                  <q-tooltip> Copy to clipboard </q-tooltip>
                </q-btn>
              </q-td>
              <q-td key="timestamp" :props="props" >
                <q-btn size="sm" icon="schedule" dense>
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
        <q-btn label="Refresh" icon="update" color="orange-5" @click="click_refresh" />
        <q-circular-progress :value="parseInt(100*timer.value/timer.max)" size="md" color="orange-5" :max="100.0" show-value />
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
</template>

<script>

import axios from 'axios';
//import { mapState } from 'vuex'
import Chart from "@/components/Chart";
import { copyToClipboard } from 'quasar'



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
    charts: function() {
      /*
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
       */
      return 0;
    },
  },
  methods: {
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
        axios.get("/api/experiment", { params: { project_dir: this.project_dir, experiment: row }}).then(res => {
          this.data[id] = res.data;
          this.data[id]["color"] = this.random_color();
          selected.add(id);
        }).catch (e => {
          this.$q.notify({ message: 'Failed to load experiment', icon: 'error', color: "red-5" });
        });
      }
      this.selected = selected;
      this.loading = false;
    },
    click_refresh: async function() {
      if (this.project_dir == "")
        return;
      await this.click_search_experiments();
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
    },
    auto_refresh: function() {
      let timer = setInterval(() => {
        this.timer.value += 1.0;
        if (this.timer.value >= this.timer.max) {
          console.log("refresh");
          this.timer.value = 0;
          this.click_refresh();
          clearInterval(timer);
          this.auto_refresh();
        }
      }, 1000);
    },
    click_copy_to_clipboard: function(e, id) {
      copyToClipboard(id).then(() => {
        console.log("Copied to clipboard");
      });
      e.stopPropagation();
    }
  },
}
</script>

<style lang="sass">
</style>