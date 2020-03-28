<template>
  <Post v-bind="info">
    <template v-slot:description>
      <p>
        Below is a table of the 10 teams that have performed the best and the 10 teams
        that have performed the worst in the NCAA March Madness tournament in the last 30 years.
      </p>
    </template>
    <div class="march-madness-table-wrapper">
      <table class="table table-bordered table-condensed results"></table>
    </div>
    <template v-slot:post-description>
      <div class="march-madness-post-description">
        Teams are ranked by comparing the team's seed number with how far they advanced in the tournament. Teams get a point for every game they win in the tournament, but receive point deductions for being a higher seed. The scoring goes by the following rules:
        <div class="bullet-container">
          <div class="bullet">&bull; 9-16 seeds (-0) are expected to lose in the First Round (+0)</div>
          <div class="bullet">&bull; 5-8 seeds (-1) are expected to get to the Round of 32 (+1)</div>
          <div class="bullet">&bull; 3-4 seeds (-2) are expected to get to the Sweet Sixteen (+2)</div>
          <div class="bullet">&bull; 2 seeds (-3) are expected to get to the Elite Eight (+3)</div>
          <div class="bullet">&bull; 1 seeds (-4) are expected to get to the Final Four (+4)</div>
          <div class="bullet">&bull; No team is expected to get to the National Championship (+5)</div>
          <div class="bullet">&bull; No team is expected to win the National Championship (+6)</div>
        </div>
        Maryland scored 0 and Georgetown scored -6 by the way.
      </div>
    </template>
  </Post>
</template>

<script>
import Post from '@/components/Post.vue';
import * as d3 from 'd3';
import visualizations from '@/constants/VisualizationsList';

export default {
  name: 'MarchMadness',
  components: {
    Post,
  },
  data: () => ({
    info: visualizations.find(v => v.url === 'march-madness'),
  }),
  mounted() {
    this.createVis();
  },
  methods: {
    async createVis() {
      // No team is expected to win the National Championship (6)
      // No team is expected to get to the National Championship (5)
      // 1 seed (-4) is expected to get to the Final Four (4)
      // 2 seed (-3) is expected to get to the Elite Eight (3)
      // 3-4 seed (-2) is expected to get to the Sweet Sixteen (2)
      // 5-8 seed (-1) is expected to get to the Round of 32 (1)
      // 9-16 seed (-0) is expected to get to the First Round (0)
      var scale = d3.scaleThreshold()
        .domain([-20, -10, -6, -3, 3, 6, 10, 20])
        .range(['rgb(215,48,39)','rgb(244,109,67)','rgb(253,174,97)','rgb(254,224,144)','rgb(255,255,191)','rgb(224,243,248)','rgb(171,217,233)','rgb(116,173,209)','rgb(69,117,180)']);

      const data = await d3.tsv('./data/march_madness.tsv');
      var resultsByTeam = {};
      data.forEach(function(d) {
        for (var j = 1; j <= 2; j++) {
          var team = d['TEAM' + j];
          var seed = +d['SEED' + j];
          var round = d['ROUND'];
          var won = d['SCORE' + j] > d['SCORE' + (3-j)];
          if (!won || round === 'National Championship') {
            if (!resultsByTeam.hasOwnProperty(team)) resultsByTeam[team] = [];
            var gameResult = {
              round: round,
              won: won,
              seed: seed,
              points: +d['SCORE' + j]
            };
            var resultScore = -1;
            if (round === 'First Round') resultScore = 0;
            else if (round === 'Second Round') resultScore = 1;
            else if (round === 'Sweet 16') resultScore = 2;
            else if (round === 'Elite Eight') resultScore = 3;
            else if (round === 'Final Four') resultScore = 4;
            else if (round === 'National Championship') resultScore = won ? 6 : 5;
            
            var seedBonus = Math.ceil(Math.log(seed)/Math.log(2)) - 4;
            gameResult.score = resultScore + seedBonus;
            resultsByTeam[team].push(gameResult);
          }
        }
      });

      var teamRanks = [];
      for (var team in resultsByTeam) {
        var totalScore = 0;
        resultsByTeam[team].forEach(function(d) { totalScore += d.score; })
        teamRanks.push({team: team, totalScore: totalScore});
        if (team.indexOf('aryland') !== -1) console.log(totalScore);
      }
      teamRanks.sort(function(a, b) { return b.totalScore - a.totalScore; });
      teamRanks = teamRanks.slice(0, 10).concat(teamRanks.slice(teamRanks.length-10));

      var rows = d3.select('.results').selectAll('tr')
        .data(teamRanks)
        .enter().append('tr');
      rows.append('td').html(function(d) { return d.team; });
      rows.append('td').html(function(d) { return d.totalScore; });
      rows.selectAll('td').style('background-color', function(d) {
        return scale(d.totalScore);
      });
    },
  },
};
</script>

<style lang="scss">
@import '~@/styles/legacy/bootstrap-partial.css';

.march-madness-table-wrapper {
  table {
    border: 0;
    border-collapse: collapse;
    display: inline-block;
    width: auto;
  }
  tr { border-top: 1px solid #555; }
  tr:first-child { border-top: none; }
  tr:nth-child(11) { border-top: 2px solid #555; }
  td {
    padding: 5px 15px;
  }
  td:first-child {
    text-align: left;
    padding-left: 20px;
  }
  td:nth-child(2) {
    text-align: right;
    padding-right: 20px;
  }

  .after-text { margin-top: 20px; }
}

.march-madness-post-description {
  .bullet-container { margin: 5px 0px 10px 0px; }
  .bullet {
    margin-left: 25px;
    padding-top: 5px;
  }
}
</style>
