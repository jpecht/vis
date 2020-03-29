<template>
  <Post v-bind="info">
    <template v-slot:description>
      <p>
        The graph below shows the income level "cut-offs" in the United States.
        After adjusting for inflation, it's interesting to see the steady increase in the top 5%.
      </p>
      <p>
        <b>Note:</b>
        <i>
          This chart was broken in its port to Vue.
          It was made in 2014 and relied on Chart.js v1.0.1, which is not compatible with Vue.
        </i>
      </p>
    </template>
    <div class="income-chart-wrapper">
      <canvas id="income-chart"></canvas>
      <div id="income-legend" class="legend circle-legend">
        <svg height="14" width="14"><circle cx="7" cy="7" r="5" stroke-width="0" fill="rgb(141,188,214)"/></svg><span> - top 5%-20%</span>
        <svg height="14" width="14"><circle cx="7" cy="7" r="5" stroke-width="0" fill="rgb(148,232,148)"/></svg><span> - top middle 20%</span>
        <svg height="14" width="14"><circle cx="7" cy="7" r="5" stroke-width="0" fill="rgb(255,247,135)"/></svg><span> - middle 20%</span>
        <svg height="14" width="14"><circle cx="7" cy="7" r="5" stroke-width="0" fill="rgb(255,216,163)"/></svg><span> - bottom-middle 20%</span>
        <svg height="14" width="14"><circle cx="7" cy="7" r="5" stroke-width="0" fill="rgb(251,161,170)"/></svg><span> - bottom 20%</span>
      </div>
      <div id="income-source" class="source">Source: U.S. Census Bureau</div>
      <!-- <button id="inflation-button" type="button" class="btn btn-default">Adjust for Inflation</button> -->
    </div>
  </Post>
</template>

<script>
// import Chart from 'chart.js';
import Post from '@/components/Post.vue';
// import $ from 'jquery';
import * as d3 from 'd3';
import visualizations from '@/constants/VisualizationsList';

export default {
  name: 'IncomeThresholds',
  components: {
    Post,
  },
  data: () => ({
    info: visualizations.find(v => v.url === 'income'),
  }),
  mounted() {
    this.createVis();
  },
  methods: {
    async createVis() {
      Chart.defaults.global.showTooltips = false;
      Chart.defaults.global.scaleLabel = '$<%=value%>';
      Chart.defaults.global.responsive = true;
      
      var chart_width = ($(window).width() < 600) ? $(window).width() - 60 : 600,
        chart_height = 400;
        
      $('#income-chart')
        .attr('width', chart_width)
        .attr('height', chart_height);
      
      const unf_data = await d3.tsv('./data/income_threshold.tsv');
      var data_coll = {labels: [], datasets: []};
      
      // initialize datasets
      for (var i = 1; i <= 5; i++) {
        var dataset = {
          label: 'Income Thresholds ' + i,
          data: []
        };
        if (i === 5) {
          dataset.fillColor = 'rgba(251,161,170, 0.5)';
          dataset.strokeColor = 'rgba(228,111,122,1)';
        } else if (i === 4) {
          dataset.fillColor = 'rgba(255,216,163, 0.5)';
          dataset.strokeColor = 'rgba(236,185,115,1)';
        } else if (i === 3) {
          dataset.fillColor = 'rgba(255,247,135, 0.5)';
          dataset.strokeColor = 'rgba(203,200,82,1)';
        } else if (i === 2) {
          dataset.fillColor = 'rgba(148,232,148, 0.5)';
          dataset.strokeColor = 'rgba(92,189,92,1)';
        } else if (i === 1) {
          dataset.fillColor = 'rgba(141,188,214, 0.5)';
          dataset.strokeColor = 'rgba(77,124,150,1)';
        }
          
        data_coll.datasets.push(dataset);
      }
        
      for (var i = 0; i < unf_data.length; i++) {
        var year = +unf_data[i].Year;
        (year % 5 === 0) ? data_coll.labels.push(year) : data_coll.labels.push('');
          
        data_coll.datasets[0].data.push(+unf_data[i]['Lower Limit 5']);
        data_coll.datasets[1].data.push(+unf_data[i]['Upper Limit 4']);
        data_coll.datasets[2].data.push(+unf_data[i]['Upper Limit 3']);
        data_coll.datasets[3].data.push(+unf_data[i]['Upper Limit 2']);
        data_coll.datasets[4].data.push(+unf_data[i]['Upper Limit 1']);
      }
      
      // adjust income
      var adjustIncome = function(adjustBool) {
        for (var i = 0; i < data_coll.labels.length; i++) {
          for (var j = 0; j < data_coll.datasets.length; j++) {
            if (adjustBool) incomeChart.datasets[j].points[i].value *= unf_data[i].Inflation;
            else incomeChart.datasets[j].points[i].value /= unf_data[i].Inflation;
          }
        }
      };
      
      $('#inflation-button').click(function() {
        this.blur();
        $(this).toggleClass('active');
        adjustIncome($(this).hasClass('active'));
        incomeChart.update();
      });

      var ctx = document.getElementById('income-chart').getContext('2d');
      var incomeChart = new Chart(ctx, {
        type: 'line',
        data: data_coll,
        scaleGridLineColor: 'rgba(0,0,0,0.05)',
        pointDot: false
      });
    },
  },
};
</script>

<style lang="scss">
@import '~@/styles/legacy/bootstrap-partial.css';

.income-chart-wrapper {
  #inflation-button {
    position: absolute;
    top: 110px;
    left: 95px;
  }
  #income-source {
    margin-top: 20px;
  }
}
</style>
