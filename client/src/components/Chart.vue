<template>
  <div :id='"plot_" + metric'/>
</template>

<script>

import Plotly from 'plotly.js-dist'
import { format } from 'date-fns'
//import lodash from 'lodash';

export default {
  name: 'Chart',
  props: [ 'metric', 'data', 'settings' ],
  data() {
    return {
      print_timings: false,
    }
  },
  mounted() {
    this.init();
  },
  methods: {
    hex_to_rgba(hex, alpha) {
      const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!res) {
        return;
      }
      const r = parseInt(res[1], 16);
      const g = parseInt(res[2], 16);
      const b = parseInt(res[3], 16);
      return `rgba(${r},${g},${b},${alpha})`;
    },
    init() {
      const legend_bottomright = this.metric.includes('accuracy');
      const layout = this.make_layout(this.metric, '', legend_bottomright);

      const val_visible = this.settings.curve_visibility.includes('show_val');
      const train_visible = this.settings.curve_visibility.includes('show_train');

      let plots = [];
      for (const experiment of this.data) {
        const experiment_id = experiment.experiment_id;

        // show validation
        if (val_visible) {
          const data_val = {
            x: experiment.val.x,
            y: experiment.val.y,
            text: experiment.val.hint.map(x => format(x, 'yy-MMM-dd HH-mm-ss')),
            marker: {
              color: experiment.color,
              symbol: 'circle'
            },
            name: experiment_id,
            showlegend: true,
            mode: 'scattergl+lines' + (this.settings.show_markers ? '+markers' : ''),
            line: { color: this.hex_to_rgba(experiment.color, 1.0) },
          };
          plots.push(data_val);
        }
        if (train_visible) {
          const data_train = {
            x: experiment.train.x,
            y: experiment.train.y,
            text: experiment.train.hint.map(x => format(x, 'yy-MMM-dd HH-mm-ss')),
            marker: {
              color: experiment.color
            },
            name: experiment_id + ' (train)',
            showlegend: !val_visible && train_visible,
            mode: 'scattergl+lines', //'lines' + (this.settings.show_markers ? '+markers' : ''),
            line: { dash: 'dash', color: this.hex_to_rgba(experiment.color, 1.0), width: 1.0 },
          };
          const leading_dot = {
            x: [experiment.train.x.at(-1)],
            y: [experiment.train.y.at(-1)],
            text: [format(experiment.train.hint.at(-1) || new Date(), 'yy-MMM-dd HH-mm-ss')],
            marker: {
              color: this.hex_to_rgba(experiment.color, 1.0),
              symbol: 'circle'
            },
            showlegend: false,
            mode: 'scattergl',
          };
          plots.push(leading_dot);
          plots.push(data_train);
        }
        // plot error corridors
        if (experiment.train.error) {
          const upper = experiment.train.x.map((x,i) => experiment.train.y[i] + experiment.train.error[i]);
          const lower = experiment.train.x.map((x,i) => experiment.train.y[i] - experiment.train.error[i]);
          //const y_both = upper.concat(lower.reverse());
          //const x_both = experiment.train.x.concat(experiment.train.x.reverse());
          //console.log(y_both);
          
          const [r,g,b] = this.hex2rgb(experiment.color);
          const c = `rgba(${r}, ${g}, ${b}, 0.2)`;
          const data_error0 = {
            x: experiment.train.x,
            y: upper,
            fillcolor: c,
            line: { color: 'transparent', shape: 'spline' },
            visible: train_visible,
            showlegend: false,
            mode: 'scatter',
          };
          plots.push(data_error0);
          const data_error1 = {
            x: experiment.train.x,
            y: lower,
            fill: 'tonexty',
            fillcolor: c,
            line: { color: 'transparent', shape: 'spline' },
            visible: train_visible,
            showlegend: false,
            mode: 'scatter',
          };
          plots.push(data_error1);
        }
      }
      const t0 = new Date().getTime();
      Plotly.newPlot('plot_' + this.metric, plots, layout, { displayModeBar: false, responsive: true });
      const t1 = new Date().getTime();
      const duration = t1 - t0;
      if (this.print_timings) {
        console.log(`plot_duration=${duration}ms`)
      }
    },
    make_layout: function(title, yaxis_label, legend_bottomright) {
      let legend_pos = { x: 0, y: 1 };
      if (legend_bottomright) {
        legend_pos = { x: 0.1, y: 0.2 };
      }
      const layout = {
        margin: { l: 30, t: 30.0, r : 5, b: 30, autoexpand: false },
        title : title,
        titlefont : {size : 16},
        font: { color: "white" },
        pad : 0,
        xaxis: {
          title: 'Iteration',
          showgrid: true,
          gridcolor: "rgb(0.2, 0.2, 0.2)",
          zeroline: false,
          rangemode: 'tozero',
        },
        yaxis: {
          type: this.settings.log_scale ? 'log' : null,
          title: yaxis_label,
          showline: false,
          showgrid: true,
          gridcolor: "rgb(0.2, 0.2, 0.2)",
          zeroline: false,
          rangemode: 'tozero',
        },
        showlegend : true,
        legend : { ...legend_pos, orientation : 'v', font : {size : 10},
          bgcolor: 'rgba(255, 255, 255, 0.1)'
        },
        plot_bgcolor: "rgba(0, 0, 0, 0)",
        paper_bgcolor: "rgba(0, 0, 0, 1.0)",
      }

      return layout;
    },
    hex2rgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (result) {
        return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      } else {
        return null;
      }
    }
  }
}
</script>

<style scoped lang='scss'>

</style>
