<template>
  <Post v-bind="info">
    <template v-slot:description>
      <p>
        The chart is divided into three graphics based on the type of network the TV show airs on.
        The amount of views seem to depend a lot on the type of network,
        because of the subscription fees a person has to pay to be able to watch it.
      </p>
      <p>
        Interesting to see the consistent dip after the season opener and the spike for the season finale.
      </p>
    </template>
    <div class="tv-show-viewership-wrapper">
      <svg class="chart"></svg>
      <div class="btn-group">
        <button type="button" class="btn btn-default" name="local">Local</button>
        <button type="button" class="btn btn-default" name="basic">Basic</button>
        <button type="button" class="btn btn-default active" name="premium">Premium</button>
      </div>
    </div>
  </Post>
</template>

<script>
import Post from '@/components/Post.vue';
import * as d3 from 'd3';
import visualizations from '@/constants/VisualizationsList';

export default {
  name: 'TvShowViewership',
  components: {
    Post,
  },
  data: () => ({
    info: visualizations.find(v => v.url === 'tv-show-viewership'),
  }),
  mounted() {
    this.createVis();
  },
  methods: {
    async createVis() {
      d3.selectAll('.btn').on('click', function() {
        var showType = d3.select(this).attr('name');
        svg.defineScale(showType);
        d3.selectAll('.chart-group').classed('hidden', function() {
          return d3.select(this).attr('name') !== showType;
        });
        d3.selectAll('.btn').classed('active', function() {
          return d3.select(this).attr('name') === showType;
        });
      });

      // chart drawing
      var margin = {top: 20, right: 20, bottom: 20, left: 50};

      var width = 650 - margin.left - margin.right,
        height = 350 - margin.top - margin.bottom;

      var svg = d3.select('.chart')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      var parseDate = d3.timeParse('%m/%d/%y');

      var x = d3.scaleTime()
        .domain([parseDate('3/1/10'), parseDate('10/1/14')])
        .range([0, width]);
      var y = d3.scaleLinear()
        .range([height, 0]);

      var xAxis = d3.axisBottom().scale(x)
        .tickFormat((date) => {
          return d3.timeYear(date) < date
            ? d3.timeFormat('%b')(date)
            : d3.timeFormat('%Y')(date);
        });
        /* .tickFormat(d3.timeFormat.multi([
          ["%b", function(d) { return d.getMonth(); }],
          ["%Y", function() { return true; }]
        ])); */
      var yAxis = d3.axisLeft().scale(y);

      svg.append('text')
        .attr('class', 'label')
        .attr('transform', 'translate(-30, 205), rotate(-90)')
        .text('millions of viewers');

      var line = d3.line()
        .x(function(d) { return x(parseDate(d.air_date)); })
        .y(function(d) { return y(+d.viewers); });


      const data = await d3.tsv('./data/tv_shows.tsv');

      // define axes
      var x_axis_g = svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis)
        .selectAll('text');
      var y_axis_g = svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis);


      // aggregate data; separate into line data and point data
      var pointData = {local: [], basic: [], premium: []},
        lineData = {local: [], basic: [], premium: []};
      for (var i = 0; i < data.length; i++) {
        pointData[data[i].network_type].push(data[i]);

        var dataByShow = lineData[data[i].network_type];
        if (dataByShow.length === 0) dataByShow.push([]);
        else {
          // treat as another part of season if air dates more than a month apart
          var days_apart = (parseDate(data[i].air_date) - parseDate(data[i-1].air_date))/86400000;
          if (data[i].show !== data[i-1].show || data[i].season !== data[i-1].season || days_apart > 30) {
            dataByShow.push([]);
          }
        }
        dataByShow[dataByShow.length - 1].push(data[i]);      
      }

      svg.defineScale = function(type) {
        y.domain([0, d3.max(pointData[type], function(d) { return +d.viewers; })]);
        y.nice();
        y_axis_g.call(yAxis);
      };

      for (var type in pointData) {
        var colors = d3.scaleOrdinal(d3.schemeCategory10);
        
        svg.defineScale(type);
        var chartGroup = svg.append('g')
          .attr('class', 'chart-group')
          .attr('name', type)
          .classed('hidden', function() {
            return d3.select('.btn.active').attr('name') !== type;
          });

        // scatterplot
        chartGroup.selectAll('circle')
          .data(pointData[type])
          .enter().append('circle')
            .attr('class', 'point')
            .attr('r', 3)
            .attr('cx', function(d) { return x(parseDate(d.air_date)); })
            .attr('cy', function(d) { return y(d.viewers); })
            .style('fill', function(d) { return colors(d.show + ', ' + d.network); });

        // lines connecting points
        chartGroup.selectAll('path')
          .data(lineData[type])
          .enter().append('path')
            .attr('class', 'line')
            .attr('d', line)
            .style('stroke', function(d) { return colors(d[0].show + ', ' + d[0].network); });


        // add legend
        var legend = chartGroup.append('g')
          .attr('class', 'legend')
          .attr('transform', 'translate(30, 10)');
        var legendRow = legend.selectAll('g')
          .data(colors.domain())
          .enter().append('g')
            .attr('transform', function(d, i) {
              return 'translate(0,' + 15*i + ')';
            });
        legendRow.append('circle')
          .attr('r', 4)
          .style('fill', function(d) { return colors(d); });
        legendRow.append('text')
          .attr('x', 10)
          .attr('y', 4)
          .text(function(d) { return d; });
      }

      // define scale for active network type
      svg.defineScale(d3.select('.btn.active').attr('name'));
    },
  },
};
</script>

<style lang="scss">
@import '~@/styles/legacy/bootstrap-partial.css';

.tv-show-viewership-wrapper {
  .chart {
    font-size: 16px;
  }

  .axis path,
  .axis line {
    fill: none;
    stroke: black;
    shape-rendering: crispEdges;
  }

  .axis text {
    font-size: 11px;
  }

  .label {
    font-size: 12px;
  }

  .line {
    fill: none;
    stroke-width: 1.5px;
  }

  .legend text {
    font-size: 12px;
    font-weight: 400;
  }

  .btn-group {
    margin-top: 20px;
  }

  .source {
    margin: 25px 0px 0px 0px;
    font-size: 12px;
  }

  .hidden {
    display: none;
  }
}
</style>
