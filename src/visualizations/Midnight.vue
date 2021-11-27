<template>
  <Post v-bind="info">
    <template v-slot:description>
      <p>
        If you're not familiar with the game, Midnight, it's a simple dice game where you
        roll six dice and try to get the highest total possible. You can re-roll as many
        times as you want, but you must keep at least one dice each time. The kick is that
        you must have a 1 and a 4 at the end to score.
        So the highest possible total is 24: 1, 4, 6, 6, 6, 6.
        Getting a total of 24 is called Midnight and if you're gambling, it means you get
        double the money as well so it's a highly coveted feat.
      </p>
      <p>
        What I was most intrigued in was a strategy that my friend, Casey, posited.
        If you, say, had a opening roll of 1, 4, 2, 2, 2, 2, do you keep both the 1 and the 4 immediately to make sure you qualify? Or do you keep just the 1 and re-roll the rest knowing that
        you're likely to get the 4 later and give you an extra round to roll for the 6s?
        Well, since this is a dice game, there are a finite number of outcomes and I thought it
        couldn't be too difficult to make a brute-force simulation and solve this question.
      </p>
      <p>
        My first attempt involved simply simulating all outcomes of the game using a simple strategy
         where you take qualifiers (1s and 4s) immediately and take any 6s that are rolled (unless you still need qualifiers).
      </p>
      <svg class="spread-chart-sixes" />
      <p>
        As you can see, there are over a quadrillion total outcomes and about 12 billion unique outcomes. The simulation itself took about 32 min to run on my laptop. Luckily, I had some spare time over Thanksgiving haha.
      </p>
      <p>
        Regarding the resulting spread chart, I was surprised to see that you only had about a 1% chance in getting Midnight.
        It also looks like with this strategy, the average score hovers at about 18 and 19 interestingly.
        The next strategy I wanted to test, just for comparison,
        was to see how the spread would look if we took 5s as well as 6s.
        This would be a more conservative strategy since you're willing to settle for 5s.
      </p>
      <svg class="spread-chart-fives" />
      <svg class="spread-chart-fives-diff" />
      <p>
        This strategy predictably fared less well than the first strategy.
        There really isn't much upside to this strategy.
        The next strategy is the one I was excited to test.
        This is similar to the first strategy where you take 6s,
        <i>except</i> if you need both qualifiers and you roll both a 1 and a 4, you only take one if you will still have 3 or more dice to roll after.
        This should theoretically give you more chances to roll a 6 with the extra die to roll.
      </p>
      <svg class="spread-chart-one-qualifier" />
      <svg class="spread-chart-one-qualifier-diff" />
      <p>
        The results were a little confusing. I'm not sure why there was <i>less</i> of a chance of
        getting no score, since the difference in strategy means you're not automatically taking
        both qualifiers. However, it looks like with this strategy, you're slightly less likely
        to get Midnight, but you have a slightly higher average.
      </p>
      <p>
        In conclusion, it looks like both strategies are fairly viable.
        You might consider the first strategy if you're going for a higher score though.
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
      oneQualifier: {
        0: 505348509159014,
        1: 0,
        2: 0,
        3: 0,
        4: 63888286,
        5: 1835023638,
        6: 22180681724,
        7: 155594262649,
        8: 753041412070,
        9: 2826511571932,
        10: 8921174392930,
        11: 24016886757467,
        12: 55637282287562,
        13: 112290109091018,
        14: 201120519884350,
        15: 319221359910122,
        16: 446483662434771,
        17: 558429277538151,
        18: 627148604940358,
        19: 619147154121488,
        20: 534349241774918,
        21: 413776627784478,
        22: 284904265223372,
        23: 160867625546708,
        24: 52249083457540,
      },
      fives: {
        0: 5209074573930,
        1: 0,
        2: 0,
        3: 0,
        4: 1187732,
        5: 33684132,
        6: 408921738,
        7: 2916638787,
        8: 14205844894,
        9: 51895526776,
        10: 154020129847,
        11: 384703172397,
        12: 827076366753,
        13: 1538051173361,
        14: 2523240533632,
        15: 3670861824288,
        16: 4748666454840,
        17: 5489112721096,
        18: 5673816899622,
        19: 5255423885214,
        20: 4334971341689,
        21: 3163326792587,
        22: 1967710072333,
        23: 917908867464,
        24: 230587413864,
      },
      sixes: {
        0: 149541432580874,
        1: 0,
        2: 0,
        3: 0,
        4: 15637776,
        5: 434215298,
        6: 5134332312,
        7: 35954287761,
        8: 176940907700,
        9: 681645887470,
        10: 2196939363030,
        11: 6013383861363,
        12: 14150619910046,
        13: 29028610779400,
        14: 52628199915758,
        15: 84282386057250,
        16: 119187739732285,
        17: 150619562029189,
        18: 170229289406892,
        19: 168895107336986,
        20: 146790701428366,
        21: 115206479557660,
        22: 79737647410334,
        23: 44630993736698,
        24: 14609561191538,
      },
    },
  }),
  mounted() {
    const { spreads } = this;
    this.createSpreadChart('.spread-chart-sixes', spreads.sixes, {
      title: 'Midnight Spread - taking only sixes'
    });
    this.createSpreadChart('.spread-chart-fives', spreads.fives);
    this.createSpreadChartDiff('.spread-chart-fives-diff', spreads.sixes, spreads.fives);
    this.createSpreadChart('.spread-chart-one-qualifier', spreads.oneQualifier);
    this.createSpreadChartDiff('.spread-chart-one-qualifier-diff', spreads.sixes, spreads.oneQualifier);
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
        .range([height, 0]);

      const xAxis = d3.axisBottom().scale(x);
      const yAxis = d3.axisLeft().scale(y).tickFormat(d3.format('.2s'));
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
          .style('fill', d => d3.interpolateRdBu(0.85 * (1 - d.score / 24)));
      chart.selectAll('.perc-text')
        .data(dataArr)
        .enter().append('text')
          .attr('class', 'perc-text')
          .attr('x', d => x(d.score))
          .attr('y', d => y(d.numGames) - 2)
          .text(d => this.formatPercentage(d.numGames / sum));
      chart.append('text')
        .attr('class', 'stat')
        .attr('x', width - 10)
        .attr('y', 20)
        .text(`Median: ${Math.round(10 * median) / 10}`);
      chart.append('text')
        .attr('class', 'stat')
        .attr('x', width - 10)
        .attr('y', 32)
        .text(`Mean: ${Math.round(10 * mean) / 10}`);
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

      const medianDiff = 0.1266;

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
            const normalizedVal = d3.scaleLinear().domain([-1.5*maxValue, 2 * maxValue])(Math.abs(d.percDiff));
            return d3.interpolateGreens(normalizedVal);
          });
      /* chart.selectAll('.perc-text')
        .data(dataArr)
        .enter().append('text')
          .attr('class', 'perc-text')
          .attr('x', d => x(d.score))
          .attr('y', d => y(d.percDiff) - 2)
          .text(d => d3.format('+.1%')(d.percDiff)); */
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
    formatPercentage(num) {
      if (num < 0.003) return '';
      if (num < 0.02) return `${Math.round(1000 * num) / 10}%`;
      return `${Math.round(100 * num)}%`;
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
pre {
  background-color: rgb(227, 230, 232);
  font-size: 11px;
  padding: 8px 0;
}

.bar {
  fill: steelblue;
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
