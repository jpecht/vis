<template>
  <Post v-bind="info">
    <div class="chart-container">
      <svg ref="chart"></svg>
    </div>
  </Post>
</template>

<script>
import Post from '@/components/Post.vue';
import visualizations from '@/constants/VisualizationsList';
import * as d3 from 'd3';

export default {
  name: 'Bpm3',
  components: {
    Post,
  },
  data: () => ({
    info: visualizations.find(v => v.url === 'bpm-3'),
  }),
  mounted() {
    this.createVis();
  },
  methods: {
    async createVis() {
      const margin = { top: 5, right: 10, bottom: 60, left: 45 };
      const width = 550 - margin.left - margin.right;
      const height = 280 - margin.top - margin.bottom;

      const chart = d3.select(this.$refs.chart)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
          .attr('transform', `translate(${margin.left}, ${margin.top})`);

      const x = d3.scaleTime()
        .range([0, width]);
      const y = d3.scaleLinear()
        .domain([87.5, 175])
        .range([height, 0]);


      const rawData = await d3.tsv('/data/music_collection_070917.tsv');

      // filter out songs without bpm
      const data = rawData.filter(d => !isNaN(d.BPM))
      data.forEach(d => d.importDate = new Date(d['Import Date']));
      data.sort((a, b) => a.importDate - b.importDate);

      // set time scale
      x.domain([d3.min(data, d => d.importDate), new Date(2017, 7, 1)]);

      // add the axes
      const xAxis = d3.axisBottom()
        .scale(x);
      const yAxis = d3.axisLeft()
        .scale(y);
      chart.append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0, ${height})`)
        .call(xAxis);
      chart.append('g')
        .attr('class', 'y axis')
        .call(yAxis);

      // add the axes labels
      chart.append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', height + 35)
        .text('Date Added');
      chart.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -35)
        .text('BPM');

      // add the song dots
      const songs = chart.append('g').selectAll('.song')
        .data(data)
        .enter().append('circle')
          .attr('r', 1)
          .attr('cx', (d) => {
            const xVal = x(d.importDate);
            return (xVal < 1) ? 1 : xVal;
          })
          .attr('cy', d => y(d.BPM))
          .style('fill', 'steelblue')
          .style('opacity', 0);

      // add the slider bar
      const slider = chart.append('line')
        .attr('class', 'slider-bar')
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', '#555')
        .attr('stroke-width', 1);

      // move the slider bar and let songs appear
      const sliderTimeLength = 20000;
      slider.transition()
        .ease(d3.easeLinear)
        .duration(sliderTimeLength)
        .attrTween('x1', () => t => t * width)
        .attrTween('x2', () => t => t * width)
        .on('end', function() {
          d3.select(this).style('display', 'none');
        });
      songs
        .transition()
          .duration(200)
          .style('opacity', 1)
          .delay(d => sliderTimeLength * x(d.importDate) / width)
        .transition()
          .duration(5000)
          .styleTween('fill', () => {
            return d3.interpolateRgb('steelblue', '#777');
          });
    },
  },
};
</script>

<style>
.chart-container { text-align: center; }
.tick text {
  font-size: 0.95em;
}

.axis-label {
  text-anchor: middle;
  font-size: 0.8em;
}
</style>
