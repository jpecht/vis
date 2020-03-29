<template>
  <Post v-bind="info">
    <template v-slot:description>
      <p>
        The New York Times released their COVID-19 county-level data recently.
      </p>
    </template>
    <div>
      <svg ref="map" />
    </div>
    <div class="source">
      Source:
      <a
        href="https://www.census.gov/data/developers/data-sets/popest-popproj/popest.html"
        rel="noopener noreferrer"
        target="_blank"
      >
        US Census
      </a>
    </div>
  </Post>
</template>

<script>
import Post from '@/components/Post.vue';
import * as d3 from 'd3';
import * as topojson from 'topojson';
import visualizations from '@/constants/VisualizationsList';

const mapWidth = 600;
const mapHeight = 450;

export default {
  name: 'Covid',
  components: {
    Post,
  },

  data: () => ({
    covidData: [],
    info: visualizations.find(v => v.url === 'covid'),
    popDataByFips: {},
  }),

  async mounted() {
    const [us, covidData, popData] = await Promise.all([
      d3.json('./data/us.json'),
      d3.csv('https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv'),
      d3.tsv('./data/population_2019.tsv'),
    ]);

    // Create the map
    this.createMap(us);

    // Save COVID data
    this.covidData = covidData;

    // Create the lookup for population by FIPS
    popData.forEach((d) => {
      this.popDataByFips[+d.fips] = +d.population;
    });

    // TODO: Draw for an arbitrary date for now
    this.drawForDate('2020-03-27');
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

      // Establish quantile scale
      const scale = d3.scaleQuantile()
        .domain(Object.values(percentageCasesByFips))
        .range(d3.schemeBlues[7]);

      console.log(scale.quantiles());

      d3.selectAll('.county')
        .style('fill', (d) => {
          const numCases = percentageCasesByFips[d.id] || 0;
          return scale(numCases);
        });
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

.source {
  font-size: 11px;
  text-align: right;
}
</style>