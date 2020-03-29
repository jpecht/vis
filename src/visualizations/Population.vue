<template>
  <Post v-bind="info">
    <template v-slot:description>
      <p>
        Population levels and growth mapped on the county level.
        I used the decennial census so a different dataset exists for every decade. 
        Seeing the spread into the West (i.e. the start of data collection) in the 1800s is cool to see visually.
        When looking at the most recent levels, 
        there's that big white strip down the middle that just accentuates the loneliness of the Midwest =P.
      </p>
      <p>
        Looking at the population growth is cool too. 1980 in the West seems like a crazy time...
        1980 in general there seems to be a lot of growth. 
        Geographically, Florida and California seem to be constantly growing,
        while the Midwest had its moments back in the day but is petering out now.
      </p>
    </template>
    <div id="pop-map-wrapper" class="map-wrapper">
      <div id="pop-map" class="us-map">
        <svg ref="map" />
      </div>
      <div id="pop-slider-container">
        <div class="pop-slider">
          <vue-slider
            :min="1790"
            :max="2010"
            :interval="10"
            tooltip="none"
            v-model="year"
            @change="handleSliderChange"
          />
        </div>
        <div id="pop-slider-text">Year: <b>{{ year }}</b></div>
      </div>
      <div id="pop-dropdown-container">
        <b-dropdown
          class="pop-dropdown"
          :text="metricFormatted"
          variant="light"
        >
          <b-dropdown-item @click="handleDropdownChange('')">
            Pop Levels
          </b-dropdown-item>
          <b-dropdown-item @click="handleDropdownChange('c')">
            Pop Growth
          </b-dropdown-item>
        </b-dropdown>
      </div>
      <div id="pop-source" class="source map-source">Source: U.S. Census Bureau</div>             
    </div>
  </Post>
</template>

<script>
import Post from '@/components/Post.vue';
import * as d3 from 'd3';
import * as topojson from 'topojson';
// import $ from 'jquery';
import visualizations from '@/constants/VisualizationsList';

// Import vendor CSS
// import 'bootstrap/dist/css/bootstrap.css';
// import 'bootstrap-vue/dist/bootstrap-vue.css';

// colors! some from colorbrewer.org
const blue_colors = ['rgb(189,215,231)','rgb(107,174,214)','rgb(49,130,189)','rgb(7,81,156)','rgb(28,53,99)'];
const choropleth = ['rgb(247,251,255)','rgb(222,235,247)','rgb(198,219,239)','rgb(158,202,225)','rgb(107,174,214)','rgb(66,146,198)','rgb(33,113,181)','rgb(8,81,156)','rgb(8,48,107)'];
const PuBu = ['rgb(255,247,251)','rgb(236,231,242)','rgb(208,209,230)','rgb(166,189,219)','rgb(116,169,207)','rgb(54,144,192)','rgb(5,112,176)','rgb(4,90,141)','rgb(2,56,88)'];
const PuBuGn = ['rgb(255,247,251)','rgb(236,226,240)','rgb(208,209,230)','rgb(166,189,219)','rgb(103,169,207)','rgb(54,144,192)','rgb(2,129,138)','rgb(1,108,89)','rgb(1,70,54)'];
const na_color = 'rgb(200,200,200)';

var strip_rgb = function(rgb_str) {
  var bare = rgb_str.replace('rgb(', '').replace(')', '');
  return bare.split(',');
};

export default {
  name: 'Population',
  components: {
    Post,
  },
  data: () => ({
    info: visualizations.find(v => v.url === 'population'),
    metric: '',
    stats: {},
    year: 2010,
  }),
  computed: {
    metricFormatted() {
      return this.metric ? 'Pop Growth' : 'Pop Levels';
    },

    threshold() {
      if (!this.metric) {
        return d3.scaleThreshold()
          .domain([5000, 10000, 15000, 20000, 30000, 50000, 100000, 150000])
          .range(choropleth);
      }
      return d3.scaleThreshold()
        .domain([-0.07, -0.03, 0, 0.02, 0.04, 0.07, 0.11, 0.20])
        .range(PuBuGn);
    },
  },
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
      const pop_svg = d3.select(this.$refs.map)
        .attr('width', map_width)
        .attr('height', map_height);
        
      
      const [us, pop_data] = await Promise.all([
        d3.json('./data/us.json'),
        d3.tsv('./data/hist_county_pop.tsv'),
      ]);

      // drawing the map
      const counties = topojson.feature(us, us.objects.counties).features;
      const states = topojson.mesh(us, us.objects.states, (a, b) => a !== b);    
      pop_svg.append('g')
        .attr('class', 'counties')
        .selectAll('path')
          .data(counties)
        .enter().append('path')
          .attr('class', 'county')
          .attr('d', path);   
      pop_svg.append("path").datum(states)
        .attr("class", "states")
        .attr("d", path);
        
      // organize data
      for (var i = 0; i < pop_data.length; i++) {
        var fips = +pop_data[i].FIPS;
        this.stats[fips] = pop_data[i];
      }

      // initialize at levels 2010  
      this.updateMap();            
    },

    handleDropdownChange(metric) {
      this.metric = metric;
      this.year = this.year - (this.year % 10); // round year for simplification
      this.updateMap();
    },

    handleSliderChange() {
      const current_year = this.year;
      var year_to_decade = current_year % 10;
      if (year_to_decade !== 0) {
        var low_year = current_year - year_to_decade;
        var high_year = low_year + 10;        
      }
      
      d3.select(this.$refs.map).selectAll('.county').style('fill', (d, i) => {
        if (this.stats.hasOwnProperty(+d.id)) {
          if (year_to_decade === 0) {
            return this.getColor(this.stats[+d.id][this.metric+this.year]);
          } else {          
            // if slider is continuous
            var low_rgb = strip_rgb(this.getColor(this.stats[+d.id][this.metric+low_year]));
            var high_rgb = strip_rgb(this.getColor(this.stats[+d.id][this.metric+high_year]));
            var mid_rgb = [];
            for (var i = 0; i < low_rgb.length; i++) {
              mid_rgb[i] = parseInt(+low_rgb[i] + (+high_rgb[i] - +low_rgb[i]) * year_to_decade / 10);
            }
            var new_color = 'rgb(' + mid_rgb[0] + ',' + mid_rgb[1] + ',' + mid_rgb[2] + ')';
            return new_color;
          }
        } else return na_color;
      });
    },

    updateMap() {
      d3.select(this.$refs.map)
        .selectAll('.county')
        .transition()
        .duration(750)
        .style('fill', (d, i) => {
          return (this.stats.hasOwnProperty(+d.id))
            ? this.getColor(this.stats[+d.id][this.metric+this.year])
            : na_color;
        });
    },

    getColor(val) {
      return (isNaN(val) || val === '') ? na_color : this.threshold(val);
    },
  },
};
</script>

<style lang="scss">
@import '~@/styles/legacy/bootstrap-partial.css';

#pop-map-wrapper {
  text-align: left;
  border: 1px solid #CCC;
  box-shadow: inset 1px 1px 1px rgba(0,0,0,0.4);
  position: relative;

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

  #pop-slider-container {
    text-align: center;
  }
  #pop-slider { display: inline-block; width: 40%; }
  #pop-slider-text {
    margin-top: 10px;
    text-align: center;
    font-size: 1em;
    font-weight: 400;
  }
  .pop-slider {
    display: inline-block;
    width: 400px;
  }
  .pop-dropdown {
    position: absolute;
    bottom: 20px;
    left: 20px;
    border: 1px solid #bbb;
  }
  b { font-weight: 600; }
}
</style>
