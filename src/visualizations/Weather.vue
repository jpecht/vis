<template>
  <Post :wide="true" v-bind="info">
    <template v-slot:description>
      <p>
        I was inspired by a weather chart I saw that the New York Times published
        in 2010. It was interesting to me how much data was able to be presented in one chart
        without being overwhelming. I decided to try to make my own dynamic version using weather
        data from the two places I've lived: Boulder, CO and Washington, DC.
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
    <div
      class="chartContainer"
      v-for="(chartRef, index) in chartRefs"
      :key="index"
    >
      <h4 class="chartTitle">
        {{ chartTitleByRef[chartRef] }} in {{ location }}
      </h4>
      <svg
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
          <g class="precipXAxis" />
          <g class="precipYAxis" />
          <g class="precipBars" />
        </g>
      </svg>
    </div>
    <div class="legendContainer tempLegendContainer">
      <svg height="120" width="150">
        <g transform="translate(55, 10)">
          <rect width="7" y="0" height="30" :fill="colors.recordHigh" />
          <rect width="7" y="30" height="40" :fill="colors.normal" />
          <rect width="7" y="70" height="30" :fill="colors.recordLow" />
          <rect width="7" y="40" height="20" :fill="colors.actual" />
          <text x="30" y="5">Record High</text>
          <line x1="10" x2="25" y1="1" y2="1" />
          <text x="30" y="35">Normal High</text>
          <line x1="10" x2="25" y1="31" y2="31" />
          <text x="30" y="74">Normal Low</text>
          <line x1="10" x2="25" y1="70" y2="70" />
          <text x="30" y="104">Record Low</text>
          <line x1="10" x2="25" y1="100" y2="100" />
          <text x="-23" y="54" text-anchor="end">Actual</text>
          <line x1="-18" x2="-3" y1="41" y2="41" />
          <line x1="-18" x2="-3" y1="60" y2="60" />
          <line x1="-18" x2="-18" y1="41" y2="60" />          
        </g>
      </svg>
    </div>
    <div class="legendContainer precipLegendContainer">
      <svg height="55" width="65">
        <g transform="translate(5, 5)">
          <rect width="7" y="0" height="20" :fill="colors.rain" />
          <rect width="7" y="20" height="30" :fill="colors.snow" />
          <text x="30" y="15">Precip</text>
          <line x1="10" x2="25" y1="11" y2="11" />
          <text x="30" y="40">Snow</text>
          <line x1="10" x2="25" y1="36" y2="36" />
        </g>
      </svg>
    </div>
    <div class="source">
      Source: National Weather Service
    </div>
  </Post>
</template>

<script>
import * as d3 from 'd3';
import Post from '@/components/Post.vue';
import visualizations from '@/constants/VisualizationsList';

// chart dimensions
const width = 750;
const height = 300;
const precipHeight = 60;
const margin = {
  top: 10,
  right: 30,
  bottom: precipHeight + 20,
  left: 60,
};

// date constants
const winterDates = [new Date(2018, 9, 15), new Date(2019, 4)];
const summerDates = [new Date(2019, 4), new Date(2019, 9, 15)];
const dateParse = d3.timeParse('%m/%d/%Y');
const ONE_DAY = 24 * 3600 * 1000;

// colors
const colors = {
  recordHigh: 'rgba(199, 122, 114, 0.4)',
  normal: 'rgba(150, 150, 150, 0.4)',
  recordLow: 'rgba(174, 199, 232, 0.5)',
  actual: 'rgb(80, 80, 80)',
  rain: '#444c5c',
  snow: '#8e90a4',
};

// other constants
const locations = {
  boulder: 'Boulder',
  dc: 'DC',
};
const chartTitleByRef = {
  winterChart: 'Winter',
  summerChart: 'Summer',
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
    chartTitleByRef,
    colors,
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
    this.drawLabels();
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
        return d.STATION === this.stationId && d.parsedDate >= dates[0] && d.parsedDate < dates[1];
      });
    },

    getWeatherRecordData(dates) {
      return this.weatherRecords.filter((d) => {
        let inTimeRange = false;
        [2018, 2019].forEach((year) => {
          const date = new Date(year, d.Month - 1, d.Day);
          if (date >= dates[0] && date < dates[1]) {
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
      const yAxis = d3.axisLeft()
        .scale(y)
        .tickFormat(d => `${d}°`);

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
          .attr('fill', colors.recordHigh);
      const avgOverlay = chart.select('.avgOverlay').selectAll('rect')
        .data(weatherRecordsData)
        .join('rect')
          .transition()
          .attr('x', d => x(d.parsedDate))
          .attr('y', d => y(d.NormalDailyMax))
          .attr('width', d => x(d.parsedDate) - x(d.parsedDate - ONE_DAY))
          .attr('height', d => y(d.DailyRecordMin) - y(d.NormalDailyMax))
          .attr('fill', colors.normal);
      const lowOverlay = chart.select('.lowOverlay').selectAll('rect')
        .data(weatherRecordsData)
        .join('rect')
          .transition()
          .attr('x', d => x(d.parsedDate))
          .attr('y', d => y(d.NormalDailyMin))
          .attr('width', d => x(d.parsedDate) - x(d.parsedDate - ONE_DAY))
          .attr('height', d => y(d.DailyRecordMin) - y(d.NormalDailyMin))
          .attr('fill', colors.recordLow);

      // Draw temperature bars
      const tempBars = chart.select('.tempBars').selectAll('rect')
        .data(weatherData)
        .join('rect')
          .transition()
          .attr('x', d => x(d.parsedDate))
          .attr('y', d => y(d.TMAX))
          .attr('width', d => x(d.parsedDate) - x(d.parsedDate - ONE_DAY))
          .attr('height', d => y(d.TMIN) - y(d.TMAX))
          .attr('fill', colors.actual);

      // Precipitation graph (Note that these are being drawn inside the bottom margin)
      const precipY = d3.scaleLinear()
        .domain([0, 14])
        .range([height + precipHeight, height]);
      const precipYAxis = d3.axisLeft().scale(precipY).ticks(3);
      chart.select('.precipXAxis')
        .call(xAxis)
        .attr('transform', `translate(0, ${height + precipHeight})`)
        .selectAll('.tick')
          .style('display', 'none');
      chart.select('.precipYAxis').call(precipYAxis);

      const snowBars = chart.select('.precipBars').selectAll('.snowBars')
        .data(weatherData)
        .join('rect')
          .attr('class', 'snowBars')
          .transition()
          .attr('x', d => x(d.parsedDate))
          .attr('y', d => precipY(d.SNOW))
          .attr('width', d => x(d.parsedDate) - x(d.parsedDate - ONE_DAY))
          .attr('height', d => precipY(0) - precipY(d.SNOW))
          .attr('fill', colors.snow);

      const rainBars = chart.select('.precipBars').selectAll('.rainBars')
        .data(weatherData)
        .join('rect')
          .attr('class', 'rainBars')
          .transition()
          .attr('x', d => x(d.parsedDate))
          .attr('y', d => precipY(+d.PRCP + +d.SNOW))
          .attr('width', d => x(d.parsedDate) - x(d.parsedDate - ONE_DAY))
          .attr('height', d => precipY(d.SNOW) - precipY(+d.PRCP + +d.SNOW))
          .attr('fill', colors.rain);
    },

    updateCharts() {
      this.updateChart(this.$refs.winterChart, {
        tempRange: [-30, 110],
        timeRange: winterDates,
      });
      this.updateChart(this.$refs.summerChart, {
        tempRange: [-30, 110],
        timeRange: summerDates,
      });
    },

    drawLabels() {
      this.chartRefs.forEach((chartRef) => {
        const chart = d3.selectAll(this.$refs[chartRef]).select('g');
        chart.append('text')
          .attr('class', 'axisLabel')
          .attr('x', -height / 2)
          .attr('y', -35)
          .attr('transform', 'rotate(-90)')
          .text('Temperature (°F)');
        chart.append('text')
          .attr('class', 'axisLabel')
          .attr('x', -height - (precipHeight / 2) - 5)
          .attr('y', -35)
          .attr('transform', 'rotate(-90)')
          .text('Precip (in.)');
      });
    },
  },
};
</script>

<style lang="scss">
@import '~@/styles/legacy/bootstrap-partial.css';

.btn-group .btn {
  font-size: 13px;
  margin: 10px 0 20px;
}

.chartContainer {
  margin-bottom: 20px;
}
.chartTitle {
  font-size: 16px;
  font-weight: 300;
  margin: 0;
  padding: 0 60px 10px;
  text-align: left;
}

.xAxis .tick:nth-child(2) text { display: none; }

.axisLabel {
  font-size: 10px;
  text-anchor: middle;
}

.legendContainer {
  background-color: #eee;
  border: 1px solid #999;
  padding: 5px 10px;  
  position: absolute;

  text { font-size: 10px; }
  line { stroke: #555; }
}
.tempLegendContainer {
  right: 10px;
  top: -5px;
}
.precipLegendContainer {
  right: 10px;
  top: 320px;
}

.source {
  font-size: 11px;
  text-align: right;
}
</style>
