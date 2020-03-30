<template>
  <Post v-bind="info" wide>
    <template v-slot:description>
      <p>
        With COVID-19 starting to hit the U.S. pretty hard, I wanted to visualize the data on a map
        to see how bad it was really getting (and in which parts of the U.S.).
        The data is directly linked to the New York Times COVID-19 dataset, so this chart automatically
        updates as NYT updates their dataset.
      </p>
    </template>
    <div
      v-if="loading"
      class="covidGraphicLoadingIndicator"
    >
      Loading data...
    </div>
    <div
      v-show="!loading"
      class="covidGraphicContainer"
    >
      <h2 class="chartTitle">{{ chartTitle }}</h2>
      <div>
        <div class="mapContainer">
          <svg ref="map" class="map" />
          <div class="legendContainer">
            <svg ref="legend" class="legend" />
            <label
              v-show="currentMetric !== 'COVID-19 Deaths'"
              class="controls"
            >
              <input
                type="checkbox"
                v-model="showMetricAsPercentage"
                @change="handleControlsChange"
              />
              <span>View values as # of {{ metricNoun }} per million</span>
            </label>
          </div>
        </div>
      </div>
      <div class="metricButtonContainer">
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
const startDate = '2020-03-01';
let endDate = '2020-04-01'; // temporary until we determine latest data date

const metrics = [
  {
    name: 'COVID-19 Cases',
    calculator: d => +d.cases,
    colorScheme: d3.schemeBlues[7],
    noun: 'cases',
    scale: 'quantile',
  }, {
    name: 'COVID-19 Deaths',
    calculator: d => +d.deaths,
    colorScheme: d3.schemePuRd[7],
    noun: 'deaths',
    scale: 'threshold',
    thresholds: [1, 2, 5, 10, 100, 1000],
  },
];

export default {
  name: 'Covid',
  components: {
    Post,
  },

  data: () => ({
    chartTitle: '',
    colorScale: d3.scaleQuantile(),
    covidData: [],
    currentDate: endDate, // temporary until we determine latest data date
    currentDaysSinceStart: 30, // temporary until we determine latest data date
    currentMetric: metrics[0].name,
    info: visualizations.find(v => v.url === 'covid'),
    loading: true,
    metrics,
    numDaysSinceStart: 30, // temporary until we determine latest data date
    popDataByFips: {},
    showMetricAsPercentage: true,
  }),

  computed: {
    metricNoun() { return metrics.find(m => m.name === this.currentMetric).noun; },
  },

  async mounted() {
    const [us, covidData, popData] = await Promise.all([
      d3.json('./data/us.json'),
      d3.csv('https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv'),
      d3.tsv('./data/population_2019.tsv'),
    ]);

    this.loading = false;

    // Save COVID data
    this.covidData = covidData;

    // Create the lookup for population by FIPS
    popData.forEach((d) => {
      this.popDataByFips[+d.fips] = +d.population;
    });

    // Determine the last date that there is data for
    // Assume that the last row of data is the latest
    endDate = covidData[covidData.length - 1].date;
    this.currentDate = endDate;
    this.numDaysSinceStart = moment(endDate).diff(moment(startDate), 'days');
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

    drawSliderDisplay() {
      const timeScale = d3.scaleTime()
        .domain([moment(startDate).toDate(), moment(endDate).toDate()])
        .range([0, 300]); // range is the width of the slider

      const endMonth = moment(endDate).month();
      const endDay = moment(endDate).date();
      const isMajorTick = (d) => {
        const date = d.getDate();
        if (d.getMonth() === endMonth && date === endDay) {
          if (endDay > 10) return true;
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
      // Get data for the end date
      const metric = metrics.find(m => m.name === this.currentMetric);
      const dataByFips = this.getDataByFips(endDate);

      // Clear out legend content for re-draw
      const legend = d3.select(this.$refs.legend);
      legend.html('');
      let categories = [];

      if (metric.scale === 'quantile' || this.showMetricAsPercentage) {
        this.colorScale = d3.scaleQuantile()
          .domain(Object.values(dataByFips))
          .range(metric.colorScheme);
        categories = this.colorScale.quantiles();
      } else if (metric.scale === 'threshold') {
        this.colorScale = d3.scaleThreshold()
          .domain(metric.thresholds)
          .range(metric.colorScheme);
        categories = metric.thresholds;
      }

      // Determine what legend colors and text to display
      const getLegendText = (i) => {
        const lowerLimit = (i === 0) ? 0 : categories[i - 1];
        const upperLimit = categories[i];

        // Format legend text when showing percentages
        if (this.showMetricAsPercentage) {
          const format = d => (d === 0) ? '0' : d3.format('.2s')(d * 1e6);
          if (i === categories.length) return `> ${format(lowerLimit)} per mil`;
          return `${format(lowerLimit)} - ${format(upperLimit)} per mil`;
        }

        // Format legend text when showing absolute values
        if (i === categories.length) return `> ${lowerLimit - 1}`;
        if (upperLimit === lowerLimit + 1) return lowerLimit;
        return `${lowerLimit} - ${upperLimit - 1}`;
      };
      const legendData = metric.colorScheme.map((color, i) => ({
        color,
        text: getLegendText(i),
      }));

      // Re-draw legend
      const groups = legend.append('g').selectAll('g')
        .data(legendData)
        .enter().append('g');
      groups.append('rect')
        .attr('width', 40)
        .attr('height', 16)
        .attr('y', (d, i) => 16 * i)
        .style('fill', d => d.color);
      groups.append('text')
        .attr('x', 47)
        .attr('y', (d, i) => (16 * i) + 14)
        .text(d => d.text);
    },

    getDataByFips(date) {
      const metric = metrics.find(m => m.name === this.currentMetric);

      // Filter the NYT data for the single date
      const covidDataForDate = this.covidData.filter(d => d.date === date);

      // Create lookup by FIPS and calculate percentage of cases per population
      const dataByFips = {};
      covidDataForDate.forEach((d) => {
        const fips = +d.fips;
        let value = metric.calculator(d);

        if (this.showMetricAsPercentage) {
          const population = this.popDataByFips[fips];
          if (!population) {
            dataByFips[fips] = 0;
            return;
          }
          value /= population;
        }

        dataByFips[fips] = value;
      });

      return dataByFips;
    },

    handleControlsChange() {
      this.establishScale();
      this.updateMap();
    },

    handleDateChange() {
      const currentDate = moment(startDate).add(this.currentDaysSinceStart, 'days');
      this.currentDate = currentDate.format('YYYY-MM-DD');
      this.updateMap();
    },

    handleMetricChange(metric) {
      if (metric.name === 'COVID-19 Deaths') this.showMetricAsPercentage = false;
      this.currentMetric = metric.name;
      this.establishScale();
      this.updateMap();
    },

    updateMap() {
      // Filter the NYT data for the single date
      const dataByFips = this.getDataByFips(this.currentDate);

      // Color counties based on color scale
      d3.selectAll('.county')
        .style('fill', d => this.colorScale(dataByFips[d.id] || 0));

      // Update chart title
      this.chartTitle = `${this.currentMetric} by County`;
    },
  },
};
</script>

<style lang="scss">
@import '~@/styles/legacy/bootstrap-partial.css';

.covidGraphicContainer {
  background-color: #d3d3d3;
  border: 1px solid #999;
  padding: 10px;

  .chartTitle {
    font-weight: 300;
    font-size: 22px;
  }

  .mapContainer {
    display: inline-block;
    margin-top: -30px;
    position: relative;
  }
  .map { transform: translate(-60px, 0); }
  .legendContainer {
    position: absolute;
    right: -65px;
    text-align: left;
    top: 180px;
  }
  .legend {
    height: 130px;
    width: 150px;

    text { font-size: 11px; }
  }
  .controls { display: flex; }
  .controls input {
    margin: 3px 7px 3px 0;
    position: relative;
    top: 0.5px;
  }
  .controls span { width: 120px; }

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

  .metricButtonContainer { margin-top: 5px; }

  .datePickerContainer {
    height: 40px;
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

.covidGraphicLoadingIndicator {
  font-size: 18px;
  font-weight: 300;
  padding: 30px;
  text-align: center;
}
</style>