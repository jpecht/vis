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
    <div class="btn-group">
      <button
        v-for="loc in locations"
        :key="loc"
        :class="['btn', 'btn-default', { active: location === loc }]"
        @click="changeLocation(loc)"
      >
        {{ getLocationLabel(loc) }}
      </button>
    </div>
    <svg
      v-for="chartRef in chartRefs"
      :height="chart.height + chart.margin.top + chart.margin.bottom"
      :width="chart.width + chart.margin.left + chart.margin.right"
      :ref="chartRef"
    >
      <g :transform="`translate(${chart.margin.left}, ${chart.margin.top})`">
        <g class="grid" />
        <g class="xAxis" />
        <g class="yAxis" />
        <g class="highOverlay" />
        <g class="avgOverlay" />
        <g class="lowOverlay" />
        <g class="tempBars" />
      </g>
    </svg>
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
    chart: {
      height,
      margin,
      width,
    },
    chartRefs: [
      'winterChart',
      'summerChart',
    ],
    info: visualizations.find(v => v.url === 'weather'),
    location: locations.boulder,
    locations,
    weather: null,
    weatherRecords: null,
  }),

  computed: {
    stationId() {
      if (this.location === locations.boulder) return 'USC00050848';
      if (this.location === locations.dc) return 'USC00186350';
      return '';
    },
  },

  async mounted() {
    [this.weather, this.weatherRecords] = await Promise.all([
      d3.csv('/data/weather.csv'),
      d3.tsv('/data/weather_records.tsv'),
    ]);

    this.updateCharts();
  },

  methods: {
    changeLocation(location) {
      this.location = location;
      this.updateCharts();
    },

    getLocationLabel(location) {
      if (location === locations.boulder) return 'Boulder, CO';
      if (location === locations.dc) return 'Washington, DC';
      return '';
    },

    getWeatherData(dates) {
      return this.weather.filter((d) => {
        d.parsedDate = dateParse(d.DATE);
        return d.STATION === this.stationId && d.parsedDate > dates[0] && d.parsedDate < dates[1];
      });
    },

    getWeatherRecordData(dates) {
      return this.weatherRecords.filter((d) => {
        let inTimeRange = false;
        [2018, 2019].forEach((year) => {
          const date = new Date(year, d.Month - 1, d.Day);
          if (date > dates[0] && date < dates[1]) {
            inTimeRange = true;
            d.parsedDate = date;
          }
        });
        return d.Location === this.location && inTimeRange;
      });
    },

    updateChart(chartElement, { tempRange, timeRange }) {
      const weatherData = this.getWeatherData(timeRange);
      const weatherRecordsData = this.getWeatherRecordData(timeRange);

      const chart = d3.selectAll(chartElement).select('g');

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
      chart.select('.grid').selectAll('line')
        .data(gridLineData)
        .join('line')
          .transition()
          .attr('x2', width)
          .attr('y1', d => y(d))
          .attr('y2', d => y(d))
          .style('stroke', 'rgba(150, 150, 150, 0.5)')
          .style('stroke-width', d => (d === 0) ? 2 : 1);

      // Draw axes
      chart.select('.xAxis')
        .attr('transform', `translate(0, ${height})`)
        .call(xAxis);
      chart.select('.yAxis').call(yAxis);

      // Draw max-avg-min shading
      const highOverlay = chart.select('.highOverlay').selectAll('rect')
        .data(weatherRecordsData)
        .join('rect')
          .transition()
          .attr('x', d => x(d.parsedDate))
          .attr('y', d => y(d.DailyRecordMax))
          .attr('width', d => x(d.parsedDate) - x(d.parsedDate - ONE_DAY))
          .attr('height', d => y(d.NormalDailyMax) - y(d.DailyRecordMax))
          .attr('fill', 'rgba(255, 152, 150, 0.5)');
      const avgOverlay = chart.select('.avgOverlay').selectAll('rect')
        .data(weatherRecordsData)
        .join('rect')
          .transition()
          .attr('x', d => x(d.parsedDate))
          .attr('y', d => y(d.NormalDailyMax))
          .attr('width', d => x(d.parsedDate) - x(d.parsedDate - ONE_DAY))
          .attr('height', d => y(d.DailyRecordMin) - y(d.NormalDailyMax))
          .attr('fill', 'rgba(150, 150, 150, 0.4)');
      const lowOverlay = chart.select('.lowOverlay').selectAll('rect')
        .data(weatherRecordsData)
        .join('rect')
          .transition()
          .attr('x', d => x(d.parsedDate))
          .attr('y', d => y(d.NormalDailyMin))
          .attr('width', d => x(d.parsedDate) - x(d.parsedDate - ONE_DAY))
          .attr('height', d => y(d.DailyRecordMin) - y(d.NormalDailyMin))
          .attr('fill', 'rgba(174, 199, 232, 0.5)');

      // Draw temperature bars
      const tempBars = chart.select('.tempBars').selectAll('rect')
        .data(weatherData)
        .join('rect')
          .transition()
          .attr('x', d => x(d.parsedDate))
          .attr('y', d => y(d.TMAX))
          .attr('width', d => x(d.parsedDate) - x(d.parsedDate - ONE_DAY))
          .attr('height', d => y(d.TMIN) - y(d.TMAX))
          .attr('fill', 'rgb(80, 80, 80)');
    },

    updateCharts() {
      this.updateChart(this.$refs.winterChart, {
        tempRange: [-30, 100],
        timeRange: winterDates,
      });
      this.updateChart(this.$refs.summerChart, {
        tempRange: [0, 110],
        timeRange: summerDates,
      });
    },
  },
};
</script>

<style scoped lang="scss">
.weatherPost {
  max-width: 900px;
}

.btn-group { margin-bottom: 20px; }
</style>
