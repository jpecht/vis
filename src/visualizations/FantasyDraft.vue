<template>
  <Post v-bind="info">
    <template v-slot:description>
      <p>
        This is a collection of data from ESPN's fantasy football leagues.
        Each player is vertically positioned based on their average draft pick.
        The players are colored based on their football position.
        The darker the color, the more often the player is drafted,
        and players that have a gold border have a 100% draft rate.
      </p>
      <p>
        One caveat to this visualization is the random horizontal placement of the players.
        This leads to a different chart each time the page is loaded 
        and therefore can lead to varying subconscious interpretations,
        especially if say, one color decides to randomly cluster together. 
        The most straightforward solution would be to set the location of each player...
        but I kind've enjoy the randomness because it makes it feel more genuine somehow.
      </p>
      <p>
        Another thought I had was to give the option to color each player by their team rather by their position.
        I imagine some teams would appear towards the top more than others.
      </p>
      <p>
        <b>Note:</b>
        <i>The tooltips that appear on hover do not work anymore after porting this vis to Vue.</i>
      </p>
    </template>
    <div class="fantasy-draft-wrapper">
      <svg id="ff-graph"></svg>      
      <div id="ff-source" class="source">
        <p>Note: Auction values are based off of ESPN's $200 starting budget.</p>
        <p>Source: ESPN Free Fantasy Football Live Draft 2014</p>
      </div>
    </div>
  </Post>
</template>

<script>
import Post from '@/components/Post.vue';
import * as d3 from 'd3';
// import $ from 'jquery';
import visualizations from '@/constants/VisualizationsList';

export default {
  name: 'FantasyDraft',
  components: {
    Post,
  },
  data: () => ({
    info: visualizations.find(v => v.url === 'fantasy-draft'),
  }),
  mounted() {
    this.createVis();
  },
  methods: {
    async createVis() {
      var margin = {top: 20, right: 20, bottom: 20, left: 40},
        graph_width = 600 - margin.left - margin.right,
        graph_height = 1200 - margin.top - margin.bottom,
        pick_range = 160,
        max_players = 196;
        
      var y = d3.scaleLinear()
        .domain([0, pick_range])
        .range([0, graph_height]);
      var color = d3.scaleQuantize()
        .domain([0, 100])
        .range(['rgb(247,251,255)','rgb(222,235,247)','rgb(198,219,239)','rgb(158,202,225)','rgb(107,174,214)']);
      var pos_scale = d3.scaleOrdinal()
        .domain(['RB', 'QB', 'WR', 'TE', 'K', 'D/ST'])
        .range(['rgb(31,119,180)','rgb(255,127,14)','rgb(44,160,44)','rgb(214,39,40)','rgb(148,103,189)','rgb(140,86,75)']);
      var op_scale = d3.scaleLinear()
        .domain([0, 100])
        .range([0.2, 0.8]);
      
      var yAxis = d3.axisLeft()
        .scale(y)
        .tickValues([0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160]);
      
      var chart = d3.select('#ff-graph')  
        .style('height', graph_height + margin.top + margin.bottom + 'px')
        .style('width', graph_width + margin.left + margin.right + 'px')
        .append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
      
      chart.append('g')
        .attr('class', 'y axis')
        .call(yAxis);
        
      for (var i = 1; i <= pick_range; i++) {
        chart.append('line')
          .attr('class', 'axis-guide')
          .attr('x1', 1)
          .attr('y1', i*graph_height/pick_range)
          .attr('x2', graph_width)
          .attr('y2', i*graph_height/pick_range);
      }
          
      var position_array = [];    
      
      let data = await d3.tsv('./data/ff_draft.tsv');
      if (data.length > max_players) data = data.slice(0, max_players);
      
      var player = chart.selectAll('.player')
        .data(data)
        .enter().append('g')
          .attr('class', 'player')
          .attr('data-tooltip', function(d) {
            return '<strong>' + d.player + ', ' + d.pos + ' (' + d.team + ')</strong><br>Avg Pick: ' + d.pick + '<br>Avg Auction Value: $' + d.value + '<br>Ownership: ' + d.own + '%';
          })
          .attr('transform', function(d) {
            var y_pos = y(d.pick) + 20;       
            
            // avoid overlap
            if (position_array.length > 0) {
              var num_tries = 0;
              var overlap = false;
              while (!overlap) {
                overlap = true;
                var x_pos = 30 + (graph_width - 60) * Math.random();
                for (var i = position_array.length - 1; i >= 0; i--) {
                  if (y_pos - position_array[i].y >= 40) break;
                  if (Math.abs(x_pos - position_array[i].x) < 40) {
                    overlap = false;
                    break;
                  }
                }
                num_tries++;
                if (num_tries >= 100) break;
              }
            } else var x_pos = 30 + (graph_width - 60) * Math.random();
            
            position_array.push({x: x_pos, y: y_pos});
                  
            return 'translate(' + x_pos + ',' + y_pos + ')'; 
          });
        
      player.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 20)
        .attr('stroke', '#FFD700')
        .attr('stroke-width', function(d) { return (+d.own == 100) ? '2px' : '0px'; })
        .attr('fill', function(d) {
          //return (+d.own == 100) ? 'rgb(66,146,198)' : color(d.own);
          var rgb = pos_scale(d.pos);
          var opacity = op_scale(d.own);
          return 'rgba' + rgb.substring(3, rgb.length-1) + ',' + opacity + ')';
        });
      
      player.append('text')
        .attr('class', 'player-text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('dy', '.35em')
        .attr('text-anchor', 'middle')
        .style('cursor', 'pointer')
        //.style('opacity', function(d) { return op_scale(d.own); })
        .attr('fill', function(d) { return (+d.own == 100) ? 'white' : 'black'; })
        .text(function(d) { return d.initials; })
        .on('mouseover', function() {
          d3.select(this.parentNode).select('circle').transition().attr('r', 25);
        })
        .on('mouseout', function() {
          d3.select(this.parentNode).select('circle').transition().attr('r', 20);
        });
    },
  },
};
</script>

<style lang="scss">
@import '~@/styles/legacy/bootstrap-partial.css';

.fantasy-draft-wrapper {
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
