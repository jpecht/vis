<template>
  <Post v-bind="info">
    <template v-slot:description>
      <p>
        So now that I've had 2 years worth of new music since I've last done this (mostly been EDM),
        I wanted to re-analyze my music collection.
        This time though, I shrunk the BPM range to 78-155 instead of the previous 58-200.
        This makes more sense and songs outside the range are doubled/halved as appropriate.
      </p>
      <p>
        I'm also collating the data beforehand instead of making you load the entire 11mb of xml. :)
      </p>
    </template>
    <div class="bpm-2-chart-container">
      <svg ref="chart"></svg>
      <div class="source-wrapper">
        <div class="source">* curve being drawn is a b-spline</div>
      </div>
      <div class="button-container">
        <div class="year-btn-group btn-group">
          <div class="2014-button btn btn-default">Nov 2014</div>
          <div class="2016-button btn btn-default">Sep 2016</div>
          <div class="diff-button btn btn-default">Additions</div>
        </div>
      </div>
    </div>
    <template v-slot:post-description>
      <p>
        As expected, there are giant peaks for the most common EDM bpms.
        And since almost all of the new songs I've downloaded over the past couple years has been EDM, the peaks are even peak-ier.
        It looks like I've added the most in 150 (trap), 140 (dubstep), 80 (trap?), 128 (house), and 100 ("twerk"/moombahton).
      </p>
      <p>
        Also, the difference between the number of songs I have in 128bpm and 129bpm is huge haha. 128 really is the magic number.
      </p>  
    </template>
  </Post>
</template>

<script>
import Post from '@/components/Post.vue';
import $ from 'jquery';
import visualizations from '@/constants/VisualizationsList';
import * as d3 from 'd3';

export default {
  name: 'Bpm',
  components: {
    Post,
  },
  data: () => ({
    info: visualizations.find(v => v.url === 'bpm-2'),
  }),
  mounted() {
    this.createVis();
  },
  methods: {
    async createVis() {
      const margin = { top: 20, right: 20, bottom: 40, left: 50 };

      const width = 550 - margin.left - margin.right;
      const height = 240 - margin.top - margin.bottom;

      d3.select('.source').style('width', (width + margin.left + margin.right) + 'px');

      const chart = d3.select(this.$refs.chart)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
          .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

      const x = d3.scaleLinear().domain([77, 156]).range([0, width]);
      const y = d3.scaleLinear().range([height, 0]);

      const xAxis = d3.axisBottom().scale(x);
      const yAxis = d3.axisLeft();

      const x_axis_g = chart.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);
      const y_axis_g = chart.append('g')
        .attr('class', 'y axis');

      const x_label = chart.append('text')
        .attr('class', 'label x-label')
        .attr('x', width / 2)
        .attr('y', height + margin.top + 15)
        .html('bpm');
      const y_label = chart.append('text')
        .attr('class', 'label y-label')
        .attr('x', -height / 2)
        .attr('y', -40)
        .attr('transform', 'rotate(-90)')
        .html('frequency');

      const curve = d3.line()
        .x(d => x(d.bpm))
        .y(d => y(d.frequency))
        .curve(d3.curveCardinal);


      const [oldData, data] = await Promise.all([
        d3.tsv('./data/bpm_frequency.tsv'),
        d3.tsv('./data/bpm_frequency_091416.tsv'),
      ]);

      // collate diff data
      const diffData = [];
      for (let i = 0; i < data.length; i++) {
        let freqDiff = data[i].frequency - oldData[i].frequency;
        if (freqDiff < 0) freqDiff = 0;
        diffData.push({
          bpm: data[i].bpm,
          frequency: freqDiff,
        });
      }

      // add the lines and the curve
      const dataLines = chart.selectAll('.data-line')
        .data(data)
        .enter().append('line')
          .attr('class', 'data-line')
          .style('stroke-width', 2);
      const dataCurve = chart.append('path')
        .attr('class', 'curve');

      // functions for showing the various data
      const show2014Data = () => {
        useFrequencyRange();
        dataLines
          .data(oldData)
          .transition()
          .attr('x1', function(d) { return x(d.bpm); })
          .attr('x2', function(d) { return x(d.bpm); })
          .attr('y1', function(d) { return y(d.frequency); })
          .attr('y2', y(0))
          .style('fill', 'steelblue');
        dataCurve.transition()
          .style('stroke', 'rgba(119,119,119,1)')
          .attr('d', curve(oldData));
      };
      const show2016Data = () => {
        useFrequencyRange();
        dataLines
          .data(data)
          .transition()
          .attr('x1', function(d) { return x(d.bpm); })
          .attr('x2', function(d) { return x(d.bpm); })
          .attr('y1', function(d) { return y(d.frequency); })
          .attr('y2', y(0))
          .style('fill', 'steelblue');
        dataCurve.transition()
          .style('stroke', 'rgba(119,119,119,1)')
          .attr('d', curve(data));
      };
      const showDiffData = () => {
        usePercentageRange();
        dataLines
          .data(diffData)
          .transition()
          .attr('x1', function(d) { return x(d.bpm); })
          .attr('x2', function(d) { return x(d.bpm); })
          .attr('y1', function(d) { return y(d.frequency); })
          .attr('y2', y(0))
          .style('fill', '#ff7f0e');
        dataCurve.transition().style('stroke', 'rgba(119,119,119,0)');
      };

      // adjusting the range
      const useFrequencyRange = () => {
        y.domain([0, 700]);
        yAxis
          .scale(y)
          .tickFormat(d3.format(','));
        y_axis_g.call(yAxis);
      };
      const usePercentageRange = () => {
        y.domain([0, 160]);
        yAxis
          .scale(y)
          .tickFormat(d3.format('+'));
        y_axis_g.call(yAxis);
      };

      // clicking the buttons shows the corresponding data
      $('.year-btn-group .btn').click(function() {
        $(this).addClass('active')
          .siblings().removeClass('active');
      });
      $('.2014-button').click(function() { show2014Data(); });
      $('.2016-button').click(function() { show2016Data(); });
      $('.diff-button').click(function() { showDiffData(); });

      // start by showing the 2016 data
      $('.2016-button').addClass('active');
      show2016Data();
    },
  },
};
</script>

<style lang="scss">
@import '~@/styles/legacy/bootstrap-partial.css';

.bpm-2-chart-container {
  .button-container {
    text-align: center;
  }
  
  .label {
    text-anchor: middle;
    text-align: center;
    font-size: 11px;
    font-weight: 300;
  }
  .axis path,
  .axis line {
    fill: none;
    stroke: black;
    shape-rendering: crispEdges;
  }
  .axis text {
    font-size: 10px;
  }
  .data-line {
    stroke: steelblue;
  }
  .curve {
    fill: none;
    stroke: #777;
    stroke-width: 2px;
  }
  .source-wrapper { text-align: center; }
  .source {
    display: inline-block;
    margin: 5px 0 25px;
  }
}
</style>
