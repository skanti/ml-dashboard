<template>
  <div :id='"plot_" + metric'/>
</template>

<script>

import Plotly from 'plotly.js-dist'
//import lodash from 'lodash';

export default {
  name: 'Chart',
  props: [ 'metric', 'data', 'settings' ],
  mounted: function() {
    this.init();
  },
  methods: {
    init() {
      const legend_bottomright = this.metric.includes('accuracy');
      const layout = this.make_layout(this.metric, '', legend_bottomright);

      const val_visible = this.settings.curve_visibility.includes('show_val');
      const train_visible = this.settings.curve_visibility.includes('show_train');

      let plots = [];
      for (const experiment of this.data) {
        const experiment_id = experiment.experiment_id;

        const data_val = {
          x: experiment.val.x,
          y: experiment.val.y,
          marker: {
            color: experiment.color
          },
          name: experiment_id,
          visible: val_visible,
          showlegend: true,
          mode: 'lines'
        };
        const data_train = {
          x: experiment.train.x,
          y: experiment.train.y,
          marker: {
            color: experiment.color
          },
          name: experiment_id + ' (train)',
          visible: train_visible,
          showlegend: !val_visible && train_visible,
          mode: 'lines' + (this.settings.show_markers ? '+markers' : ''),
          line: { dash: 'dash', 'shape': 'spline' },
        };
        plots.push(data_val);
        plots.push(data_train);
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
      Plotly.newPlot('plot_' + this.metric, plots, layout, { displayModeBar: false, responsive: true });
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
        pad : 0,
        xaxis: {
          title: 'Iteration',
          showgrid: true,
          zeroline: false,
          rangemode: 'tozero',
        },
        yaxis: {
          type: this.settings.log_scale ? 'log' : null,
          title: yaxis_label,
          showline: false,
          showgrid: true,
          zeroline: false,
          rangemode: 'tozero',
        },
        showlegend : true,
        legend : { ...legend_pos, orientation : 'v', font : {size : 10},
          bgcolor: 'rgba(255, 255, 255, 0.5)'},
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
