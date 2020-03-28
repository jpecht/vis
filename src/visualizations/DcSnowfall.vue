<template>
  <Post v-bind="info">
    <template v-slot:description>
      <p>
        In Washington, DC, it snows. Lots of snow? or no snow? =/ A look over the years...
      </p>
    </template>
    <div class="dc-snowfall-chart-container">
      <svg class="snowfall-chart snowfall-chart-month"></svg>
      <svg class="legend legend-month"></svg>
      <div class="snowfall-info"></div>
    </div>
  </Post>
</template>

<script>
import Post from '@/components/Post.vue';
import * as d3 from 'd3';
import visualizations from '@/constants/VisualizationsList';

export default {
  name: 'DcSnowfall',
  components: {
    Post,
  },
  data: () => ({
    info: visualizations.find(v => v.url === 'dc-snowfall'),
  }),
  mounted() {
    this.createVis();
  },
  methods: {
    async createVis() {
      var square_height = 10;
      var years_per_row = 40;
      var num_rows = 3;
      var months = ['nov', 'dec', 'jan', 'feb', 'mar'];
      var year_height = square_height * months.length + 35;

      var chart = d3.select('.snowfall-chart')
        .attr('height', num_rows * year_height);

      var scale = d3.scaleThreshold()
        .domain([2, 4, 6, 8])
        .range(['rgb(241,238,246)','rgb(189,201,225)','rgb(116,169,207)','rgb(43,140,190)','rgb(4,90,141)']);

      var dec1format = d3.format('.1f');

      var pos_by_year = function(i) {
        var x_trans = 25 + ((i - 6) % years_per_row) * square_height;
        var y_trans = Math.floor((i - 6) / years_per_row) * year_height + 15;
        return [x_trans, y_trans];
      };

      const data = await d3.tsv('./data/dc_snowfall.tsv');
      var default_data = data[data.length - 1]
      var default_time = '<span class="snowfall-time">' + default_data.year + ' Snowfall</span>';
      var default_val = '<span class="snowfall-val">' + default_data.season + '"</span>';
      var default_info = default_time + ': ' + default_val;
      default_info = '&nbsp;';
      d3.select('.snowfall-info').html(default_info);

      // month title for all three rows (set number of rows)
      for (var i = 0; i < num_rows; i++) {
        chart.append('g')
          .attr('class', 'month-labels')
          .attr('transform', 'translate(0, ' + (year_height * i + 23) + ')');
      }

      // year labels
      var year_labels = chart.selectAll('.year-label')
        .data(data)
        .enter().append('g')
          .attr('class', 'year-labels')
          .attr('transform', function(d, i) {
            var x_trans = pos_by_year(i)[0] + square_height/2;
            var y_trans = pos_by_year(i)[1] - 8;
            return 'translate(' + x_trans + ', ' + y_trans + ')';
          });
      year_labels.append('text')
        .html(function(d) {
          var start_year = parseInt(d.year.substr(0, 4));
          return (start_year % 10 === 0) ? start_year : '';
        });
      year_labels.append('line')
        .attr('x0', 0)
        .attr('x1', 0)
        .attr('y1', 3)
        .attr('y2', 5)
        .attr('stroke', '#333')
        .style('display', function(d, i) {
          var start_year = parseInt(d.year.substr(0, 4));
          return (start_year % 10 === 0) ? 'block' : 'none';
        });

      // group for every year
      var square_group = chart.selectAll('.data-year')
        .data(data)
        .enter().append('g')
          .attr('class', 'data-year')
          .attr('transform', function(d, i) {
            var position = pos_by_year(i);
            return 'translate(' + position[0] + ', ' + position[1] + ')';
          });

      for (var k = 0; k < months.length; k++) {
        // each monthly snowfall data square
        square_group.append('rect')
          .datum(function(d) {
            return {
              month: months[k].charAt(0).toUpperCase() + months[k].substr(1),
              year: (k <= 1) ? d.year.substr(0, 4) : d.year.substr(0, 2) + d.year.substr(5, 2),
              val: d[months[k]]
            };
          })
          .attr('y', k * square_height)
          .attr('width', square_height)
          .attr('height', square_height)
          .attr('fill', function(d) { return scale(d.val); })
          .on('mouseover', function(d) {
            var time = '<span class="snowfall-time">' + d.month + ' ' + d.year + ' Snowfall</span>';
            var val = '<span class="snowfall-val">' + dec1format(d.val) + '"</span>';
            d3.select('.snowfall-info').html(time + ': ' + val);
          })
          .on('mouseout', function() {
            d3.select('.snowfall-info').html(default_info);
          });

        // each month label
        chart.selectAll('.month-labels').append('text')
          .attr('y', square_height * k)
          .html(months[k]);
      }

      // create legend
      var rect_width = 10, rect_height = 30;
      var legend = d3.select('.legend')
        .attr('height', rect_height * 6)
        .attr('width', rect_width + 30);
      var legend_colors = legend.selectAll('g')
        .data(scale.range())
        .enter().append('g')
          .attr('transform', function(d, i) {
            return 'translate(0, ' + (rect_height*i + 10) + ')';
          });
      legend_colors.append('rect')
        .attr('width', rect_width)
        .attr('height', rect_height)
        .attr('fill', function(d) { return d; });
      legend_colors.append('text')
        .attr('class', 'legend-text')
        .attr('x', rect_width + 5)
        .attr('y', 1)
        .html(function(d, i) {
          return (i == 0) ? '0.0"' : dec1format(scale.domain()[i-1]) + '"';
        });
    },
  },
};
</script>

<style lang="scss">
@import '~@/styles/legacy/bootstrap-partial.css';

.dc-snowfall-chart-container {
  .snowfall-chart {
    width: 450px;
  }
  .month-labels text {
    font-size: 9px;
    width: 25px;
  }
  .year-labels text {
    text-anchor: middle;
    font-size: 9px;
  }
  .data-year rect {
    stroke: #E0E0E0;
  }
  .legend {
    text-align: center;
  }
  .legend rect {
    stroke: #AAA;
  }
  .legend text {
    alignment-baseline: middle;
    font-size: 11px;
  }

  .snowfall-info {
    font-size: 12px;
  }
  .snowfall-time {
  }
  .snowfall-val {
    font-weight: 400;
  }
  .chart-buttons {
    margin-top: 10px;
  }
}
</style>
