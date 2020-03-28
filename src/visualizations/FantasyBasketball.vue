<template>
  <Post v-bind="info">
    <template v-slot:description>
      <p>
        Fantasy basketball scoring has always struck me as odd.
        Instead of scoring based off points, nine categories are totaled over an entire week 
        and the team that wins the most categories wins for the week.
        So the players that can score well off each of these nine categories are the most valuable. 
        Players like Kobe, who averages more than five turnovers a game, could kill your team in the turnover category.
      </p>
      <p>
        So below I present a ranking system that shows which players were the most
        valuable during the 2013-2014 season... a slight indication for the upcoming season, but 
        obviously doesn't take into account things like players moving teams or KD getting injured.
      </p>
      <p>
        The main scoring column is calculated by taking the sum of the Z-scores
        for each stat out of the top 200 players using a normal distribution. 
        <span style="font-weight:400">
          So, a <span style="color:rgb(33,102,172);">positive</span> score indicates above average performance, 
          while a <span style="color:rgb(178,24,43);">negative</span> score indicates below average performance.
        </span>
        As you can see, poor Kobe doesn't even break the top 100 (he ranks at 194).
      </p>
    </template>
    <div class="fantasy-bball-table-wrapper" />
  </Post>
</template>

<script>
import Post from '@/components/Post.vue';
import * as d3 from 'd3';
import visualizations from '@/constants/VisualizationsList';

export default {
  name: 'FantasyBasketball2',
  components: {
    Post,
  },
  data: () => ({
    info: visualizations.find(v => v.url === 'bball-ranks-2'),
  }),
  mounted() {
    this.createVis();
  },
  methods: {
    async createVis() {
      var table = d3.select('.fantasy-bball-table-wrapper').append('table')
        .attr('class', 'table table-striped table-bordered table-condensed table-hover');
      
      // table header
      var columns = ['#', 'Player', 'Score', 'FG%', 'FT%', '3PM', 'PTS', 'REB', 'AST', 'ST', 'BLK', 'TO'];
      var header_row = table.append('tr')
        .attr('class', 'header-row')
        .selectAll('td')
          .data(columns)
          .enter().append('td')
            .attr('class', 'header-cell')
            .classed('player-cell', function(d, i) { return (i === 1); })
            .html(function(d) { return d; });
          
      // define thresholds and coloring system
      var thresholds = [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5];
      var color_classes = ['color-red-3', 'color-red-2', 'color-red-1', 'color-neutral', 'color-blue-1', 'color-blue-2', 'color-blue-3'];
      var color_by_threshold = function(stat) {
        for (var i = 0; i < thresholds.length; i++) {
          if (stat < thresholds[i]) return color_classes[i];
        }
        return color_classes[thresholds.length];
      };
      
      // define number formatting
      var dec2format = d3.format('.2f');
      
      // grab data and draw!
      let data = await d3.tsv('./data/bball_ranks.tsv');
      data = data.slice(0, 100);
          
      var rows = table.selectAll('tr:not(.header-row)')
        .data(data)
        .enter().append('tr');
      rows.append('td').html(function(d, i) { return i + 1; });
      rows.append('td').html(function(d) { return d.Player; })
        .attr('class', 'player-cell');
      
      for (var j = 2; j < columns.length; j++) {
        rows.append('td')
          .html(function(d) {
            return dec2format(d[columns[j] + '_Q']);
          })
          .attr('class', function(d) {
            if (j !== 2) return color_by_threshold(d[columns[j] + '_Q']);
          })
          .classed('score-cell', function() { return (j === 2); });
      }
    },
  },
};
</script>

<style lang="scss">
@import '~@/styles/legacy/bootstrap-partial.css';

.fantasy-bball-table-wrapper {
  table {
    border-collapse: collapse;
    border-spacing: 0;
  }

  td { text-align: center; }

  .header-cell {
    font-weight: 600; 
  }
  .player-cell {
    text-align: left;
    padding-left: 15px;
  }
  .score-cell {
    border-right: 1px solid #ddd;
  }

  .color-red-3 { background-color: rgb(214,96,77); }
  .color-red-2 { background-color: rgb(244,165,130); }
  .color-red-1 { background-color: rgb(253,219,199); }
  .color-neutral { background-color: rgb(247,247,247); }
  .color-blue-1 { background-color: rgb(209,229,240); }
  .color-blue-2 { background-color: rgb(146,197,222); }
  .color-blue-3 { background-color: rgb(67,147,195); }
}
</style>
