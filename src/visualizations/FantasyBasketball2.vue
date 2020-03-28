<template>
  <Post v-bind="info">
    <template v-slot:description>
      <p>
        So for the 2016-2017 season, I decided to a repeat of an analysis I did two years ago
        (mostly because I'm in a league this season =P).
      </p>
      <p>
        It's a list of the NBA players ranked by how well they performed in the 8 categories used for fantasy basketball.
        Players are ranked in each category relative to how well they perform among their peers.
        This makes sense because in fantasy basketball, you want to pick players that not only score points,
        but perform well in every category.
      </p>
      <p>
        The number shown for each player represents the sum of that player's Z-value
        for each category using a normal distribution.
        The pool used were the top 200 players in fantasy points last season.
        Also, the turnover category was omitted this season.
      </p>
      <p>
        <span style="font-weight:400">
          So, a <span style="color:rgb(33,102,172);">positive</span>
          score indicates above average performance, while a
          <span style="color:rgb(178,24,43);">negative</span>
          score indicates below average performance.
        </span>
      </p>
    </template>
    <div
      class="bball-ranks-2-table"
      ref="table"
    />
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
      const table = d3.select(this.$refs.table).append('table')
        .attr('class', 'table');
      
      // table header
      const columns = ['#', 'Player', 'Score', 'FG%', 'FT%', '3PM', 'PTS', 'REB', 'AST', 'ST', 'BLK'];
      const header_row = table.append('tr')
        .attr('class', 'header-row')
        .selectAll('td')
          .data(columns)
          .enter().append('td')
            .attr('class', 'header-cell')
            .classed('player-cell', function(d, i) { return (i === 1); })
            .html(function(d) { return d; });
          
      // define thresholds and coloring system
      const thresholds = [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5];
      const color_classes = ['color-red-3', 'color-red-2', 'color-red-1', 'color-neutral', 'color-blue-1', 'color-blue-2', 'color-blue-3'];
      const color_by_threshold = function(stat) {
        for (let i = 0; i < thresholds.length; i++) {
          if (stat < thresholds[i]) return color_classes[i];
        }
        return color_classes[thresholds.length];
      };
      
      // define number formatting
      const dec2format = d3.format('.2f');
      
      // grab data and draw!
      let data = await d3.tsv('./data/bball_ranks_2016.tsv');
      data.sort(function(a, b) { return b.Score_Q - a.Score_Q; });
      data = data
        .filter(function(d) { return d.Player; })
        .slice(0, 100);
          
      const rows = table.selectAll('tr:not(.header-row)')
        .data(data)
        .enter().append('tr');
      rows.append('td').html(function(d, i) { return i + 1; });
      rows.append('td').html(function(d) { return d.Player; })
        .attr('class', 'player-cell');
      
      for (let j = 2; j < columns.length; j++) {
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

.bball-ranks-2-table {
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
