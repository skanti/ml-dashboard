<template>
  <div :id="'plot_' + id">
  </div>
</template>

<script>

import Plotly from 'plotly.js-dist'

export default {
  name: 'Chart',
  props: [ "id", "data" ],
  mounted: function() {
    this.init();
  },
  methods: {
    init: function() {
      const layout = this.make_layout(this.id, "");
      const experiment = this.data;

      let plots = [];
      let metric = experiment["name"];
      let data_val = {
        x: experiment["val"]["x"],
        y: experiment["val"]["y"],
        marker: {
          color: experiment["color"]
        },
        name: metric,
        showlegend: true,
        mode: 'lines'
      };
      let data_train = {
        x: experiment["train"]["x"],
        y: experiment["train"]["y"],
        marker: {
          color: experiment["color"]
        },
        name: metric,
        showlegend: false,
        mode: 'lines',
        line: { dash: 'dash' }
      };
      plots.push(data_val);
      plots.push(data_train);
      Plotly.newPlot("plot_" + this.id, plots, layout, { displayModeBar: false })
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
