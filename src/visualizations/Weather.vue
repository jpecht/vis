<template>
  <Post :wide="true" v-bind="info">
    <template v-slot:description>
      <p>
        I was inspired by a chart I saw in **DATA_VIS_BOOK** that the New York Times published
        in 2010. It was interesting to me how much data was able to presented in one chart
        without being overwhelming. I decided to try to make my own version of it using weather
        in Boulder, CO.
      </p>
    </template>
    <svg ref="winterChart" />
    <svg ref="summerChart" />
  </Post>
</template>

<script>
import * as d3 from 'd3';
import Post from '@/components/Post.vue';
import visualizations from '@/constants/VisualizationsList';

const height = 400;
const width = 750;
const margin = {
  top: 10,
  right: 30,
  bottom: 30,
  left: 30,
};
const rectWidth = 2;

const dateParse = d3.timeParse('%Y-%m-%d');
const ONE_DAY = 24 * 3600 * 1000;

export default {
  name: 'TvShowViewership',
  components: {
    Post,
  },
  data: () => ({
    info: visualizations.find(v => v.url === 'weather'),
  }),

  async mounted() {
    const [weather, boulderWeatherRecords] = await Promise.all([
      d3.csv('/data/weather_2019.csv'),
      d3.csv('/data/boulder_weather_records_2019.csv'),
    ]);

    const boulderWeather = weather.filter(d => d.STATION === 'USC00050848');
    // const dcWeather = weather.filter(d => d.STATION === 'USC00186350');
    // const denverWeather = weather.filter(d => d.STATION === 'USW00023062');

    const winterWeather = boulderWeather.filter((d) => {
      // Data before Apr 1, 2019
      return dateParse(d.DATE) < new Date(2019, 3, 1);
    });
    const winterWeatherRecords = boulderWeatherRecords.filter((d) => {
      return d.Month < 4;
    });

    const summerWeather = boulderWeather.filter((d) => {
      const date = dateParse(d.DATE);
      return date > new Date(2019, 3) && date < new Date(2019, 9);
    });
    const summerWeatherRecords = boulderWeatherRecords.filter((d) => {
      return d.Month > 3 && d.Month < 10;
    });

    this.createChart(this.$refs.winterChart, winterWeather, winterWeatherRecords, {
      tempRange: [-30, 100],
      timeRange: [new Date(2019, 0), new Date(2019, 3)],
    });
    this.createChart(this.$refs.summerChart, summerWeather, summerWeatherRecords, {
      tempRange: [0, 110],
      timeRange: [new Date(2019, 3), new Date(2019, 9)],
    });
  },

  methods: {
    createChart(chartElement, weatherData, weatherRecordsData, { tempRange, timeRange }) {
      const chart = d3.select(chartElement)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
          .attr('transform', `translate(${margin.left}, ${margin.top})`);

      const x = d3.scaleTime()
        .domain(timeRange)
        .range([0, width]);
      const y = d3.scaleLinear()
        .domain(tempRange)
        .range([height, 0]);

      const xAxis = d3.axisBottom().scale(x);
      const yAxis = d3.axisLeft().scale(y);

      // Draw grid lines
      const gridLineData = [];
      for (let i = -20; i <= 110; i += 10) {
        gridLineData.push(i);
      }
      chart.append('g').selectAll('line')
        .data(gridLineData)
        .join('line')
          .attr('x2', width)
          .attr('y1', d => y(d))
          .attr('y2', d => y(d))
          .style('stroke', 'rgba(150, 150, 150, 0.5)')

      // Draw axes
      chart.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(xAxis);
      chart.append('g').call(yAxis);

      // Draw max-avg-min shading
      const highOverlay = chart.append('g').selectAll('rect')
        .data(weatherRecordsData)
        .join('rect')
          .attr('x', d => x(new Date(2019, d.Month - 1, d.Day)))
          .attr('y', d => y(d.HighMax))
          .attr('width', d => x(new Date(2019, d.Month - 1, d.Day)) - x(new Date(2019, d.Month - 1, d.Day - 1)))
          .attr('height', d => y(d.AvgTMax) - y(d.HighMax))
          .attr('fill', 'rgba(255, 152, 150, 0.5)');
      const avgOverlay = chart.append('g').selectAll('rect')
        .data(weatherRecordsData)
        .join('rect')
          .attr('x', d => x(new Date(2019, d.Month - 1, d.Day)))
          .attr('y', d => y(d.AvgTMax))
          .attr('width', d => x(new Date(2019, d.Month - 1, d.Day)) - x(new Date(2019, d.Month - 1, d.Day - 1)))
          .attr('height', d => y(d.AvgTMin) - y(d.AvgTMax))
          .attr('fill', 'rgba(150, 150, 150, 0.4)');
      const lowOverlay = chart.append('g').selectAll('rect')
        .data(weatherRecordsData)
        .join('rect')
          .attr('x', d => x(new Date(2019, d.Month - 1, d.Day)))
          .attr('y', d => y(d.AvgTMin))
          .attr('width', d => x(new Date(2019, d.Month - 1, d.Day)) - x(new Date(2019, d.Month - 1, d.Day - 1)))
          .attr('height', d => y(d.LowMin) - y(d.AvgTMin))
          .attr('fill', 'rgba(174, 199, 232, 0.5)');

      // Draw temperature bars
      const tempBars = chart.append('g').selectAll('rect')
        .data(weatherData)
        .join('rect')
          .attr('x', d => x(dateParse(d.DATE)))
          .attr('y', d => y(d.TMAX))
          .attr('width', d => x(dateParse(d.DATE)) - x(dateParse(d.DATE) - ONE_DAY))
          .attr('height', d => y(d.TMIN) - y(d.TMAX))
          .attr('fill', 'rgb(80, 80, 80)');
    },
  },
};
</script>

<style scoped lang="scss">
.weatherPost {
  max-width: 900px;
}
</style>
