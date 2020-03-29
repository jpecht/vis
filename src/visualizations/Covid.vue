<template>
  <Post v-bind="info">
    <template v-slot:description>
      <p>
        With COVID-19 starting to hit the U.S. pretty hard, I wanted to visualize the data on a map
        to see how bad it was really getting (and in which parts of the U.S.).
        The data is directly linked to the New York Times COVID-19 dataset, so this chart automatically
        updates as NYT updates their dataset.
      </p>
    </template>
    <div class="covidGraphicContainer">
      <svg ref="map" />
      <div>
        <div class="btn-group">
          <button
            v-for="metric in metrics"
            :key="metric.name"
            :class="['btn', 'btn-default', {
              active: currentMetric === metric.name,
            }]"
            @click="handleMetricChange(metric)"
          >
            {{ metric.name }}
          </button>
        </div>
      </div>
      <div class="datePickerContainer">
        <div class="slider">
          <vue-slider
            :min="0"
            :max="numDaysSinceStart"
            :interval="1"
            tooltip="none"
            v-model="currentDaysSinceStart"
            @change="handleDateChange"
          />
          <svg
            ref="sliderDisplay"
            class="sliderDisplay"
          />
        </div>
      </div>
      <div class="source">
        Source:
        <a
          href="https://github.com/nytimes/covid-19-data"
          rel="noopener noreferrer"
          target="_blank"
        >
          New York Times
        </a>
        and
        <a
          href="https://www.census.gov/data/developers/data-sets/popest-popproj/popest.html"
          rel="noopener noreferrer"
          target="_blank"
        >
          US Census
        </a>
      </div>
    </div>
  </Post>
</template>

<script>
import Post from '@/components/Post.vue';
import * as d3 from 'd3';
import * as topojson from 'topojson';
import moment from 'moment';
import visualizations from '@/constants/VisualizationsList';

const mapWidth = 600;
const mapHeight = 420;

moment.utc();
const startDate = moment([2020, 2]);
let endDate = moment([2020, 3]); // temporary until we determine latest data date

const metrics = [
  {
    name: '# of Cases',
    calculator: d => +d.cases,
    colorScheme: d3.schemeBlues[7],
    scale: 'quantile',
  }, {
    name: '% of Cases by Population',
    calculator: (d, pop) => +d.cases / pop,
    colorScheme: d3.schemeBlues[7],
    scale: 'quantile',
  }, {
    name: '# of Deaths',
    calculator: d => +d.deaths,
    colorScheme: d3.schemeBlues[7],
    scale: 'threshold',
    thresholds: [1, 5, 10, 100, 1000, 10000],
  }, {
    name: '% of Deaths by Population',
    calculator: (d, pop) => +d.deaths / pop,
    colorScheme: d3.schemeBlues[7],
    scale: 'quantile',
  },
];

export default {
  name: 'Covid',
  components: {
    Post,
  },

  data: () => ({
    colorScale: d3.scaleQuantile(),
    covidData: [],
    currentDate: endDate.format('YYYY-MM-DD'), // temporary until we determine latest data date
    currentDaysSinceStart: 30, // temporary until we determine latest data date
    currentMetric: metrics[0].name,
    info: visualizations.find(v => v.url === 'covid'),
    metrics,
    numDaysSinceStart: 30, // temporary until we determine latest data date
    popDataByFips: {},
  }),

  async mounted() {
    const [us, covidData, popData] = await Promise.all([
      d3.json('./data/us.json'),
      d3.csv('https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv'),
      d3.tsv('./data/population_2019.tsv'),
    ]);

    // Save COVID data
    this.covidData = covidData;

    // Create the lookup for population by FIPS
    popData.forEach((d) => {
      this.popDataByFips[+d.fips] = +d.population;
    });

    // Determine the last date that there is data for
    // Assume that the last row of data is the latest
    endDate = moment(covidData[covidData.length - 1].date);
    this.currentDate = endDate.format('YYYY-MM-DD');
    this.numDaysSinceStart = endDate.diff(startDate, 'days');
    this.currentDaysSinceStart = this.numDaysSinceStart;

    // Create components
    this.createMap(us);
    this.drawSliderDisplay();

    // Update the scale and map
    this.establishScale();
    this.updateMap();
  },

  methods: {
    createMap(us) {
      const projection = d3.geoAlbersUsa()
        .scale(800)
        .translate([mapWidth / 2, mapHeight / 2]);
      const path = d3.geoPath().projection(projection);
      const map = d3.select(this.$refs.map)
        .attr('width', mapWidth)
        .attr('height', mapHeight);

      // Draw the map
      const counties = topojson.feature(us, us.objects.counties).features;
      const states = topojson.mesh(us, us.objects.states, (a, b) => a !== b);    
      map.append('g')
        .attr('class', 'counties')
        .selectAll('path')
          .data(counties)
        .enter().append('path')
          .attr('class', 'county')
          .attr('d', path);   
      map.append("path").datum(states)
        .attr("class", "states")
        .attr("d", path);
    },

    drawForDate(date) {
    },

    drawSliderDisplay() {
      const timeScale = d3.scaleTime()
        .domain([startDate.toDate(), endDate.toDate()])
        .range([0, 300]); // range is the width of the slider

      const isMajorTick = (d) => {
        const date = d.getDate();
        if (d.getMonth() === endDate.month() && date === endDate.date()) {
          if (endDate.date() > 10) return true;
        }
        return d.getDate() === 1;
      };
      const timeAxis = d3.axisBottom()
        .scale(timeScale)
        .ticks(d3.timeDay.every(1))
        // .ticks(d3.timeDay.filter(ticksToShowFunc))
        .tickFormat(d => isMajorTick(d) ? d3.timeFormat('%b %e')(d) : '')
        .tickSizeInner(8)
        .tickSizeOuter(0);

      const sliderDisplay = d3.select(this.$refs.sliderDisplay);
      sliderDisplay.attr('transform', 'translate(-40, 0)')
        .append('g')
          .attr('transform', 'translate(40, 0)')
          .call(timeAxis);


      // Shorten tick size for minor ticks
      sliderDisplay.selectAll('.tick')
        .filter(d => !isMajorTick(d))
        .select('line')
          .attr('y2', 4);
    },

    establishScale() {
      const metric = metrics.find(m => m.name === this.currentMetric);
      const dataByFips = this.getDataByFips();
      if (metric.scale === 'quantile') {
        this.colorScale = d3.scaleQuantile()
          .domain(Object.values(dataByFips))
          .range(metric.colorScheme);
      } else if (metric.scale === 'threshold') {
        this.colorScale = d3.scaleThreshold()
          .domain(metric.thresholds)
          .range(metric.colorScheme);
      }
    },

    getDataByFips(date) {
      const metric = metrics.find(m => m.name === this.currentMetric);

      // Filter the NYT data for the single date
      const covidDataForDate = this.covidData.filter(d => d.date === this.currentDate);

      // Create lookup by FIPS and calculate percentage of cases per population
      const dataByFips = {};
      covidDataForDate.forEach((d) => {
        const fips = +d.fips;
        const population = this.popDataByFips[fips];
        if (!population) return 0;

        dataByFips[fips] = metric.calculator(d, population);
      });

      return dataByFips;
    },

    handleDateChange() {
      const currentDate = moment(startDate).add(this.currentDaysSinceStart, 'days');
      this.currentDate = currentDate.format('YYYY-MM-DD');
      this.updateMap();
    },

    handleMetricChange(metric) {
      this.currentMetric = metric.name;
      this.establishScale();
      this.updateMap();
    },

    updateMap() {
      // Filter the NYT data for the single date
      const dataByFips = this.getDataByFips();

      // Color counties based on color scale
      d3.selectAll('.county')
        .style('fill', d => this.colorScale(dataByFips[d.id] || 0));
    },
  },
};
</script>

<style lang="scss">
@import '~@/styles/legacy/bootstrap-partial.css';

.covidGraphicContainer {
  .btn {
    background-color: #f6f6f6;
    font-family: 'Open Sans', sans-serif;
    font-size: 13px;
    padding: 3px 12px;
  }

  .counties { fill: none; }
  .states {
    fill: none;
    stroke: white;
    stroke-linejoin: round;
  }

  .datePickerContainer {
    height: 45px;
    margin: 15px 0;
    text-align: center;
  }
  .dateDisplay { margin-top: 5px; }

  .slider {
    display: inline-block;
    position: relative;
    width: 300px;

    .vue-slider-rail { background-color: transparent !important; }
    .vue-slider-process { display: none; }
  }

  .sliderDisplay {
    left: 0;
    position: absolute;
    top: 10px;
    width: 380px;

    .tick text { font-size: 11px; }
  }

  .source {
    font-size: 11px;
    text-align: right;
  }
}
</style>