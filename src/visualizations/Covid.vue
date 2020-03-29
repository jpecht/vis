<template>
  <Post v-bind="info">
    <template v-slot:description>
      <p>
        The New York Times released their COVID-19 county-level data recently.
      </p>
    </template>
    <div>
      <svg ref="map" />
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
const mapHeight = 450;

moment.utc();
const startDate = moment([2020, 2]);
let endDate = moment([2020, 3]); // temporary until we determine latest data date

export default {
  name: 'Covid',
  components: {
    Post,
  },

  data: () => ({
    colorScale: d3.scaleQuantile(),
    covidData: [],
    currentDaysSinceStart: 30, // temporary until we determine latest data date
    info: visualizations.find(v => v.url === 'covid'),
    numDaysSinceStart: 30, // temporary until we determine latest data date
    popDataByFips: {},
  }),

  async mounted() {
    const [us, covidData, popData] = await Promise.all([
      d3.json('./data/us.json'),
      d3.csv('https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv'),
      d3.tsv('./data/population_2019.tsv'),
    ]);

    // Determine the last date that there is data for
    // Assume that the last row of data is the latest
    endDate = moment(covidData[covidData.length - 1].date);
    this.numDaysSinceStart = endDate.diff(startDate, 'days');
    this.currentDaysSinceStart = this.numDaysSinceStart;

    // Create the map
    this.createMap(us);

    // Save COVID data
    this.covidData = covidData;

    // Create the lookup for population by FIPS
    popData.forEach((d) => {
      this.popDataByFips[+d.fips] = +d.population;
    });

    this.establishScale();
    this.drawSliderDisplay();

    // Draw the map for the current date
    this.handleDateChange();
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
      // Filter the NYT data for the single date
      const covidDataForDate = this.getDataForDate(date);

      // Color counties based on color scale
      d3.selectAll('.county')
        .style('fill', (d) => {
          const numCases = covidDataForDate[d.id] || 0;
          return this.colorScale(numCases);
        });
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
        .tickSizeInner(10)
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
      const dataForDate = this.getDataForDate(endDate.format('YYYY-MM-DD'));
      this.colorScale
        .domain(Object.values(dataForDate))
        .range(d3.schemeBlues[7]);
    },

    getDataForDate(date) {
      // Filter the NYT data for the single date
      const covidDataForDate = this.covidData.filter(d => d.date === date);

      // Create lookup by FIPS and calculate percentage of cases per population
      const percentageCasesByFips = {};
      covidDataForDate.forEach((d) => {
        const fips = +d.fips;
        const numCases = +d.cases || 0;
        const population = this.popDataByFips[fips];
        const percentageCases = population ? (numCases / population) : 0;
        percentageCasesByFips[fips] = percentageCases;
      });

      return percentageCasesByFips;
    },

    handleDateChange() {
      const currentDate = moment(startDate).add(this.currentDaysSinceStart, 'days');
      const dateString = currentDate.format('YYYY-MM-DD');
      this.drawForDate(dateString);
    },
  },
};
</script>

<style lang="scss">
.counties {
  fill: none;
}

.states {
  fill: none;
  stroke: white;
  stroke-linejoin: round;
}

.datePickerContainer {
  height: 60px;
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
  height: 30px;
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
</style>