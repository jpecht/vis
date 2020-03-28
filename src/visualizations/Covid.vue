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
    info: visualizations.find(v => v.url === 'covid'),
  }),
  mounted() {
    this.createVis();
  },
  methods: {
    async createVis() {        
      const projection = d3.geoAlbersUsa()
        .scale(800)
        .translate([mapWidth / 2, mapHeight / 2]);
      const path = d3.geoPath().projection(projection);
      const map = d3.select(this.$refs.map)
        .attr('width', mapWidth)
        .attr('height', mapHeight);
      
      const [us, covidData] = await Promise.all([
        d3.json('./data/us.json'),
        d3.csv('https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv'),
      ]);

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

      // Color counties for single date for now
      const recentCovidData = covidData.filter(d => d.date === '2020-03-27');
      const maxCases = d3.max(recentCovidData, d => +d.cases);
      console.log(maxCases);

      const casesByFips = d3.map();
      recentCovidData.forEach((d) => {
        casesByFips.set(+d.fips, +d.cases);
      });

      const scale = d3.scaleThreshold()
        .domain([10, 50, 100, 200, 500, 1000])
        .range(d3.schemeBlues[7]);

      d3.selectAll('.county')
        .style('fill', (d) => {
          const numCases = casesByFips.get(d.id) || 0;
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
</style>