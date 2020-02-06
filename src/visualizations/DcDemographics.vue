<template>
  <Post v-bind="info">
    <template v-slot:description>
      <p>
        DC looks really interesting when colored by census block groups.
        The Northwest-Southeast divide looks pretty prominent for some of the indicators. 
        You can really see how divided DC is.
        Data is from the 2013 ACS.
      </p>
    </template>
    <div class="dc-demographics-chart-container">
      <svg class="map"></svg>
      <svg class="legend"></svg>
      <div>
        <div class="btn-group char-btn-group" role="group">
          <button type="button" class="btn btn-default active" reference="race">Ethnicity</button>
          <button type="button" class="btn btn-default" reference="income">Income</button>
          <button type="button" class="btn btn-default" reference="povrate">Poverty</button>
          <button type="button" class="btn btn-default" reference="education">Education</button>
        </div>
      </div>
      <div>
        <div class="btn-group race-btn-group" role="group">
          <button type="button" class="btn btn-default active" reference="white">White</button>
          <button type="button" class="btn btn-default" reference="black">Black</button>
          <!--<button type="button" class="btn btn-default" reference="asian">Asian</button>-->
          <button type="button" class="btn btn-default" reference="hispanic">Hispanic</button>
        </div>
        <div class="btn-group education-btn-group" role="group">
          <button type="button" class="btn btn-default active" reference="noed">Below High</button>
          <button type="button" class="btn btn-default" reference="high">High</button>
          <button type="button" class="btn btn-default" reference="associates">Associate's</button>
          <button type="button" class="btn btn-default" reference="bachelors">Bachelor's</button>
          <button type="button" class="btn btn-default" reference="masters">Master's</button>
          <button type="button" class="btn btn-default" reference="prof">Professional</button>
          <button type="button" class="btn btn-default" reference="phd">Doctorate's</button>
        </div>
      </div>
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
  name: 'DcDemographics',
  components: {
    Post,
  },
  data: () => ({
    info: visualizations.find(v => v.url === 'dc-demographics'),
  }),
  mounted() {
    this.createVis();
  },
  methods: {
    async createVis() {
      // object to store data
      var dataById = {};
      
      // define map attributes
      var width = 600,
        height = 420;   
      var projection = d3.geoMercator()
        .center([-77.03, 38.9])
        .scale(1200 * 70)
        .translate([width / 2, height / 2]);  
      var path = d3.geoPath()
        .projection(projection);    
      var svg = d3.select('.map')
        .attr('width', width)
        .attr('height', height);
        
      // define the color scale
      var blue3 = ['rgb(236,231,242)','rgb(166,189,219)','rgb(43,140,190)'];
      var blue5 = ['rgb(241,238,246)','rgb(189,201,225)','rgb(116,169,207)','rgb(43,140,190)','rgb(4,90,141)'];
      var colorScale = d3.scaleQuantile();
        
      // define number formatting
      var dec1 = d3.format('.1%');
      var dec2 = d3.format('.2%');
      var money = function(num) { return d3.format('$.0f')(num/1000) + 'k'; };

      // define the legend
      var legend = d3.select('.legend').attr('height', '50px');

      // define button behavior
      $('.btn-group .btn').click(function() {
        $(this).addClass('active');
        $(this).siblings().removeClass('active');
      });
        
      $('.char-btn-group .btn').click(function() {
        goToIndicator($(this).attr('reference'));
      });
      $('.race-btn-group .btn, .education-btn-group .btn').click(function() {
        color($(this).attr('reference'));
      });

      var ready = function(error, dc, data) {     
        // draw topojson paths on map
        svg.selectAll('path')
          .data(topojson.feature(dc, dc.objects.bgs).features)
          .enter().append('path')
            .attr('class', 'block-group')
            .attr('d', path);
        
        // collect data into object by id
        for (var i = 0; i < data.length; i++) dataById[data[i].geoid] = data[i];
        
        // color with default attribute
        goToIndicator($('.char-btn-group .btn.active').attr('reference'));
      };
      
      var color = function(attr) {
        // set domain of coloring scale
        var domain = [];
        svg.selectAll('path').each(function(d) {
          domain.push(getValue(dataById[d.id], attr, d));
        });
        colorScale.domain(domain).range(blue5);
        
        // check if more than one quantile is 0, then change to less colors
        var quantiles = colorScale.quantiles();
        if (quantiles[0] === 0) {
          colorScale.range(blue3);
          updateLegend(blue3);
        } else {
          updateLegend(blue5);
        }
        
        // color block groups
        svg.selectAll('path').transition()
          .style('fill', function(d) {
            return colorScale(getValue(dataById[d.id], attr, d)); 
          });

        // adjust legend
        quantiles = colorScale.quantiles();
        legend.selectAll('text')
          .html(function(d, i) {
            if (i < quantiles.length) {
              if (attr === 'income') return money(quantiles[i]);
              else if (attr === 'asian' || attr === 'associates' || attr === 'prof' || attr === 'phd') return dec2(quantiles[i]);
              else return dec1(quantiles[i]);
            }
          });
      };
      
      var updateLegend = function(range) {
        var legend = d3.select('.legend')
          .attr('width', (50 * range.length) + 'px');
        var legendBars = legend.selectAll('g')
          .data(range);
        var newBars = legendBars.enter().append('g')
          .attr('transform', function(d, i) { return 'translate('+ 50*i + ',0)'; });
        newBars.append('rect')
          .attr('height', '15px')
          .attr('width', '50px');
        newBars.append('text')
          .attr('class', 'legend-text')
          .attr('x', '50px')
          .attr('y', '29px')
          .style('text-anchor', 'middle');
        legendBars = legendBars.merge(newBars);
        legendBars.each(function(d) {
          d3.select(this).select('rect').attr('fill', d);
        });
        legendBars.exit().remove();
      };
      
      var goToIndicator = function(ref) {
        if (ref === 'race') {
          $('.race-btn-group').css('display', 'inline-block');
          color($('.race-btn-group .btn.active').attr('reference'));      
        } else $('.race-btn-group').hide();
        
        if (ref === 'education') {
          $('.education-btn-group').css('display', 'inline-block');
          color($('.education-btn-group .btn.active').attr('reference'));     
        } else $('.education-btn-group').hide();
        
        if (ref !== 'race' && ref !== 'education') color(ref);    
      };
      
      var getValue = function(d, attr, ele) {
        if (attr === 'white' || attr === 'black' || attr === 'asian' || attr === 'hispanic') return d[attr] / d.pop;
        else return d[attr];
      };

      const [dc, data] = await Promise.all([
        d3.json('/data/dc.json'),
        d3.tsv('/data/dc_indicators.tsv'),
      ]);
      ready(null, dc, data);
    },
  },
};
</script>

<style lang="scss">
@import '~@/styles/legacy/bootstrap-partial.css';

.dc-demographics-chart-container {
  .block-group {
    fill: transparent;
    stroke: #c0c0c0;
    stroke-width: 1;
  }
  .race-btn-group,
  .education-btn-group {
    margin-top: 10px;
  }
  .education-btn-group { display: none; }
  .legend rect {
    stroke: #777;
    stroke-width: 0.5;
  }
  .legend text {
    font-size: 12px;
  }
}
</style>
