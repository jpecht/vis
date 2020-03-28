<template>
  <Post v-bind="info">
    <template v-slot:description>
      <p>
        A map showing how much money is spent on education across the states.
        Blue counties spend more on education, while red counties spend less.
        The categories are divided into money spent on instructors and money spent on "support" 
        (i.e. administration).
        The data was taken "per student" to avoid population size playing an influence.
        All data is comparative to the national average.
      </p>
      <p>
        <span style="font-weight:600;">Note:</span>
        The dropdown no longer displays correctly after porting this vis to Vue.
        You can still click the buttons to view different indicators though.
      </p>
    </template>
    <div class="education-map-wrapper map-wrapper">
      <div id="education-map" class="us-map"></div>
      <div id="education-map-footer">
        <div id="education-legend-wrapper">
          <svg id="education-legend"></svg>
        </div>
        <div id="national-stat"></div>
        <div id="county-stat"></div>
        <div id="education-dropdown-container" class="dropdown dropup">
          <button class="btn btn-default dropdown-toggle" type="button" id="education-dropdown" data-toggle="dropdown">
            <span id="education-dropdown-title">Total $ Spent on Education</span>&nbsp;&nbsp;<span class="caret"></span>
          </button>
          <ul class="dropdown-menu" role="menu" aria-labelledby="education-dropdown">
            <li role="presentation"><a role="menuitem" href="#" stat="total">Total $ Spent on Education</a></li>
            <li role="presentation"><a role="menuitem" href="#" stat="instruction">Teacher Salaries/Benefits</a></li>
            <li role="presentation"><a role="menuitem" href="#" stat="instruction_salaries">Teacher Salaries</a></li>
            <li role="presentation"><a role="menuitem" href="#" stat="instruction_benefits">Teacher Benefits</a></li>
            <li role="presentation"><a role="menuitem" href="#" stat="support">Support Services</a></li>
          </ul>
        </div>      
      </div>
      <div id="education-source" class="source map-source">Source: U.S. Census Bureau</div>
    </div>
  </Post>
</template>

<script>
import Post from '@/components/Post.vue';
import * as d3 from 'd3';
import * as topojson from 'topojson';
import $ from 'jquery';
import visualizations from '@/constants/VisualizationsList';

export default {
  name: 'EducationSpending',
  components: {
    Post,
  },
  data: () => ({
    info: visualizations.find(v => v.url === 'education-spending'),
  }),
  mounted() {
    this.createVis();
  },
  methods: {
    async createVis() {
      var natl_avg = {total: 10608, salaries: 6337, benefits: 2363, instruction: 6430, instruction_salaries: 4287,
        instruction_benefits: 1573, support: 3730, pupil_support: 605, staff_support: 491, general_admin: 202, school_admin: 577};
      
      // colors! some from colorbrewer.org
      var na_color = 'rgb(200,200,200)';
      var rb_7 = ['rgb(178,24,43)','rgb(239,138,98)','rgb(253,219,199)','rgb(247,247,247)','rgb(209,229,240)','rgb(103,169,207)','rgb(33,102,172)'];
      
      // initialization for maps
      var map_width = ($(window).width() < 600) ? $(window).width() - 60 : 600, 
        map_height = ($(window).width() < 600) ? 300 : 450,
        map_scale = ($(window).width() < 600) ? $(window).width() : 800; // a crude calculation of scale
        
      var projection = d3.geoAlbersUsa()
        .scale(map_scale)
        .translate([map_width / 2, map_height / 2]);
      var path = d3.geoPath().projection(projection);
      
      var svg = d3.select('#education-map').append('svg')
        .attr('width', map_width)
        .attr('height', map_height);
        
      var scale = d3.scaleThreshold()
        .domain([0.75, 0.85, 0.95, 1.05, 1.15, 1.25])
        .range(rb_7);
      var money_format = d3.format('$,.0f');
      
      var data_ready = function(error, us, data) {
        // drawing the map
          var counties = topojson.feature(us, us.objects.counties).features;
          var states = topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; });    
        svg.append('g')
          .attr('class', 'counties')
          .selectAll('path')
            .data(counties)
          .enter().append('path')
            .attr('class', 'county')
            .attr('d', path)
            .attr('fill', na_color)
            .on('mouseover', function(d) {
              $('#county-stat').html('County Average: ' + money_format(dataById[d.id][currentStat]) + ' per student');
            })
            .on('mouseout', function(d) {
              $('#county-stat').html('');
            });
        svg.append("path").datum(states)
          .attr("class", "states")
          .attr("d", path);
      
        // making legend
        var legend_text = ['-25%', '-15%', '-5%', '+5%', '+15%', '+25%'];
        var legend = d3.select("#education-legend").selectAll('g')
          .data(rb_7)
          .enter().append('g')
            .attr('transform', function(d, i) { return 'translate('+ 50*i + ',0)'; });
        legend.append('rect')
          .attr('height', '15px')
          .attr('width', '50px')
          .attr('fill', function(d) { return d; });
        legend.append('text')
          .attr('class', 'legend-text')
          .attr('x', '50px')
          .attr('y', '29px')
          .style('text-anchor', 'middle')
          .text(function(d, i) { return legend_text[i]; });
            
        
        // dropdown behavior
        $('#education-dropdown-container a').click(function(e) {
          e.preventDefault();
          $('#education-dropdown-title').text($(this).text());
          updateMap($(this).attr('stat'), 750);
        });
      
        var updateMap = function(stat, transition_time) {
          currentStat = stat;
          svg.selectAll('.county').transition().duration(transition_time).style('fill', function(d) {
            return (dataById.hasOwnProperty(d.id)) ? scale(dataById[d.id][stat] / natl_avg[stat]) : na_color;
          });
          $('#national-stat').html('National Average: ' + money_format(natl_avg[stat]) + ' per student');
        };
      
        var currentStat = 'total';
        updateMap(currentStat, 1500);
      };
      
      var dataById = {};
      const [us, data] = await Promise.all([
        d3.json('./data/us.json'),
        d3.tsv('./data/education_county.tsv'),
      ]);

      data.forEach((d) => {
        dataById[d.fips] = {};
        for (var ind in d) {
          if (ind !== 'fips') dataById[+d.fips][ind] = d[ind];
        }
      });

      data_ready(null, us, data);
    },
  },
};
</script>

<style lang="scss">
@import '~@/styles/legacy/bootstrap-partial.css';

.education-map-wrapper {
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

  #education-legend-wrapper {
    text-align: center;
  }

  #education-legend {
    font-size: 0.8em;
    width: 350px;
    height: 50px;
  }

  #education-dropdown-container {
    margin-left: 20px;
  }
  #education-dropdown {
    position: relative;
  }
  #education-dropdown-container a:hover {
    background-color: #E0E0E0;  
  }

  #national-stat {
    margin-top: -5px;
    margin-bottom: 5px;
    text-align: center;
  }
  #county-stat {
    text-align: center;
    margin-bottom: 15px;
  }
}
</style>
