<template>
  <Post v-bind="info">
    <template v-slot:description>
      <p>
        With March Madness in full swing, my friend, Scott, was sharing to me how he had put money down on an office pool "squares" game. Each square represents the last digit of a winning and losing teams' scores in a given outcome of a game. So there's a possibility of 100 outcomes that can be represented in a 10x10 grid and each bettor is assigned a random square within that grid.
      </p>
      <p>
        My first reaction was to think that surely all squares are not equal. The (3,3) square Scott was assigned had to have a below average outcome since the winning team would have to win by a multiple of 10, meaning any close games would probably not meet that criteria. In fact, I would think that any doubles would be below average in this scenario. Even though the squares were randomly assigned, it would be interesting to see which squares were landed on the most.
      </p>
      <p>
        Below, I've compiled scores from all March Madness games from 1985-2021 to see how each square fares based on historical data. The first number is the winning score, the second the losing score.
      </p>
    </template>
    <div class="score-grid-chart-container">
      <svg
        :width="this.squareWidth * 10 + 10"
        :height="this.squareHeight * 10 + 50"
        class="score-grid-madness"
      >
        <g/>
      </svg>
      <div class="source">
        Source: The Washington Post
      </div>
    </div>
    <div class="score-grid-description">
      <p>
        It looks like there is a band of red spanning diagonally where the doubles are, which is as expected. There's also an increase where the winning number is slightly higher than the losing number, e.g. 2,0 and 3,1. This must represent games that are close and won by only a few points.
      </p>
      <p>
        Now, the college basketball dataset was pretty limited and only had 2,000 games. I wanted to extend this to the NBA where the dataset was larger, out of curiosity. I compiled NBA games from 2004-2020 for a total of 27,000 games and built a heat map.
      </p>
    </div>
    <div class="score-grid-chart-container">
      <svg
        :width="this.squareWidth * 10 + 10"
        :height="this.squareHeight * 10 + 50"
        class="score-grid-nba"
      >
        <g/>
      </svg>
      <div class="source">
        Source: stats.nba.com
      </div>
    </div>
    <div class="score-grid-description">
      <p>
        With the NBA data, we can see the true pattern emerge. There's a clear dip in doubles. There's a clear increase when the winning score is 1 or 2 above the losing score.
      </p>
      <p>
        Now this game is most popular during the Super Bowl and football is vastly different than basketball since scoring is few and are in multiples of 3 and 7 most typically. Since there are such few Super Bowl games, the dataset there would not be large enough, so I decided to try this with NFL games. I would have loved to do this for the scores for each quarter since that is popular, but I couldn't find the dataset for it. So these are just for final scores.
      </p>
    </div>
    <div class="score-grid-chart-container">
      <svg
        :width="this.squareWidth * 10 + 10"
        :height="this.squareHeight * 10 + 50"
        class="score-grid-nfl"
      >
        <g/>
      </svg>
      <div class="source">
        Source: github.com/fivethirtyeight/nfl-elo-game
      </div>
    </div>
    <div class="score-grid-description">
      <p>
        The NFL has some clear winner and loser squares here. I'm too lazy so I'll leave it as an exercise to the reader to make sense of the grid! 
      </p>
    </div>
  </Post>
</template>

<script>
import * as d3 from 'd3';
import Post from '@/components/Post.vue';
import visualizations from '@/constants/VisualizationsList';

// chart dimensions
const width = 750;
const height = 300;
const margin = {
  top: 10,
  right: 30,
  bottom: 20,
  left: 60,
};

export default {
  name: 'ScoreGrid',
  components: {
    Post,
  },
  data: () => ({
    info: visualizations.find(v => v.url === 'squares'),
    squareHeight: 40,
    squareWidth: 40,
  }),

  async mounted() {
    [this.madnessData, this.nbaData, this.nflData] = await Promise.all([
      d3.csv('./data/madness_data.csv'),
      d3.csv('./data/nba_games.csv'),
      d3.csv('./data/nfl_games.csv'),
    ]);
    const scoreCountsMadness = this.getScoreCountsMadness(this.madnessData);
    const scoreCountsNba = this.getScoreCountsNba(this.nbaData);
    const scoreCountsNfl = this.getScoreCountsNfl(this.nflData);

    this.updateChart('.score-grid-madness', scoreCountsMadness, { title: 'March Madness Games (1985-2021)' });
    this.updateChart('.score-grid-nba', scoreCountsNba, { title: 'NBA Games (2004-2020)' });
    this.updateChart('.score-grid-nfl', scoreCountsNfl, {
      scale: d3.scaleLinear().domain([0, 0.01, 0.05]).range([0, 0.5, 1]),
      title: 'NFL Games (1920-2021)',
    });
  },

  methods: {
    getScoreCounts(scores) {
      const scoreCounts = {};
      for (let i = 0; i < 10; i += 1) {
        for (let j = 0; j < 10; j += 1) {
          scoreCounts[`${String(i)}${String(j)}`] = 0;
        }
      }
      scores.forEach((scoreArray) => {
        const key = `${scoreArray[0]}${scoreArray[1]}`;
        scoreCounts[key] += 1;
      });
      return scoreCounts;
    },

    getScoreCountsMadness(data) {
      const scores = [];
      data.forEach((game) => {
        const wScore = game.WSCORE;
        const lScore = game.LSCORE;
        if (typeof wScore === 'string' && typeof lScore === 'string') {
          scores.push([wScore.charAt(wScore.length - 1), lScore.charAt(lScore.length - 1)]);
        }
      });
      return this.getScoreCounts(scores);
    },

    getScoreCountsNba(data) {
      const scores = [];
      data.forEach((game) => {
        const wScore = +game.PTS_away > +game.PTS_home ? +game.PTS_away : +game.PTS_home;
        const lScore = +game.PTS_away > +game.PTS_home ? +game.PTS_home : +game.PTS_away;
        if (wScore > 0 && lScore > 0) {
          const wScoreStr = String(wScore);
          const lScoreStr = String(lScore);
          scores.push([wScoreStr.charAt(wScoreStr.length - 1), lScoreStr.charAt(lScoreStr.length - 1)]);
        }
      });
      return this.getScoreCounts(scores);
    },

    getScoreCountsNfl(data) {
      const scores = [];
      data.forEach((game) => {
        const wScore = +game.score1 > +game.score2 ? game.score1 : game.score2;
        const lScore = +game.score1 > +game.score2 ? game.score2 : game.score1;
        if (typeof wScore === 'string' && typeof lScore === 'string') {
          scores.push([wScore.charAt(wScore.length - 1), lScore.charAt(lScore.length - 1)]);
        }
      });
      return this.getScoreCounts(scores);
    },

    updateChart(chartClass, scoreCounts, { scale, title }) {
      const sum = Object.values(scoreCounts).reduce((acc, cur) => acc + cur, 0);
      const scoreCountsArray = Object.keys(scoreCounts).map(scorePair => ({
        count: scoreCounts[scorePair],
        percentage: scoreCounts[scorePair] / sum,
        scorePair,
      }));

      const normalizeScale = scale || d3.scaleLinear()
        .domain([0, 0.02])
        .range([0, 1]);
      const getTextColor = (value) => {
        if (value > 0.8 || value < 0.2) return 'rgba(255,255,255,0.8)';
        return 'black';
      };

      const chart = d3.selectAll(chartClass).select('g');
      chart.append('text')
        .attr('class', 'score-grid-chart-title')
        .attr('x', 5 * this.squareWidth)
        .attr('y', 12)
        .html(title);

      const chartNodes = chart.selectAll('g')
        .data(scoreCountsArray)
        .join('g')
          .attr('transform', d => {
            const x = +d.scorePair.charAt(0) * this.squareWidth;
            const y = 30 + (+d.scorePair.charAt(1) * this.squareHeight);
            return `translate(${x}, ${y})`;
          });
      chartNodes.append('rect')
        .attr('class', 'score-grid-node')
        .attr('width', this.squareWidth)
        .attr('height', this.squareHeight)
        .style('fill', d => d3.interpolateRdBu(normalizeScale(d.percentage)));
      chartNodes.append('text')
        .attr('class', 'score-grid-percentage-text')
        .attr('x', this.squareWidth / 2)
        .attr('y', this.squareHeight - 8)
        .attr('dy', '.35em')
        .style('fill', d => getTextColor(normalizeScale(d.percentage)))
        .html(d => d3.format('.1%')(d.percentage));
      chartNodes.append('text')
        .attr('class', 'score-grid-header')
        .attr('x', this.squareWidth - 2)
        .attr('y', 6)
        .attr('dy', '.35em')
        .style('fill', d => getTextColor(normalizeScale(d.percentage)))
        .html(d => d.scorePair.split('').join(','));
    },
  },
};
</script>

<style lang="scss">
.score-grid-chart-title {
  font-weight: 600;
  text-anchor: middle;
}
.score-grid-node {
  stroke: #fff;
}
.score-grid-header {
  font-size: 9px;
  text-anchor: end;
}
.score-grid-percentage-text {
  font-size: 11px;
  font-weight: 600;
  text-anchor: middle;
}
.source {
  font-size: 0.8em;
  text-align: right;
}
.score-grid-description {
  margin: 30px 0 40px;
  text-align: left;
}
.score-grid-chart-container {
  text-align: center;
}
</style>
