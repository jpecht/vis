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
      <div class="bottomContainer">
        <div class="metricContainer">
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
        </div>
        <div class="infoContainer">
          <div><b>{{ currentCountyName }}</b></div>
          <div>{{ currentCountyCases }} cases ({{ currentCountyCasesPerc }} per mil)</div>
          <div>{{ currentCountyDeaths }} deaths</div>
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

const percentageFormat = d => d3.format('.2s')(d * 1e6);

export default {
  name: 'Covid',
  components: {
    Post,
  },

  data: () => ({
    chartTitle: '',
    colorScale: d3.scaleQuantile(),
    covidData: [],
    currentCountyId: '',
    currentDate: endDate, // temporary until we determine latest data date
    currentDaysSinceStart: 30, // temporary until we determine latest data date
    currentMetric: metrics[0].name,
    dataByFips: {},
    info: visualizations.find(v => v.url === 'covid'),
    loading: true,
    metrics,
    numDaysSinceStart: 30, // temporary until we determine latest data date
    popDataByFips: {},
    showMetricAsPercentage: true,
  }),

  computed: {
    currentCountyCases() {
      if (!this.dataByFips[this.currentCountyId]) return 0;
      return this.dataByFips[this.currentCountyId]['COVID-19 Cases'].total;
    },
    currentCountyCasesPerc() {
      if (!this.dataByFips[this.currentCountyId]) return 0;
      return percentageFormat(this.dataByFips[this.currentCountyId]['COVID-19 Cases'].percentage);
    },
    currentCountyDeaths() {
      if (!this.dataByFips[this.currentCountyId]) return 0;
      return this.dataByFips[this.currentCountyId]['COVID-19 Deaths'].total;
    },
    currentCountyDeathsPerc() {
      if (!this.dataByFips[this.currentCountyId]) return 0;
      return percentageFormat(this.dataByFips[this.currentCountyId]['COVID-19 Deaths'].percentage);
    },
    currentCountyName() {
      if (!this.dataByFips[this.currentCountyId]) return '';
      return this.dataByFips[this.currentCountyId].name;
    },
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
    this.updateScale();
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

      // Add hover watch
      map.selectAll('.county').on('mouseover', (d) => {
        this.currentCountyId = d.id;
      });
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

    getDataByFips(date) {
      const metric = metrics.find(m => m.name === this.currentMetric);

      // Filter the NYT data for the single date
      const covidDataForDate = this.covidData.filter(d => d.date === date);

      // Create data lookup object indexed by FIPS
      const dataByFips = {};
      covidDataForDate.forEach((d) => {
        const fips = +d.fips;
        dataByFips[fips] = {
          name: `${d.county}, ${d.state}`,
        };

        // Populate data lookup with each metric
        metrics.forEach((metric) => {
          const value = metric.calculator(d);
          let percValue = 0;

          const population = this.popDataByFips[fips];
          if (population) percValue = value / population;

          dataByFips[fips][metric.name] = {
            percentage: percValue,
            total: value,
          };
        });
      });

      return dataByFips;
    },

    handleControlsChange() {
      this.updateScale();
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
      this.updateScale();
      this.updateMap();
    },

    updateMap() {
      // Filter the NYT data for the single date
      this.dataByFips = this.getDataByFips(this.currentDate);

      // Color counties based on color scale
      const property = this.showMetricAsPercentage ? 'percentage' : 'total';
      d3.selectAll('.county')
        .style('fill', (d) => {
          let value = 0;
          if (this.dataByFips[d.id]) {
            value = this.dataByFips[d.id][this.currentMetric][property];
          }
          return this.colorScale(value);
        });

      // Update chart title
      this.chartTitle = `${this.currentMetric} by County`;
    },

    updateScale() {
      // Get data for the end date
      const metric = metrics.find(m => m.name === this.currentMetric);
      const dataByFips = this.getDataByFips(endDate);

      // Clear out legend content for re-draw
      const legend = d3.select(this.$refs.legend);
      legend.html('');
      let categories = [];

      if (metric.scale === 'quantile' || this.showMetricAsPercentage) {
        const property = this.showMetricAsPercentage ? 'percentage' : 'total';
        const values = Object.values(dataByFips).map(d => d[this.currentMetric][property]);
        this.colorScale = d3.scaleQuantile()
          .domain(values)
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
          const format = d => (d === 0) ? '0' : percentageFormat(d);
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

  /* -------- Map -------- */
  .mapContainer {
    display: inline-block;
    margin-top: -30px;
    position: relative;
  }
  .map { transform: translate(-60px, 0); }
  .counties { fill: none; }
  .states {
    fill: none;
    stroke: white;
    stroke-linejoin: round;
  }

  /* -------- Legend -------- */
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

  /* -------- Info Container ---------- */
  .bottomContainer {
    align-items: flex-start;
    display: flex;
    margin-top: 5px;
  }
  .metricContainer { flex: 1; }
  .infoContainer {
    background-color: rgba(255, 255, 255, 0.6);
    border: 1px solid #999;
    border-radius: 4px;
    display: inline-block;
    padding: 10px 20px;
    right: 0;
    text-align: left;
    top: 0;
    width: 200px;
  }


  /* -------- Buttons and Sliders -------- */
  .btn {
    background-color: #f6f6f6;
    font-family: 'Open Sans', sans-serif;
    font-size: 13px;
    padding: 3px 12px;
  }

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