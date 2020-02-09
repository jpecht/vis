<template>
  <Post v-bind="info">
    <template v-slot:description>
      <p>A quick look at the severity of the recent drought in California</p>
      <p>
        <span style="font-weight:600;">Note:</span>
        This chart was broken in its port to Vue.
        It was made in 2014 and relied on Chart.js v1.0.1, which is not compatible with Vue.
      </p>
    </template>
    <div class="drought-chart-wrapper">
      <canvas id="drought-chart"></canvas>
      <div id="drought-legend">
        <div id="drought-legend-text-1">abnormally dry</div>
        <div id="drought-legend-text-2">moderate drought</div>
        <div id="drought-legend-text-3">severe drought</div>
        <div id="drought-legend-text-4">extreme drought</div>
        <div id="drought-legend-text-5">exceptional drought</div>
      </div>
      <div id="drought-source" class="source">Source: National Drought Migration Center</div>
    </div>
  </Post>
</template>

<script>
import Chart from 'chart.js';
import Post from '@/components/Post.vue';
import $ from 'jquery';
import * as d3 from 'd3';
import visualizations from '@/constants/VisualizationsList';

export default {
  name: 'Drought',
  components: {
    Post,
  },
  data: () => ({
    info: visualizations.find(v => v.url === 'drought'),
  }),
  mounted() {
    this.createVis();
  },
  methods: {
    async createVis() {
      Chart.defaults.global.showTooltips = false;
      Chart.defaults.global.scaleLabel = '<%=value%>%';
      Chart.defaults.global.animation = false;
      Chart.defaults.global.responsive = true;

      var OrRd = ['rgb(254,240,217)','rgb(253,212,158)','rgb(253,187,132)','rgb(252,141,89)','rgb(227,74,51)','rgb(179,0,0)'];
      
      var chart_width = ($(window).width() < 600) ? $(window).width() - 60 : 600,
        chart_height = 200;
        
      $('#drought-chart')
        .attr('width', chart_width)
        .attr('height', chart_height);
      
      const unf_data = await d3.tsv('/data/cali_drought.tsv');

      // initialize datasets
      var data_coll = {labels: [], datasets: []};
      for (var i = 0; i <= 5; i++) {
        var dataset = {
          label: i,
          data: [],
          fillColor: OrRd[i]
        };
        
        data_coll.datasets.push(dataset);
      }
      
      // adding data
      var date_format = d3.timeFormat('%Y');
      var curr_year = -1;
      for (var i = 220; i < unf_data.length; i++) {
        var year = date_format(new Date(+unf_data[i].timestamp * 1000));
        (year === curr_year) ? data_coll.labels.push('') : data_coll.labels.push(year);
        curr_year = year;
        
        data_coll.datasets[0].data.push(100);
        for (var j = 0; j <= 4; j++) {
          data_coll.datasets[j+1].data.push(unf_data[i][j]);
        }
      }
      
      // drawing chart
      var ctx = document.getElementById('drought-chart').getContext('2d');
      var incomeChart = new Chart(ctx, {
        type: 'line',
        data: data_coll,
        scaleGridLineColor: 'rgba(0,0,0,0.05)',
        datasetStroke: false,
        pointDot: false
      });
    },
  },
};
</script>

<style lang="scss">
@import '~@/styles/legacy/bootstrap-partial.css';

.drought-chart-wrapper {
  #drought-legend {
    margin-bottom: 15px;  
  }

  div[id ^= "drought-legend-text-"] {
    text-align: center;
    color: white;
    width: 200px;
    display: inline;
    margin-right: -4px;
    padding: 2px 10px;
    font-size: 0.7em;
  }

  #drought-legend-text-1 { background-color: rgb(253,212,158); color: black; }
  #drought-legend-text-2 { background-color: rgb(253,187,132); color: black; }
  #drought-legend-text-3 { background-color: rgb(252,141,89); }
  #drought-legend-text-4 { background-color: rgb(227,74,51); }
  #drought-legend-text-5 { background-color: rgb(179,0,0); }
}
</style>
