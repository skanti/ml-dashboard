<template>
  <!-- search bar -->
  <div class='row q-pa-sm q-gutter-sm'>
  <q-input class='q-pa-none' v-model='project_dir' label='Project Directory'
      outlined bottom-slots style='min-width:400px'>
      <template v-slot:prepend>
        <q-btn-dropdown size="sm" flat dense>
          <q-list>
            <q-item v-for='v in project_dir_history' :key='"hist" + v' @click="() => { project_dir = v; }" v-close-popup clickable>
              <q-item-section>
                <q-item-label>{{v}}</q-item-label>
              </q-item-section>
              <q-item-section side>
              <q-btn size="sm" color="red-5" icon="fas fa-trash" @click.stop="() => {project_dir_history = project_dir_history.filter(x => x !== v);}" flat dense/>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </template>
      <template v-slot:append>
        <q-btn icon='fas fa-times' color="red-5" @click='project_dir = ""' flat dense/>
        <q-btn @click='click_search_experiments'
          color='primary' icon='fas fa-sign-in-alt' :disable='project_dir == ""' flat  dense/>
      </template>
    </q-input>
    <q-btn label='Dump State' icon='fas fa-download' 
      @click='click_download_state_dict' flat dense no-caps/>
    <q-file label='Load State' accept='.json'
      @update:model-value='click_upload_state_dict' filled dense hide-bottom-space item-aligned>
      <template v-slot:prepend> <q-icon name='fas fa-upload' /> </template>
    </q-file>
  </div>

  <!-- table -->
  <div class='row q-pa-sm q-col-gutter-md'>
    <div class='col-12 col-sm-3'>
      <q-card color='primary' flat bordered>
        <q-table ref='my_table' tabindex='0' title='Experiments' :rows='experiments' :loading='loading'
          :columns='columns' :pagination='pagination' row-key='id' :filter='{}' :filter-method='filter_method' @row-click='click_experiment'>
          <!-- header -->
          <template v-slot:top>
            <q-card class='fit' flat>
              <q-card-section class='q-pa-sm'>
                <!-- fuzzy search -->
                <q-input dense debounce='500' v-model='search' placeholder='Fuzzy Search'>
                  <template v-slot:prepend>
                    <q-icon name='fas fa-search' />
                  </template>
                  <template v-slot:append>
                    <q-btn icon='fas fa-times' color="red-5" @click="search = ''" flat dense/>
                  </template>
                </q-input>
              </q-card-section>

                <!-- emoji filter -->
                <q-card-section class='q-pa-sm'>
                  <q-toggle v-for='r in rating_options.slice(0, -1)' v-model='rating_filter' :color='r.color'
                    :val='r.value' :icon='r.icon' size='sm' :key='"rating_filter_" + r.label' keep-color/>
                </q-card-section>
            </q-card>
          </template>

          <template v-slot:header="props">
            <q-tr :props="props">
              <q-th v-for="col in props.cols" :key="col.name" :props="props">
                {{ col.label }}
              </q-th>
            </q-tr>
          </template>

          <!-- body -->
          <template v-slot:body='props'>
            <q-tr class='cursor-pointer' :class='selected.has(props.row.id) ? "bg-grey-9" : "bg-transparent"'
              :props="props" @click="click_experiment(props.row)">
              <q-td  key='id' :props='props'>
                <!-- color -->
                <q-btn v-if='data[props.row.id] && selected.has(props.row.id)' size='sm'
                  icon='fas fa-palette' :style='"color:" + data[props.row.id].color'
                  @click.stop='click_color(props.row)' font-size='16px' dense flat />

                <!-- experiment name -->
                <q-btn class='text-bold' size='sm'
                  @click='e => click_copy_to_clipboard(e, props.row.id)' flat dense no-caps>
                  <div class='ellipsis'> {{ props.row.id }} </div>
                  <q-tooltip> {{ parse_datetime(props.row.timestamp) }} </q-tooltip>
                </q-btn>

                <!-- starring -->
                <q-btn size='xs' :text-color='props.row.id in starred ? "yellow-8" : "white"' :icon='props.row.id in starred ? "fas fa-star" : "far fa-star"'
                  @click.stop='click_star(props.row)' flat dense/>

                <!-- rating -->
                <q-btn-dropdown size='xs' :color='make_rating_style(props.row).color'
                  :icon='make_rating_style(props.row).icon' @click.stop dense flat auto-close>
                  <q-list>
                    <q-item v-for='r in rating_options' clickable v-close-popup @click.stop='click_rate(props.row, r.value)' :key='"rating" + r.value'>
                      <q-item-section>
                        <q-btn size='xs' :text-color='r.color' :icon='r.icon' flat dense/>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>

                <!-- notes -->
                <q-btn :icon='(notes[props.row.id] ? "fas" : "far") + " fa-comment-alt"' size='sm' @click.stop dense flat no-caps>
                <q-tooltip v-if='notes[props.row.id]' class="bg-white text-dark q-pa-xs" style="border: 1px solid #f1f1f1; font-size:1em">
                  <div v-html='markdown(notes[props.row.id])'/>
                </q-tooltip>
                <q-popup-edit v-model='notes[props.row.id]' @update:model-value='v => onchange_notes(props.row.id, v)'
                  auto-save v-slot="scope" style='max-width:300px'>
                  <q-input ref='textarea' type='textarea' rows=3 v-model='scope.value' 
                    dense autofocus @keyup.enter.stop />
                    <div v-html='markdown(scope.value)' style="max-width:300px"/>
                  </q-popup-edit>
                </q-btn>
              </q-td>

              <q-td key='selected' :props='props' >
                <q-btn size='sm' :icon='selected.has(props.row.id) ? "far fa-check-square" : "fa-regular fa-square"' dense flat/>
              </q-td>

              <q-td key='timestamp' :props='props' >
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
            <q-option-group v-model='settings.curve_visibility' :options='show_curves_options' color='primary'
              type='checkbox' @update:model-value='v => onchange_settings()' dense inline />
          </template>
        </q-field>
        <q-input v-model='settings.smoothing_value' label='Smoothing' maxlength='10' style='max-width:200px'
          @update:model-value='v => onchange_settings({smoothing_value: v})' @debounce='1000' outlined dense >
          <template v-slot:append>
            <q-toggle v-model='settings.smoothing_toggle' color='primary'
              @update:model-value='v => onchange_settings({smoothing_toggle: v})' keep-color />
            <q-toggle v-model='settings.show_error_bars' color='primary' icon='fas fa-grip-lines'
              @update:model-value='v => onchange_settings({show_error_bars: v})' :disable='!settings.smoothing_toggle'/>
          </template>
        </q-input>
        <q-field outlined dense>
          <template v-slot:control>
            <q-toggle label='Show markers' v-model='settings.show_markers' color='primary'
              @update:model-value='v => onchange_settings()' dense />
          </template>
        </q-field>
        <q-field outlined dense>
          <template v-slot:control>
            <q-toggle label='Log scale' v-model='settings.log_scale' color='primary'
              @update:model-value='v => onchange_settings()' dense />
          </template>
        </q-field>
      </div>
      <div class='row q-col-gutter-md' >
        <div :class='"col-12 col-sm-" + card_size' v-for='[k,v] in Object.entries(charts)'
          :key='"root_plot" + k + "_idx" + counter'>
          <q-card class='bg-grey-1' flat bordered>
            <q-responsive :ratio='1'>
              <Chart :metric="k" :data="v" :settings="settings"/>
            </q-responsive>
          </q-card>
        </div>
      </div>
    </div>

  </div>
</template>

<script>

import { marked } from 'marked';
import axios from 'axios';
import { mapState } from 'vuex'
import { mapFields } from 'vuex-map-fields';
import Chart from '@/components/Chart';
import { copyToClipboard } from 'quasar'
import lodash from 'lodash';
import { useQuasar } from 'quasar';
import ColorPalette from '@/components/ColorPalette';
// eslint-disable-next-line
import { format } from 'date-fns'

export default {
  name: 'App',
  components: { Chart },
  data() {
    return {
      counter: 0,
      experiments: [],
      data: {},
      selected: new Set(),
      palette: new ColorPalette(),
      charts: {},
      show_curves_options: [ { label: 'Show train', value: 'show_train' }, { label: 'Show val', value: 'show_val' } ],
      rating_options: [
        { value: 0, color: 'primary', icon: 'fas fa-exclamation-circle', label: 'new' },
        { value: 1, color: 'green-5', icon: 'fas fa-plus-circle', label: 'success' },
        { value: 2, color: 'orange-5', icon: 'fas fa-dot-circle', label: 'average' },
        { value: -1, color: 'red-5', icon: 'fas fa-minus-circle', label: 'failure' },
        { value: -2, color: 'purple-5', icon: 'fas fa-bug', label: 'bug' },
        { value: -3, color: 'black', icon: 'fas fa-skull-crossbones', label: 'crash' },
        { value: -4, color: 'black', icon: 'fas fa-eye', label: 'hide' },
        { value: undefined, color: 'white', icon: '', label: '' }
      ],
      loading: false,
      timer: {
        value: 0,
        max: 30, // <- in seconds
      },
      card_size: 4,
      pagination: { sortBy: 'timestamp', descending: true, page: 1, rowsPerPage: 50 },
      columns: [
        { name: 'id', align: 'left', label: 'Experiment', field: 'id', sortable: false },
        { name: 'selected', align: 'left', label: '' },
        { name: 'timestamp', align: 'left', label: '', field: 'timestamp' }
      ]
    }
  },
  setup() {
    marked.use({ gfm: true });
    const q = useQuasar();
    return { q$: q }
  },
  created() {
    this.click_refresh();
    this.auto_refresh();
    this.q$.dark.set(true)
  },
  computed: {
    ...mapState(['settings']),
    ...mapFields(['project_dir', 'project_dir_history', 'search', 'starred', 'rating', 'rating_filter', 'notes']),
  },
  methods: {
    onchange_settings(v) {
      this.$store.commit('settings', v);
      this.build_charts();
    },
    onchange_notes(key, val) {
      this.$store.commit('notes', { key: val });
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
      const t0 = new Date().getTime();

      const charts = {};

      const experiments = Array.from(this.selected).filter(x => !!x);
      const metrics_all = new Set();
      // collect all metrics
      for (let id of experiments) {
        const plot_data0 = this.data[id]['rows'];

        // group & find metrics from header
        const meta_fields = ['step', 'epoch', 'stage', 'time'];
        const metrics = lodash(plot_data0).flatMap(lodash.keys).uniq().value();
        plot_data0.metrics = metrics;
        // ignore fields ending with this pattern
        const metrics_clean = lodash(metrics)
          .reject(x => meta_fields.includes(x))
          .reject(x => x.endsWith('_step') || x.endsWith('_epoch'))
          .value();
          metrics_clean.forEach(x => metrics_all.add(x));
      }
      metrics_all.add('duration');
      metrics_all.delete('timestamp');

      // no smoothing list
      const no_smoothing = new Set(['timestamp', 'duration', 'lr']);
      for (let id of experiments) {
        let plot_data0 = this.data[id]['rows'];

        const color = this.data[id]['color'];
        //const metrics = lodash(plot_data0).flatMap(lodash.keys).uniq().value();
        const metrics = plot_data0.metrics;
        const sec2hours = 1.0/3600.0;
        if (metrics.includes('timestamp')) {
          const first_timestamp = plot_data0[0].timestamp
          plot_data0 = plot_data0.map(x =>  ({
            ...x,
            duration: (x.timestamp - first_timestamp)*sec2hours,
            timestamp: new Date(x.timestamp*1e3)
          }));
        } else {
          // add timestamp field if missing
          plot_data0 = plot_data0.map(x => ({ 
            ...x,
            duration: 0.0,
            timestamp: new Date()
          }));
        }
        // remove duplicates & order by step
        const plot_data = lodash(plot_data0)
          .orderBy('timestamp', 'desc')
          .uniqBy(x => [x.step,'_', x.stage].join())
          .orderBy('step', 'asc').value();

        // get train & val
        const train = lodash(plot_data).filter({stage: 0}).value();
        const val = lodash(plot_data).filter({stage: 1}).value()
        const x_train = train.map(x => x['step']);
        const x_val = val.map(x => x['step']);
        const timehint_train = train.map(x => x['timestamp']);
        const timehint_val = val.map(x => x['timestamp']);

        for (let metric of metrics_all.values()) {
          // train
          const y_train = train.map(x => x[metric]);
          const mask_train = y_train.map(x => Number.isFinite(x));
          // val
          const y_val = val.map(x => x[metric]);
          const mask_val = y_val.map(x => Number.isFinite(x));
          // cleanup
          const y_train_cleaned = y_train.filter((x, i) => mask_train[i]);
          const x_train_cleaned = x_train.filter((x, i) => mask_train[i]);
          const y_val_cleaned = y_val.filter((x, i) => mask_val[i]);
          const x_val_cleaned = x_val.filter((x, i) => mask_val[i]);
          const timehint_train_cleaned = timehint_train.filter((x, i) => mask_train[i]);
          const timehint_val_cleaned = timehint_val.filter((x, i) => mask_val[i]);
          // smooth train curve
          let error = null;
          let y_train_smoothed = y_train_cleaned;
          if (this.settings.smoothing_toggle && !no_smoothing.has(metric)) {
            [y_train_smoothed, error] = this.linear_smooth(y_train_cleaned, { weight: this.settings.smoothing_value }, 'ema');
            if (!this.settings.show_error_bars) {
              error = null;
            }
          }
          const chart = { experiment_id: id, metric: metric,
            train: { y: y_train_smoothed, x: x_train_cleaned, error: error, hint: timehint_train_cleaned },
            val: { y: y_val_cleaned, x: x_val_cleaned, hint: timehint_val_cleaned },
            color: color};

          charts[metric] = charts[metric] || [];
          charts[metric].push(chart);
        }
      }
      this.counter += 1;
      this.charts = charts;
      const t1 = new Date().getTime();
      const duration = t1 - t0;
      console.log(`parse_duration=${duration}ms`)
    },
    click_search_experiments () {
      const is_known = this.project_dir_history.includes(this.project_dir);
      if (is_known) {
        const idx = this.project_dir_history.indexOf(this.project_dir);
        this.project_dir_history.splice(idx, 1);
        this.project_dir_history.unshift(this.project_dir);
      } else {
        // add to head
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
          this.q$.notify({ message: 'Failed to load experiment', icon: 'error', color: 'red-5' });
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
        this.q$.notify({ message: 'Copied to clipboard!', icon: 'fas fa-check-circle', color: 'green-5' });
      });
      e.stopPropagation();
    },
    click_color (row) {
      const { id } = row;
      this.data[id].color = this.palette.get();
      this.build_charts();
    },
    click_star (row) {
      const { id } = row;
      const starred = Object.assign({}, this.starred);
      if (id in starred) {
        delete starred[id];
        this.q$.notify({ message: `Experiment unstarred: ${id}`, color: 'orange-5' });
      } else {
        starred[id] = 1;
        this.q$.notify({ message: `Experiment starred: ${id}`, color: 'green-5' });
      }
      this.starred = starred;
    },
    click_rate(row, value) {
      const { id } = row;
      const rating = Object.assign({}, this.rating);
      if (rating[id] == value) {
        rating[id] = 0;
      } else {
        rating[id] = value;
      }
      this.rating = rating;
    },
    filter_method(rows) {
      // fuzzy filter
      if (this.search) {
        rows = rows.filter(x => x.id.includes(this.search));
      } else {
        // filter for ratings
        const ratings = new Set(this.rating_filter);
        ratings.add(undefined);
        rows = rows.filter(x => ratings.has(this.rating[x.id]));
      }
      return rows;
    },
    make_rating_style(row) {
      const { id } = row;
      const value = this.rating[id];
      const hit = this.rating_options.find(x => x.value === value);
      return hit;
    },
    parse_datetime(timestamp) {
      return format(new Date(timestamp), 'dd-MMM-yyyy, HH:mm')
    },
    click_download_state_dict() {
      const state = this.$store.state;
      const text = JSON.stringify(state);
      const a = document.createElement('a');
      const blob = new Blob([text], {type: 'txt'});
      const url = URL.createObjectURL(blob);
      const timestamp = format(new Date(), 'yyyy-MMM-dd');
      a.setAttribute('href', url);
      a.setAttribute('download', `ml_state_dict_${timestamp}.json`);
      a.click();
    },
    click_upload_state_dict(file) {
      this.q$.dialog({
        title: 'Are you sure to overwrite the state?',
        cancel: true
      }).onOk(() => {
        const reader = new FileReader()
        reader.onload = () => {
          const data = JSON.parse(reader.result)
          this.$store.replaceState(data);
        }
        reader.readAsText(file)
      })
    },
    markdown(text) {
      if (text) {
        return marked.parse(text, { gfm: true });
      } else {
        return '';
      }
    }
  }
}
</script>

<style lang='scss' scoped>
tbody tr td {
  padding: 4px;
}
thead tr th {
  padding: 8px;
}

</style>
