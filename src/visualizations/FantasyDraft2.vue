<template>
  <Post v-bind="info">
    <template v-slot:description>
      <p>
        This chart was inspired by
        <a
          href="//www.rosterbait.com"
          rel="noopener"
          target="_blank"
        >roster bait</a>.
        It visualizes the difference between a player's draft order pick and ESPN's average draft order pick.
        Blue picks are late picks, while red picks are early picks ("reaches").
      </p>
    </template>
    <div class="fantasy-draft-2-wrapper">
      <div id="ff-table-wrapper">
        <table id="ff-table"></table>
      </div>                  
      <div id="ff-2-legend" class="legend">
        <svg width="450" height="40"></svg>
      </div>
      <div id="ff-2-source" class="source">Source: ESPN Free Fantasy Football Live Draft 2014</div>
    </div>
  </Post>
</template>

<script>
import Post from '@/components/Post.vue';
import * as d3 from 'd3';
import visualizations from '@/constants/VisualizationsList';

export default {
  name: 'FantasyDraft2',
  components: {
    Post,
  },
  data: () => ({
    info: visualizations.find(v => v.url === 'fantasy-draft-2'),
  }),
  mounted() {
    this.createVis();
  },
  methods: {
    async createVis() {
      var scale = d3.scaleThreshold()
        .domain([-20, -10, -5, -2, 2, 5, 10, 20])
        .range(['rgb(178,24,43)','rgb(214,96,77)','rgb(244,165,130)','rgb(253,219,199)','rgb(247,247,247)','rgb(209,229,240)','rgb(146,197,222)','rgb(67,147,195)','rgb(33,102,172)']);
      var tt_scale = d3.scaleThreshold()
        .domain([-10, -5, -2, 2, 5, 10])
        .range(['rgb(214,96,77)','rgb(244,165,130)','rgb(253,219,199)','rgb(247,247,247)','rgb(209,229,240)','rgb(146,197,222)','rgb(67,147,195)']);
        
      const data = await d3.tsv('./data/ff_draft_league.tsv');
        
      var diff_array = [];
      for (var i = 0; i < data.length; i++) diff_array.push(+data[i].diff);
    
      // build table headers
      var header_row = d3.select('#ff-table').append('tr');
      for (var j = 0; j < 11; j++) {
        header_row.append('td')
          .attr('class', 'cell')
          .html(function() {
            return (j === 0) ? '#' : data[j-1].fantasy;
          });
      }   
      
      // build player cells
      for (var i = 0; i < 16; i++) {
        var row = d3.select('#ff-table').append('tr');
        for (var j = 0; j < 10; j++) {
          var player_cell = (i % 2 === 0) ? row.append('td') : row.insert('td', ':first-child');
          player_cell
            .datum(data[10*i + j])
            .attr('class', 'player cell tooltip-multiline')
            .attr('data-tooltip', function(d) {
              return '' + d.player + ', ' + d.pos + ' (' + d.team + ')\nPicked: ' + d.pick + '<br>Avg Pick: ' + d.avg + '<br>Diff: <span style="color:'+ tt_scale(d.diff) +';">' + d.diff + '</span>';
            })
            .style('cursor', 'default')
            .style('background-color', function(d) {
              return scale(d.diff);
            })
            .html(function(d) {
              return d.player + '<br>' + d.team + ' - ' + d.pos;
            });
        }
        var number_cell = row.insert('td', ':first-child')
          .attr('class', 'cell')
          .html(i+1);
      }
      
      // build legend
      var legend = d3.select('#ff-2-legend svg');
      var legend_bar = legend.selectAll('g')
        .data(scale.range())
        .enter().append('g')
          .attr('transform', function(d, i) { return 'translate('+ 50*i + ',0)'; });
        
      legend_bar.append('rect')
        .attr('height', '15px')
        .attr('width', '50px')
        //.attr('stroke-width', '1px')
        //.attr('stroke', '#AAA')
        .attr('fill', function(d, i) {
          return d;
        });
      
      var domain = scale.domain();
      legend_bar.append('text')
        .attr('class', 'legend-text')
        .attr('x', '50px')
        .attr('y', '29px')
        .style('text-anchor', 'middle')
        .text(function(d, i) {
          return domain[i];
        });
    },
  },
};
</script>

<style lang="scss">
@import '~@/styles/legacy/bootstrap-partial.css';

.fantasy-draft-2-wrapper {
  #ff-table {
    border-collapse: collapse;
  }
  .cell {
    font-size: 0.7em;
    border: 1px solid #CCC;
    padding: 2px;
    max-width: 75px;
  }

  #ff-2-legend {
    text-align: center;
    margin-top: 25px;
  }
  .legend-text {
    font-size: 0.9em;
  }

  #ff-2-source { margin-top: 10px; }
}
</style>
