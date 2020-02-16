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

// chart dimensions
const height = 300;
const width = 750;
const margin = {
  top: 10,
  right: 30,
  bottom: 30,
  left: 30,
};

// date constants
const winterDates = [new Date(2018, 10), new Date(2019, 4)];
const summerDates = [new Date(2019, 4), new Date(2019, 10)];
const dateParse = d3.timeParse('%m/%d/%Y');
const ONE_DAY = 24 * 3600 * 1000;

// other constants
const locations = {
  boulder: 'Boulder',
  dc: 'DC',
};

export default {
  name: 'TvShowViewership',
  components: {
    Post,
  },
  data: () => ({
    info: visualizations.find(v => v.url === 'weather'),
    location: locations.boulder,
  }),

  async mounted() {
    const [weather, weatherRecords] = await Promise.all([
      d3.csv('/data/weather.csv'),
      d3.tsv('/data/weather_records.tsv'),
    ]);

    const winterWeather = this.getWeatherData(weather, this.location, winterDates);
    const summerWeather = this.getWeatherData(weather, this.location, summerDates);
    const winterRecordData = this.getWeatherRecordData(weatherRecords, this.location, winterDates);
    const summerRecordData = this.getWeatherRecordData(weatherRecords, this.location, summerDates);

    this.createChart(this.$refs.winterChart, winterWeather, winterRecordData, {
      tempRange: [-30, 100],
      timeRange: winterDates,
    });
    this.createChart(this.$refs.summerChart, summerWeather, summerRecordData, {
      tempRange: [0, 110],
      timeRange: summerDates,
    });
  },

  methods: {
    getStationId(location) {
      if (location === locations.boulder) return 'USC00050848';
      if (location === locations.dc) return 'USC00186350';
      return '';
    },

    getWeatherData(data, location, dates) {
      const stationId = this.getStationId(location);
      return data.filter((d) => {
        d.parsedDate = dateParse(d.DATE);
        return d.STATION === stationId && d.parsedDate > dates[0] && d.parsedDate < dates[1];
      });
    },

    getWeatherRecordData(data, location, dates) {
      return data.filter((d) => {
        let inTimeRange = false;
        [2018, 2019].forEach((year) => {
          const date = new Date(year, d.Month - 1, d.Day);
          if (date > dates[0] && date < dates[1]) {
            inTimeRange = true;
            d.parsedDate = date;
          }
        });
        return d.Location === location && inTimeRange;
      });
    },

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
      for (let i = tempRange[0] + 10; i <= tempRange[1]; i += 10) {
        gridLineData.push(i);
      }
      chart.append('g').selectAll('line')
        .data(gridLineData)
        .join('line')
          .attr('x2', width)
          .attr('y1', d => y(d))
          .attr('y2', d => y(d))
          .style('stroke', 'rgba(150, 150, 150, 0.5)')
          .style('stroke-width', d => (d === 0) ? 3 : 1);

      // Draw axes
      chart.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(xAxis);
      chart.append('g').call(yAxis);

      // Draw max-avg-min shading
      const highOverlay = chart.append('g').selectAll('rect')
        .data(weatherRecordsData)
        .join('rect')
          .attr('x', d => x(d.parsedDate))
          .attr('y', d => y(d.DailyRecordMax))
          .attr('width', d => x(d.parsedDate) - x(d.parsedDate - ONE_DAY))
          .attr('height', d => y(d.NormalDailyMax) - y(d.DailyRecordMax))
          .attr('fill', 'rgba(255, 152, 150, 0.5)');
      const avgOverlay = chart.append('g').selectAll('rect')
        .data(weatherRecordsData)
        .join('rect')
          .attr('x', d => x(d.parsedDate))
          .attr('y', d => y(d.NormalDailyMax))
          .attr('width', d => x(d.parsedDate) - x(d.parsedDate - ONE_DAY))
          .attr('height', d => y(d.DailyRecordMin) - y(d.NormalDailyMax))
          .attr('fill', 'rgba(150, 150, 150, 0.4)');
      const lowOverlay = chart.append('g').selectAll('rect')
        .data(weatherRecordsData)
        .join('rect')
          .attr('x', d => x(d.parsedDate))
          .attr('y', d => y(d.NormalDailyMin))
          .attr('width', d => x(d.parsedDate) - x(d.parsedDate - ONE_DAY))
          .attr('height', d => y(d.DailyRecordMin) - y(d.NormalDailyMin))
          .attr('fill', 'rgba(174, 199, 232, 0.5)');

      // Draw temperature bars
      const tempBars = chart.append('g').selectAll('rect')
        .data(weatherData)
        .join('rect')
          .attr('x', d => x(d.parsedDate))
          .attr('y', d => y(d.TMAX))
          .attr('width', d => x(d.parsedDate) - x(d.parsedDate - ONE_DAY))
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
