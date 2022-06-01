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
      const layout = this.make_layout(this.metric, '');

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
      }
      Plotly.newPlot('plot_' + this.metric, plots, layout, { displayModeBar: false, responsive: true });
    },
    make_layout: function(title, yaxis_label) {
      let layout = {
        margin: { l: 30, t: 30.0, r : 5, b: 30 },
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
          title: yaxis_label,
          showline: false,
          showgrid: true,
          zeroline: false,
          rangemode: 'tozero',
        },
        showlegend : true,
        legend : { x : 0, y : 1, orientation : 'v', font : {size : 10},
          bgcolor: 'rgba(255, 255, 255, 0.5)'},
      }

      return layout;
    }
  }
}
</script>

<style scoped lang='scss'>

</style>
