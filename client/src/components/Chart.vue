<template>
  <div :id="'plot_' + id">
  </div>
</template>

<script>

import Plotly from 'plotly.js-dist'
import { colors } from 'quasar'

export default {
  name: 'Chart',
  props: [ "id", "data" ],
  mounted: function() {
    this.init();
  },
  methods: {
    init: function() {
      const layout = this.make_layout(this.id, "");

      let plots = [];
      for (let [id_experiment, v] of Object.entries(this.data)) {
        const c = colors.getBrand('primary')
        let data = {
          x: v["x"],
          y: v["y_val"],
          marker: {
            color: c
          },
          name: id_experiment,
          hoverinfo: 'none',
          type: 'line'
        };
        plots.push(data);
      }
      Plotly.newPlot("plot_" + this.id, plots, layout, { displayModeBar: false })
    },
    make_layout: function(title, yaxis_label) {
      let layout = {
        margin: { l: 20, t: 30.0, r : 20, b: 30 },
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
