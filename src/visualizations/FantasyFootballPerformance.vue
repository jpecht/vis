<template>
  <Post v-bind="info">
    <template v-slot:description>
      <p>
        As the football season ends, I wanted to measure how well football players performed in ESPN's
        fantasy football league relative to how they were ranked when they were drafted. 
        In short, it's measuring each player's expectations vs. their performance.
      </p>
      <p>
        The format is still in snake draft form and players are placed based on their average draft
        pick rank.
        <span style="font-weight:400">
          A <span style="color:rgb(33,102,172);">blue</span>
          player represents a "sleeper" pick: someone who really exceeded expectations;
          a <span style="color:rgb(178,24,43);">red</span> player represents a "bust":
          someone who did not do as well as expected.
        </span>
        Because some positions score more than others
        by nature (e.g. QBs), the comparisons made are within each player's football position 
        (thank you casey for pointing that out).
      </p>
      <p>
        And...if you were wondering about my fantasy football team, which I know you are, I lost my semi-final
        game, mostly due to Dez Bryant's 3 TD game... but! I thought I did pretty well considering I
        had drafted AP and Ray Rice haha.
      </p>
    </template>
    <div class="fantasy-football-performance-wrapper">
      <div id="ff-table-wrapper">
        <table id="ff-table"></table>
      </div>
                  
      <div id="ff-2-legend" class="legend">
        <svg width="450" height="40"></svg>
      </div>
      <div id="ff-2-source" class="source">Source: ESPN Free Fantasy Football 2014</div>
    </div>
  </Post>
</template>

<script>
import Post from '@/components/Post.vue';
import * as d3 from 'd3';
import visualizations from '@/constants/VisualizationsList';

export default {
  name: 'FantasyFootballPerformance',
  components: {
    Post,
  },
  data: () => ({
    info: visualizations.find(v => v.url === 'fantasy-football-performance'),
  }),
  mounted() {
    this.createVis();
  },
  methods: {
    async createVis() {
      var scale = d3.scaleThreshold()
        .domain([-50, -20, -5, -2, 2, 5, 10, 20])
        .range(['rgb(178,24,43)','rgb(214,96,77)','rgb(244,165,130)','rgb(253,219,199)','rgb(247,247,247)','rgb(209,229,240)','rgb(146,197,222)','rgb(67,147,195)','rgb(33,102,172)']);
      var tt_scale = d3.scaleThreshold()
        .domain([-50, -25, -5, 5, 25, 50])
        .range(['rgb(214,96,77)','rgb(244,165,130)','rgb(253,219,199)','rgb(247,247,247)','rgb(209,229,240)','rgb(146,197,222)','rgb(67,147,195)']);      
      
      const data = await d3.tsv('./data/ff_performance.tsv');
        
      var diff_array = [];
      for (var i = 0; i < data.length; i++) {
        if (data[i].pos_rank_diff !== 'N/A') {
          data[i].diff_pct = +data[i].pos_rank_diff/(10*+data[i].draft_pos_rank);
          diff_array.push(data[i].diff_pct);
        }
      }

      // build table headers
      var header_row = d3.select('#ff-table').append('tr');
      for (var j = 0; j < 11; j++) {
        header_row.append('td')
          .attr('class', 'cell')
          .html(function() {
            return (j === 0) ? '#' : 'Team ' + j;
          });
      }   
      
      // build player cells
      for (var i = 0; i < 16; i++) {
        var row = d3.select('#ff-table').append('tr');
        for (var j = 0; j < 10; j++) {
          var player_cell = (i % 2 === 0) ? row.append('td') : row.insert('td', ':first-child');
          player_cell
            .datum(data[10*i + j])
            .attr('class', 'player cell')
            .attr('title', function(d) {
              var diff = (d.pos_rank_diff > 0) ? 'up ' + d.pos_rank_diff : 'down ' + Math.abs(d.pos_rank_diff);
              var playerStr = '<strong>' + d.player + ', ' + d.pos + ' (' + d.team + ')</strong>';
              var rankStr = d.pos + ' Final Rank: <span style="color:' + tt_scale(d.pos_rank_diff) + ';">' + d.final_pos_rank + '</span> (' + diff + ')';
              var draftRankStr = d.pos + ' Draft Rank: ' + d.draft_pos_rank;
              var pointsStr = 'Points Scored: ' + d.points;
              return playerStr + '<br>' + rankStr + '<br>' + draftRankStr + '<br>' + pointsStr;
            })
            .style('cursor', 'default')
            .style('background-color', function(d) {
              return scale(d.pos_rank_diff);
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

.fantasy-football-performance-wrapper {
  font-size: 14px;

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
    font-size: 12px;
  }

  #ff-2-source {
    font-size: 11px;
    margin-top: 10px;
    text-align: right;
  }
}
</style>
