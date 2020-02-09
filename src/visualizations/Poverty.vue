<template>
  <Post v-bind="info">
    <template v-slot:description>
      <p>
        Ahh the spread of poverty in our country. I'd like to first note that for some of the ethnicities,
        the thresholds are a bit higher due to the higher averages, so pay attention to the legend. 
        Also for some of the minorities, the data wasn't complete, which is why you'll see some gray areas here and there.
      </p>
      <p>
        Now it's interesting to see that there's no easy overall geographic correlation to be made for
        a single particular ethnicity, though there do seem to be little pockets of poverty in some areas.
        For example, in the West, native Americans seem to have a higher poverty percentage than in other areas. 
        When comparing different ethnicities though, it's evident that there's a much higher concentration of poverty amongst the minority ethnicities.
      </p> 
      <p>
        But looking at all the races combined, you can see there is a clear increase in poverty rates in the South,
        particularly in the southwest region as well and the East Kentucky region. Otherwise, for the minority races, the distribution looks pretty scattered. 
        It'd be interesting to see if there's a significant difference between urban and rural areas.
      </p>
    </template>
    <div id="poverty-map-wrapper" class="map-wrapper">
      <div id="poverty-map" class="us-map"></div>
      <div id="poverty-map-footer">
        <div id="poverty-dropdown-container" class="dropdown">
          <b-dropdown
            class="poverty-dropdown"
            :text="statLabel"
            variant="light"
          >
            <b-dropdown-item
              v-for="option in dropdownOptions"
              :key="option.value"
              @click="handleDropdownChange(option)"
            >
              {{ option.label }}
            </b-dropdown-item>
          </b-dropdown>
        </div>      
        <div id="poverty-legend" class="legend">
          <svg>
            <rect width="40" height="15" />
            <rect width="40" height="15" x="40" />
            <rect width="40" height="15" x="80" />
            <rect width="40" height="15" x="120" />
            <rect width="40" height="15" x="160" />
          </svg>
          <div id="poverty-legend-texts">
            <div id="poverty-legend-text-1">0%</div>
            <div id="poverty-legend-text-2">10%</div>
            <div id="poverty-legend-text-3">15%</div>
            <div id="poverty-legend-text-4">20%</div>
            <div id="poverty-legend-text-5">25%</div>
            <div id="poverty-legend-text-6">100%</div>
          </div>
        </div>
      </div>
      <div id="poverty-average-text">
        <span v-if="averageMode === 'national'">
          National Average: {{ nationalAverage }}
        </span>
        <span v-else>
          {{ averageText }}
        </span>
      </div>
      <div id="poverty-source" class="source map-source">Source: U.S. Census Bureau</div>
    </div>
  </Post>
</template>

<script>
import Post from '@/components/Post.vue';
import Vue from 'vue';
import * as d3 from 'd3';
import * as topojson from 'topojson';
import $ from 'jquery';
import visualizations from '@/constants/VisualizationsList';

// colors! some from colorbrewer.org
var blue_colors = ['rgb(189,215,231)','rgb(107,174,214)','rgb(49,130,189)','rgb(7,81,156)','rgb(28,53,99)'];
var choropleth = ['rgb(247,251,255)','rgb(222,235,247)','rgb(198,219,239)','rgb(158,202,225)','rgb(107,174,214)','rgb(66,146,198)','rgb(33,113,181)','rgb(8,81,156)','rgb(8,48,107)'];
var PuBu = ['rgb(255,247,251)','rgb(236,231,242)','rgb(208,209,230)','rgb(166,189,219)','rgb(116,169,207)','rgb(54,144,192)','rgb(5,112,176)','rgb(4,90,141)','rgb(2,56,88)'];
var PuBuGn = ['rgb(255,247,251)','rgb(236,226,240)','rgb(208,209,230)','rgb(166,189,219)','rgb(103,169,207)','rgb(54,144,192)','rgb(2,129,138)','rgb(1,108,89)','rgb(1,70,54)'];
var YlOrBr = ["#ffffd4","#fed98e","#fe9929","#d95f0e","#993404"];
var OrRd = ["#fef0d9","#fdcc8a","#fc8d59","#e34a33","#b30000"];
var na_color = 'rgb(200,200,200)';

// custom thresholds for each race
var t_domains = {
  'total': [10, 15, 20, 30],
  'white': [10, 15, 20, 30],
  'black': [10, 15, 25, 35],
  'aian': [10, 15, 20, 30],
  'asian': [10, 15, 20, 30],
  'hawaiian_pi': [10, 15, 20, 30],
  'hispanic': [10, 15, 25, 35],
  'other': [10, 15, 20, 30],
  'one_race': [10, 15, 20, 30],
  'two_races': [10, 15, 20, 30]
};

const dropdownOptions = [
  { label: 'All Races', value: 'total' },
  { label: 'White', value: 'white' },
  { label: 'Black or African American', value: 'black' },
  { label: 'American Indian and Alaska Native', value: 'aian' },
  { label: 'Asian', value: 'asian' },
  { label: 'Native Hawaiian and Pacific Islander', value: 'hawaiian_pi' },
  { label: 'Hispanic or Latino Origin', value: 'hispanic' },
  { label: 'Other', value: 'other' },
  { label: 'One Race', value: 'one_race' },
  { label: 'Two or More Races', value: 'two_races' },
];

export default {
  name: 'Poverty',
  components: {
    Post,
  },
  data: () => ({
    averageMode: 'national',
    averageText: '',
    countyStats: {},
    dropdownOptions,
    info: visualizations.find(v => v.url === 'poverty'),
    nationalAverage: 0,
    stat: 'total',
    statLabel: 'All Races',
    stateStats: {},
  }),
  mounted() {
    this.createVis();
  },
  methods: {
    async createVis() {
      // initialization for maps
      const map_width = ($(window).width() < 600) ? $(window).width() - 60 : 600, 
        map_height = ($(window).width() < 600) ? 300 : 450,
        map_scale = ($(window).width() < 600) ? $(window).width() : 800; // a crude calculation of scale
        
      const projection = d3.geoAlbersUsa()
        .scale(map_scale)
        .translate([map_width / 2, map_height / 2]);
      const path = d3.geoPath().projection(projection);      
      
      /* --------------------------------- poverty post --------------------------- */
      // American Fact Finder: S1701
      var poverty_svg = d3.select('#poverty-map').append('svg')
        .attr('width', map_width)
        .attr('height', map_height);
        
      const [us, pov_data, pa_data] = await Promise.all([
        d3.json('/data/us.json'),
        d3.tsv('/data/poverty.tsv'),
        d3.tsv('/data/poverty_average.tsv'),
      ]);
      
      // drawing the map
      var counties = topojson.feature(us, us.objects.counties).features;
      var states = topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; });    
      poverty_svg.append('g')
        .attr('class', 'counties')
        .selectAll('path')
          .data(counties)
        .enter().append('path')
          .attr('class', 'county')
          .attr('d', path);   
      poverty_svg.append("path").datum(states)
        .attr("class", "states")
        .attr("d", path);
        
      // organizing data
      for (var i = 0; i < pov_data.length; i++) {
        var year = +pov_data[i].year;
        var fips = +pov_data[i].fips;
        if (!this.countyStats.hasOwnProperty(year)) this.countyStats[year] = {};
        this.countyStats[year][fips] = pov_data[i];
      } 
      
      for (var i = 0; i < pa_data.length; i++) {
        var year = +pa_data[i].year;
        var fips = +pa_data[i].fips;
        if (!this.stateStats.hasOwnProperty(year)) this.stateStats[year] = {};
        this.stateStats[year][fips] = pa_data[i];
      }
      
      this.updateMap();
    
      // hover behavior
      const self = this;
      $('.county').on('mouseover', function() {
        var state_fips = Math.floor(d3.select(this).datum().id / 1000);
        var val = +self.stateStats[2012][state_fips][self.stat];
        self.averageMode = 'state';
        self.averageText = self.stateStats[2012][state_fips].name + ' State Average: ' + val.toFixed(1) + '%';
      });
      $('.county').on('mouseout', () => {
        this.averageMode = 'national';
      });
    },

    updateMap() {
      const { stat } = this;
      
      // defining threshold scale
      var threshs = t_domains[stat];
      var threshold = d3.scaleThreshold()
        .domain(threshs)
        .range(blue_colors);
      d3.selectAll('#poverty-legend rect').style('fill', function(d, i) {
        return blue_colors[i];
      });
        
      // change legend text
      for (var i = 0; i < threshs.length; i++) {
        $('#poverty-legend-text-'+(i+2)).text(threshs[i].toFixed() + '%');  
      }
      
      // color map
      d3.select('#poverty-map').select('svg')
        .selectAll('.county')
        .transition()
        .duration(750)
        .style('fill', (d, i) => {
          if (this.countyStats[2012].hasOwnProperty(+d.id)) {
            var value = +this.countyStats[2012][+d.id][stat];
            return (isNaN(value) || value === "") ? na_color : threshold(value);
          } else return na_color;
        });
      
      // update average text
      var avg_value = +this.stateStats[2012][0][stat];
      this.nationalAverage = avg_value.toFixed(1) + '%';
    },

    handleDropdownChange(option) {
      this.stat = option.stat;
      this.statLabel = option.label;
      this.updateMap();
    },
  },
};
</script>

<style lang="scss">
@import '~@/styles/legacy/bootstrap-partial.css';

#poverty-map-wrapper {
  text-align: left;
  border: 1px solid #CCC;
  box-shadow: inset 1px 1px 1px rgba(0,0,0,0.4);

  .map-source {
    margin: 0px 20px 15px 0px;
  }
  .counties {
    fill: #CCC;
  }
  .states {
    fill: none;
    stroke: white;
    stroke-linejoin: round;
  }
  .legend {
    font-size: 0.8em;
    text-align: center;
    margin-bottom: 10px;
  }
  .source {
    font-size: 0.8em;
    text-align: right;
  }

  .counties {
    fill: none;
  }
  .states {
    fill: none;
    stroke: white;
    stroke-linejoin: round;
  }

  .circle-legend svg {
    position: relative;
    top: 3px;
  }
  .circle-legend span { padding-right: 10px; }


  #poverty-map-footer {
    position: relative;
    text-align: right;
    margin-bottom: 10px;
  }
  #poverty-legend {
    display: inline-block;
    width: 280px;
    position: relative;
    top: 10px;
  }
  #poverty-legend svg {
    height: 15px;
    width: 200px;
  }
  div[id ^= "poverty-legend-text-"] {
    text-align: center;
    display: inline-block;
    width: 38px;
  }
  #poverty-dropdown-container {
    display: inline-block;
    position: absolute;
    top: 5px;
    left: 30px;
  }
  #poverty-dropdown-container a:hover {
    background-color: #E0E0E0;
  }
  #poverty-average-text {
    margin: 0px 0px 20px 30px;
    font-size: 1em;
    font-weight: 400;
    text-align: left;
    min-height: 1em;
  }
  #poverty-source {
    position: absolute;
    right: 0px;
    bottom: 0px;
  }
  .dropdown-toggle {
    border: 1px solid #c0c0c0;
    font-size: 13px;
  }
  .dropdown-item { font-size: 13px; }

  @media (max-width: 700px) {
    #poverty-legend {
      padding-top: 50px;
    }
  }
}
</style>
