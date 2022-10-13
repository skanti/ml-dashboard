<template>
  <!-- search bar -->
  <div class='row q-pa-md' id='div_menu_bar'>
    <div class='row items-center q-col-gutter-md' style='width:100%'>
      <div class='col-9 col-sm-6'>
        <q-input class='q-pa-none' v-model='project_dir' label='Project Directory' outlined bottom-slots>
          <template v-slot:prepend>
            <q-icon name='fas fa-folder'/>
            <q-btn-dropdown flat>
              <q-list>
                <q-item v-for='v in project_dir_history' :key='"hist" + v' @click="() => { project_dir = v; }" v-close-popup clickable>
                  <q-item-section>
                    <q-item-label>{{v}}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </template>
          <template v-slot:append>
            <q-icon name='fas fa-times' @click='project_dir = ""' class='cursor-pointer'/>
            <q-btn @click='click_search_experiments' label='Checkout'
              color='blue-5' icon='fas fa-sign-in-alt' :disable='project_dir == ""' unelevated dense/>
          </template>
        </q-input>
      </div>
    </div>
  </div>
  <!-- search bar -->

  <!-- table -->
  <div class='row q-pa-md q-col-gutter-lg'>
    <div class='col-12 col-sm-3'>
      <q-card color='blue-5'>
        <q-table ref='my_table' tabindex='0' title='Experiments' :rows='experiments' :loading='loading'
          :columns='columns' :pagination='pagination' row-key='id' :filter='filter' @row-click='click_experiment'>
          <!-- header -->
          <template v-slot:top>
            <q-card class='fit' flat>
              <q-card-section>
                <q-input dense debounce='300' v-model='filter' placeholder='Fuzzy Search'>
                  <template v-slot:append>
                    <q-icon name='fas fa-search' />
                  </template>
                </q-input>
              </q-card-section>
            </q-card>
          </template>
          <!-- header -->

          <!-- body -->
          <template v-slot:body='props'>
            <q-tr class='cursor-pointer' :class='selected.has(props.row.id) ? "bg-blue-3" : "bg-grey-1"'
              :props='props' @click='click_experiment(props.row)'>
              <q-td key='color' :props='props' >
                <q-avatar v-if='data[props.row.id] && selected.has(props.row.id)' size='sm'
                  icon='fas fa-palette' :style='"background-color: white; color:" + data[props.row.id].color'
                  @click.stop='click_color(props.row)' font-size='16px' />
              </q-td>
              <q-td  key='id' :props='props'>
                <q-btn color='dark' class='text-bold' size='sm'
                  @click='e => click_copy_to_clipboard(e, props.row.id)' flat dense no-caps>
                  <div class='ellipsis'> {{ props.row.id }} </div>
                  <q-tooltip> Copy to clipboard </q-tooltip>
                </q-btn>
              </q-td>
              <q-td key='timestamp' :props='props' >
                <q-btn size='sm' icon='far fa-clock' dense flat>
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

    <div class='col-12 col-sm-9'>
      <div class='row items-center q-pb-md q-gutter-md'>
        <q-btn color='green-5' @click='click_refresh' unelevated dense no-caps>
          <q-icon name='fas fa-sync-alt'/>
          <div class='q-mx-sm'> Refresh</div>
          <q-circular-progress :value='parseInt(100*timer.value/timer.max)' size='md' color='orange-5' :max='100.0' show-value />
        </q-btn>
        <q-field outlined dense>
          <template v-slot:control>
            <q-option-group v-model='settings.curve_visibility' :options='show_curves_options' color='blue-5'
              type='checkbox' @update:model-value='v => onchange_settings()' dense inline />
          </template>
        </q-field>
        <q-input v-model='settings.smoothing_value' label='Smoothing' maxlength='10' style='max-width:200px'
          @update:model-value='v => onchange_settings({smoothing_value: v})' @debounce='300' outlined dense >
          <template v-slot:append>
            <q-toggle v-model='settings.smoothing_toggle' color='blue-5'
              @update:model-value='v => onchange_settings({smoothing_toggle: v})' keep-color />
            <q-toggle v-model='settings.show_error_bars' color='blue-5' icon='fas fa-grip-lines'
              @update:model-value='v => onchange_settings({show_error_bars: v})' :disable='!settings.smoothing_toggle'/>
          </template>
        </q-input>
        <q-field outlined dense>
          <template v-slot:control>
            <q-toggle label='Show markers' v-model='settings.show_markers' color='blue-5'
              @update:model-value='v => onchange_settings()' dense />
          </template>
        </q-field>
        <q-field outlined dense>
          <template v-slot:control>
            <q-toggle label='Log scale' v-model='settings.log_scale' color='blue-5'
              @update:model-value='v => onchange_settings()' dense />
          </template>
        </q-field>
      </div>
      <div class='row q-col-gutter-md' >
        <div :class='"col-12 col-sm-" + card_size' v-for='[k,v] in Object.entries(charts)'
          :key='"root_plot" + k + "_idx" + counter'>
          <q-card class='bg-grey-1'>
            <q-responsive :ratio='1'>
              <Chart :metric='k' :data='v' :settings='settings'/>
            </q-responsive>
          </q-card>
        </div>
      </div>
    </div>

  </div>
</template>

<script>

import axios from 'axios';
import { mapState } from 'vuex'
import { mapFields } from 'vuex-map-fields';
import Chart from '@/components/Chart';
import { copyToClipboard } from 'quasar'
import lodash from 'lodash';
import { useQuasar } from 'quasar';
import ColorPalette from '@/components/ColorPalette';

export default {
  name: 'App',
  components: { Chart },
  data () {
    return {
      counter: 0,
      experiments: [],
      data: {},
      selected: new Set(),
      palette: new ColorPalette(),
      charts: {},
      show_curves_options: [ { label: 'Show train', value: 'show_train' }, { label: 'Show val', value: 'show_val' } ],
      loading: false,
      timer: {
        value: 0,
        max: 30, // <- in seconds
      },
      card_size: 4,
      filter: '',
      pagination: { sortBy: 'timestamp', descending: true, page: 1, rowsPerPage: 50 },
      columns: [
        { name: 'color', align: 'left', label: 'Color', field: 'color' },
        { name: 'id', align: 'left', label: 'ID', field: 'id', sortable: true },
        { name: 'timestamp', align: 'left', label: 'Date', field: 'timestamp', sortable: true },
      ]
    }
  },
  setup() {
    const q = useQuasar();
    return { q$: q }
  },
  created: function () {
    this.click_refresh();
    this.auto_refresh();
  },
  computed: {
    ...mapState(['settings']),
    ...mapFields(['project_dir', 'project_dir_history']),
  },
  methods: {
    onchange_settings(v) {
      this.$store.commit('settings', v);
      this.build_charts();
    },
    linear_smooth(scalars, params, method) {
      let val_last = scalars[0];
      let error_last = 0.0;
      const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
      const smoothed = []
      const errors = [];
      const num  = scalars.length;
      for (let i = 0; i < num; i++) {
        const val = scalars[i];
        let val_smoothed = null;
        if (method === 'window') {
          const left = clamp(i - params.window, 0, num);
          const arr = lodash.range(left, i).map(j => scalars[j]);
          const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
          val_smoothed = mean;
        } else {
          val_smoothed = val_last*params.weight + (1.0 - params.weight)*val;
        }
        const e = params.weight*error_last + (1.0 - params.weight)*Math.abs(val - val_smoothed);
        smoothed.push(val_smoothed)
        errors.push(e);
        val_last = val_smoothed;
        error_last = e;
      }
      return [smoothed, errors]
    },
    build_charts() {
      let charts = {};

      const experiments = Array.from(this.selected).filter(x => !!x);
      const metrics_all = new Set();
      // collect all metrics
      for (let id of experiments) {
        const plot_data0 = this.data[id]['rows'];

        // group & find metrics from header
        const meta_fields = ['step', 'epoch', 'stage'];
        // ignore fields ending with this pattern
        const metrics = lodash(plot_data0).flatMap(lodash.keys)
          .uniq()
          .reject(x => meta_fields.includes(x))
          .reject(x => x.endsWith('_step') || x.endsWith('_epoch'))
          .value();
          metrics.forEach(x => metrics_all.add(x));
      }
      metrics_all.add('duration');
      metrics_all.delete('timestamp');

      // no smoothing list
      const no_smoothing = new Set(['timestamp', 'duration', 'lr']);
      for (let id of experiments) {
        let plot_data0 = this.data[id]['rows'];

        const color = this.data[id]['color'];
        // add timestamp field if missing
        const metrics = lodash(plot_data0).flatMap(lodash.keys).uniq().value();
        const sec2hours = 1.0/3600.0;
        if (metrics.includes('timestamp')) {
          const first_timestamp = plot_data0[0].timestamp
          plot_data0 = plot_data0.map(x => ({ ...x,
          duration: (x.timestamp - first_timestamp)*sec2hours, timestamp: new Date(x.timestamp*1e3) }));
        } else {
          plot_data0 = plot_data0.map(x => ({ ...x, duration: 0.0, timestamp: new Date() }));
        }

        // remove duplicates
        const plot_data = lodash(plot_data0)
          .orderBy('timestamp', 'desc')
          .uniqBy(x => [x.step,'_', x.stage].join())
          .orderBy('step', 'asc')
        
        for (let metric of metrics_all.values()) {
          // train
          let y_train = plot_data.filter({stage: 0}).map(x => x[metric]).value()
          let x_train = plot_data.filter({stage: 0}).map(x => x['step']).value()
          const mask_train = y_train.map(x => Number.isFinite(x));
          // val
          let y_val = plot_data.filter({stage: 1}).map(x => x[metric]).value()
          let x_val = plot_data.filter({stage: 1}).map(x => x['step']).value()
          const mask_val = y_val.map(x => Number.isFinite(x));
          // cleanup
          y_train = y_train.filter((x, i) => mask_train[i]);
          x_train = x_train.filter((x, i) => mask_train[i]);
          y_val = y_val.filter((x, i) => mask_val[i]);
          x_val = x_val.filter((x, i) => mask_val[i]);
          // smooth train curve
          let error = null;
          if (this.settings.smoothing_toggle && !no_smoothing.has(metric)) {
            [y_train, error] = this.linear_smooth(y_train, { weight: this.settings.smoothing_value }, 'ema');
            if (!this.settings.show_error_bars) {
              error = null;
            }
          }
          const chart = { experiment_id: id, metric: metric,
            train: { y: y_train, x: x_train, error: error }, val: { y: y_val, x: x_val}, color: color};

          charts[metric] = charts[metric] || [];
          charts[metric].push(chart);
        }
      }
      this.counter += 1;
      this.charts = charts;
    },
    click_search_experiments () {
      const known = this.project_dir_history.includes(this.project_dir);
      if (!known) {
        this.project_dir_history.unshift(this.project_dir);
        this.project_dir_history = this.project_dir_history.slice(0, 5);
      }
      this.loading = true;
      let query = { project_dir: this.project_dir };
      return axios.get('/api/project', { params: query }).then(res => {
        this.experiments = res.data;
      }).finally(() => {
        this.loading = false;
      });
    },
    async click_experiment (row) {
      let id = row.id;
      this.loading = true;
      let selected = new Set(this.selected);
      if (selected.has(id)) {
        selected.delete(id);
      } else {
        try {
          const res = await axios.get('/api/experiment', { params: { project_dir: this.project_dir, experiment: row }});
          this.data[id] = { rows: res.data, color: this.palette.get() };
          selected.add(id);
        } catch (e) {
          this.$q.notify({ message: 'Failed to load experiment', icon: 'error', color: 'red-5' });
        }
      }
      this.selected = selected;
      this.loading = false;
      this.build_charts();
    },
    async click_refresh () {
      if (this.project_dir == '')
        return;
      await this.click_search_experiments();
      this.loading = true;
      for (let row of this.experiments) {
        let id = row.id;
        if (this.selected.has(id)) {
          try {
            const res = await axios.get('/api/experiment', { params: { project_dir: this.project_dir, experiment: row }});
            let color_old = this.data[id].color;
            this.data[id] = { rows: res.data, color: color_old };
          } catch(err) {
            console.log(err);
          }
        }
      }
      this.loading = false;
      this.build_charts();
    },
    auto_refresh () {
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
    click_copy_to_clipboard (e, id) {
      copyToClipboard(id).then(() => {
        this.$q.notify({ message: 'Copied to clipboard!', icon: 'check_circle', color: 'green-5' });
      });
      e.stopPropagation();
    },
    click_color (row) {
      const { id } = row;
      this.data[id].color = this.palette.get();
      this.build_charts();
    }
  },
}
</script>

<style lang='sass'>
</style>
