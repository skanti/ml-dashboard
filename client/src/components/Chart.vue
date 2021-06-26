<template>
  <div :id="'plot_' + metric"/>
</template>

<script>

import Plotly from 'plotly.js-dist'

export default {
  name: 'Chart',
  props: [ "metric", "data" ],
  mounted: function() {
    this.init();
  },
  methods: {
    init: function() {
      const layout = this.make_layout(this.metric, "");
      const experiment = this.data;

      let plots = [];
      for (const experiment of this.data) {
        const experiment_id = experiment["experiment_id"];
        const visible = experiment["visible"];
        let data_val = {
          x: experiment["val"]["x"],
          y: experiment["val"]["y"],
          marker: {
            color: experiment["color"]
          },
          name: experiment_id,
          visible: visible,
          showlegend: true,
          mode: 'lines'
        };
        let data_train = {
          x: experiment["train"]["x"],
          y: experiment["train"]["y"],
          marker: {
            color: experiment["color"]
          },
          name: experiment_id + " (train)",
          showlegend: !visible,
          mode: 'lines',
          line: { dash: 'dash', 'shape': 'spline' },
        };
        plots.push(data_val);
        plots.push(data_train);
      };
      Plotly.newPlot("plot_" + this.metric, plots, layout, { displayModeBar: false, responsive: true })
    },
    make_layout: function(title, yaxis_label) {
      let layout = {
        margin: { l: 30, t: 30.0, r : 5, b: 30 },
        title : title,
        titlefont : {size : 16},
        pad : 0,
        xaxis: {
          title: "Iteration",
          showgrid: true,
          zeroline: false,
          rangemode: "tozero",
        },
        yaxis: {
          title: yaxis_label,
          showline: false,
          showgrid: true,
          zeroline: false,
          rangemode: "tozero",
        },
        showlegend : true,
        legend : { x : 0, y : 1, orientation : "v", font : {size : 10}},
      }

      return layout;
    }
  }
}
</script>

<style scoped lang="scss">

</style>
