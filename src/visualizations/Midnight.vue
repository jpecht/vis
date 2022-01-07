\<template>
  <Post v-bind="info">
    <template v-slot:description>
      <p>
        If you're not familiar with the game, Midnight, it's a simple dice game where you
        roll six dice and try to get the highest total possible. You can re-roll as many
        times as you want, but you must keep at least one dice each time. The kick is that
        you must have a 1 and a 4 at the end to score.
        So the highest possible total is 24: [1, 4, 6, 6, 6, 6].
        Getting a total of 24 is called Midnight and if you're gambling, it means you get
        double the money as well so it's a highly coveted feat.
      </p>
      <p>
        What I was most intrigued in was a strategy that my friend, Casey, posited.
        If you, say, had an opening roll of [1, 4, 2, 2, 2, 2], do you keep both the 1 and the 4 immediately to make sure you qualify?
        Or do you keep just the 1 and re-roll the rest knowing that
        you're likely to get the 4 later and give you an extra round to roll for the 6s?
        Well, since this is a dice game, there are a finite number of outcomes and I thought it
        couldn't be too difficult to make a brute-force simulation and solve this question.
      </p>
      <p>
        My simulation runs through every single possible roll of the dice.
        I was able to verify the results by simulating large amounts of random rolls and making sure the percentages were similar.
      </p>
      <h3 class="midnight-strategy-header">Strategy 1: Hold Sixes</h3>
      <p>
        The first strategy I wanted to test is a very basic strategy and one that most people go with. 
        When rolling dice, take qualifiers (1's and 4's) immediately and also take any 6's that are rolled
        (but leaving as many dice as you need qualifiers).
      </p>
      <p>
        So for example, if you roll [1, 6, 6, 3, 3, 3], you would take [1, 6, 6].
      </p>
      <svg class="spread-chart-sixes" />
      <p>
        So it looks like with this basic strategy, your chances of getting Midnight are about 6.3%.
        You have about a 15% chance of not scoring at all with this strategy and if you do score, you will average
        somewhere around the 19 mark. 
      </p>
      <h3 class="midnight-strategy-header">Strategy 2: Wait for Qualifiers</h3>
      <p>
        Now, I wanted to test a more conservative strategy.
        If you roll [1, 6, 6, 3, 3, 3], you are still missing a qualifier and may not want to take those 6's.
        With this strategy, you will not take any 6's until you have rolled both qualifiers.
        This should theoretically be a safer strategy.
      </p>
      <p>
        So with this same example, if you roll [1, 6, 6, 3, 3, 3], you would just take [1],
        giving you more dice to roll to get that second qualifier.
      </p>
      <svg class="spread-chart-wait-for-qualifiers" />
      <svg class="spread-chart-wait-for-qualifiers-diff" />
      <p>
        As expected, you have a <i>much</i> higher chance of scoring (85% => 95%) with this strategy.
        However, with this more conservative approach, your chances of getting Midnight are lessened by about 2%.
        In the long run though, this seems like a better overall strategy with the median score being almost 2 points higher than the previous strategy.
      </p>
      <h3 class="midnight-strategy-header">Strategy 3: Re-roll Qualifier</h3>
      <p>
        The next strategy is the one I was excited to test.
        This is similar to the first strategy where you take 6s, <i>except</i> that you won't automatically take both qualifiers.
        If you need both qualifiers and you roll both a 1 and a 4,
        you only take one if you still have 3 or more dice to roll after.
      </p>
      <p>
        So for example, if you roll [1, 4, 6, 2, 2, 2], you would just take [1, 6].
        You re-roll the 4 even though you need it to qualify.
        This should theoretically give you more chances to roll 6's with the extra die to roll.
        And hopefully you'll roll the 4 again anyway.
      </p>
      <svg class="spread-chart-reroll-qualifier" />
      <svg class="spread-chart-reroll-qualifier-diff" />
      <p>
        I was surprised by how drastic the percentages change with just a little tweak in strategy.
        Re-rolling the qualifier unsurprisingly highly increases your chances to not score (15% -> 22%).
        However, you do get increased chances in scoring 22 or higher, which could be beneficial if the person before you scored high.
      </p>
      <p>
        In conclusion, it looks like there's no dominant strategy.
        Some strategies will be better than others depending on what you need to score.
        If the person before you scored Midnight, you might consider re-rolling qualifiers.
        If you have to go first, you might just want to get a score on the table and re-roll all dice until you get qualifiers.
      </p>
      <p>
        I hope to build out some more strategies with this code in the future.
        For example, if you roll a [1, 4, 6, 6, 5, 5] on the first roll,
        would you take that 22 immediately instead of re-rolling the 2 5's?
        If you are interested in the code, you can view the
        <a href="//github.com/jpecht/midnight-simnulator">repository on Github here</a>.
        It was written in Node and includes options to use each of the strategies I've outlined above.
      </p>
    </template>
  </Post>
</template>

<script>
import * as d3 from 'd3';
import Post from '@/components/Post.vue';
import visualizations from '@/constants/VisualizationsList';

export default {
  name: 'Midnight',
  components: {
    Post,
  },
  data: () => ({
    info: visualizations.find(v => v.url === 'midnight'),
    spreads: {
      rerollQualifier: {
        0: 0.226,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0.001,
        8: 0.001,
        9: 0.001,
        10: 0.001,
        11: 0.001,
        12: 0.003,
        13: 0.006,
        14: 0.012,
        15: 0.024,
        16: 0.039,
        17: 0.058,
        18: 0.079,
        19: 0.112,
        20: 0.110,
        21: 0.102,
        22: 0.087,
        23: 0.075,
        24: 0.074,
      },
      sixes: {
        0: 0.149,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0.001,
        9: 0.001,
        10: 0.001,
        11: 0.002,
        12: 0.004,
        13: 0.009,
        14: 0.018,
        15: 0.033,
        16: 0.053,
        17: 0.074,
        18: 0.096,
        19: 0.124,
        20: 0.119,
        21: 0.104,
        22: 0.086,
        23: 0.071,
        24: 0.064,
      },
      waitForQualifiers: {
        0: 0.044,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0.001,
        7: 0.001,
        8: 0.001,
        9: 0.001,
        10: 0.001,
        11: 0.003,
        12: 0.006,
        13: 0.013,
        14: 0.025,
        15: 0.045,
        16: 0.069,
        17: 0.095,
        18: 0.118,
        19: 0.142,
        20: 0.131,
        21: 0.113,
        22: 0.09,
        23: 0.066,
        24: 0.046,
      },
    },
  }),
  mounted() {
    const { spreads } = this;
    this.createSpreadChart('.spread-chart-sixes', spreads.sixes, {
      title: 'Midnight Spread - taking sixes'
    });
    this.createSpreadChart('.spread-chart-wait-for-qualifiers', spreads.waitForQualifiers, {
      title: 'Midnight Spread - wait for qualifiers',
    });
    this.createSpreadChartDiff('.spread-chart-wait-for-qualifiers-diff', spreads.sixes, spreads.waitForQualifiers, {
      title: 'Midnight Spread Diff - wait for qualifiers vs. taking only sixes',
    });
    this.createSpreadChart('.spread-chart-reroll-qualifier', spreads.rerollQualifier, {
      title: 'Midnight Spread - reroll qualifier',
    });
    this.createSpreadChartDiff('.spread-chart-reroll-qualifier-diff', spreads.sixes, spreads.rerollQualifier);
  },
  methods: {
    createSpreadChart(elementClass, data, options = {}) {
      const { chart, height, width } = this.initChart(elementClass);

      // Gather data
      const dataArr = [];
      Object.keys(data).forEach((score) => {
        dataArr.push({ score, numGames: data[score] });
      });
      const sum = dataArr.reduce((acc, val) => acc + val.numGames, 0);
      const median = dataArr.reduce((acc, val) => acc + val.numGames * val.score, 0) / sum;
      let mean = -1;
      let rollingnumGames = sum / 2;
      while (rollingnumGames > 0) {
        mean += 1;
        rollingnumGames -= data[mean];
      }

      // Define scales
      const x = d3.scaleLinear()
        .domain([-1, 25])
        .range([0, width]);
      const y = d3.scaleLinear()
        .domain([0, 1.1 * Math.max(...Object.values(data))])
        // .domain([0, 0.25])
        .range([height, 0]);

      const xAxis = d3.axisBottom().scale(x);
      const yAxis = d3.axisLeft().scale(y).tickFormat(d3.format('.0%'));
      chart.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(xAxis);
      chart.append('g')
        .call(yAxis);

      chart.selectAll('.bar')
        .data(dataArr)
        .enter().append('rect')
          .attr('class', 'bar')
          .attr('x', d => x(d.score) - 10)
          .attr('y', d => y(d.numGames))
          .attr('width', 20)
          .attr('height', d => y(0) - y(d.numGames))
          .style('fill', d => d3.interpolateRdBu(0.9 * (1 - d.score / 24)));
      chart.selectAll('.perc-text')
        .data(dataArr)
        .enter().append('text')
          .attr('class', 'perc-text')
          .attr('x', d => x(d.score))
          .attr('y', d => y(d.numGames) - 2)
          .text((d) => {
            const num = d.numGames / sum;
            if (num < 0.003) return '';
            if (num > 0.1) return `${Math.round(100 * num)}%`;
            return `${Math.round(1000 * num) / 10}%`;
          });
      chart.append('text')
        .attr('class', 'stat')
        .attr('x', width - 10)
        .attr('y', 10)
        .text(`Median Score: ${Math.round(10 * median) / 10}`);
      chart.append('text')
        .attr('class', 'stat')
        .attr('x', width - 10)
        .attr('y', 22)
        .text(`Mean Score: ${Math.round(10 * mean) / 10}`);
      if (options.title) {
        chart.append('text')
          .attr('class', 'chart-title')
          .attr('x', width / 2)
          .attr('y', -15)
          .text(options.title);
      }
    },
    createSpreadChartDiff(elementClass, data1, data2) {
      const { chart, height, width } = this.initChart(elementClass);

      // Gather data
      const sum1 = Object.values(data1).reduce((acc, val) => acc + val, 0);
      const sum2 = Object.values(data2).reduce((acc, val) => acc + val, 0);
      const diffData = [];
      for (let i = 0; i <= 24; i += 1) {
        diffData.push({
          score: i,
          percDiff: (data2[i] / sum2) - (data1[i] / sum1),
        });
      }
      const maxValue = Math.max(...diffData.map(d => Math.abs(d.percDiff)));

      const median1 = Object.values(data1).reduce((acc, val, i) => acc + val * i, 0) / sum1;
      const median2 = Object.values(data2).reduce((acc, val, i) => acc + val * i, 0) / sum2;
      const medianDiff = median2 - median1;

      // Define scales
      const x = d3.scaleLinear()
        .domain([-1, 25])
        .range([0, width]);
      const y = d3.scaleLinear()
        .domain([-1.1 * maxValue, 1.1 * maxValue])
        .range([height, 0]);
      const colorScale = d => d3.interpolateCividis(
        d3.scaleLinear().domain([-maxValue, maxValue])(d)
      );

      const xAxis = d3.axisBottom().scale(x);
      const yAxis = d3.axisLeft().scale(y).tickFormat(d3.format('+.1%'));

      chart.selectAll('.bar')
        .data(diffData)
        .enter().append('rect')
          .attr('class', 'bar')
          .attr('x', d => x(d.score) - 10)
          .attr('y', d => (d.percDiff > 0) ? y(d.percDiff) : y(0))
          .attr('width', 20)
          .attr('height', d => (
            (d.percDiff > 0) ? y(0) - y(d.percDiff) : y(d.percDiff) - y(0)
          ))
          .style('fill', (d) => {
            const normalizedVal = d3.scaleLinear().domain([-maxValue, 1.5 * maxValue])(Math.abs(d.percDiff));
            return d3.interpolateGreens(normalizedVal);
          });
      chart.append('text')
        .attr('class', 'stat')
        .attr('x', width - 10)
        .attr('y', 20)
        .text(`Median Diff: ${d3.format('+.2')(medianDiff)}`);
      chart.append('text')
        .attr('class', 'stat')
        .attr('x', width - 10)
        .attr('y', 32)
        .text(`Mean Diff: 0`);

      chart.append('g')
        .attr('transform', `translate(0, ${height / 2})`)
        .call(xAxis);
      chart.append('g')
        .call(yAxis);
    },
    initChart(elementClass) {
      // Define chart dimensions
      const height = 160;
      const width = 550;
      const margin = { left: 40, right: 20, top: 45, bottom: 40 };

      // Add HTML elements to create chart
      const chart = d3.select(elementClass)
        .attr('height', height + margin.top + margin.bottom)
        .attr('width', width + margin.left + margin.right)
        .append('g')
          .attr('transform', `translate(${margin.left}, ${margin.top})`);

      return { chart, height, width };
    },
  },
};
</script>

<style lang="scss">
.midnight-strategy-header {
  font-size: 16px;
  font-weight: 400;
  margin-top: 24px;
}

.perc-text {
  font-size: 10px;
  font-weight: 600;
  text-anchor: middle;
}

.stat {
  font-size: 10px;
  font-weight: 600;
  text-anchor: end;
}

.median-line {
  opacity: 0.5;
  stroke: black;
  stroke-dasharray: 2,2;
}

.chart-title {
  font-size: 11px;
  font-weight: 600;
  text-anchor: middle;
}
</style>
