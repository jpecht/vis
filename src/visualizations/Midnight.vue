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
      <svg class="spread-chart-midnight-exclusive" />
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
      <p>
        This strategy predictably fared less well than the first strategy.
        There really isn't much upside to this strategy.
        The next strategy is the one I was excited to test.
        This is similar to the first strategy where you take 6s,
        <i>except</i> if you need both qualifiers and you roll both a 1 and a 4, you only take one if you will still have 3 or more dice to roll after.
        This should theoretically give you more chances to roll a 6 with the extra die to roll.
      </p>
      <svg class="spread-chart-one-qualifier" />
      <p>
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
        0: 439349864180324,
        1: 0,
        2: 0,
        3: 0,
        4: 56532874,
        5: 1622187972,
        6: 19592428582,
        7: 137515752625,
        8: 666350058778,
        9: 2502732945513,
        10: 7895741410766,
        11: 21256544004656,
        12: 49280928022575,
        13: 99422072316537,
        14: 178119102418601,
        15: 282981274783352,
        16: 395865490195293,
        17: 495393215474158,
        18: 557063669886873,
        19: 550094996676154,
        20: 474441699317119,
        21: 367565156877771,
        22: 252808611515685,
        23: 141772935304940,
        24: 45708587419198,
      },
      oneQualifierDifference: {
        0: -0.010129419634543141,
        1: 0,
        2: 0,
        3: 0,
        4: 1.483175790042076e-9,
        5: 5.3072723992511825e-8,
        6: 7.192345903569957e-7,
        7: 0.0000050858210124164176,
        8: 0.0000225535753190565,
        9: 0.0000721047754352809,
        10: 0.00019367293818805392,
        11: 0.0004475969731545619,
        12: 0.0008758659825883752,
        13: 0.0014117440786375543,
        14: 0.002035083161100827,
        15: 0.002628283308924284,
        16: 0.002618745328630198,
        17: 0.0020059088809382675,
        18: 0.0013097021107026652,
        19: 0.0005307977189464019,
        20: -0.00038578650807216675,
        21: -0.0014346516146531846,
        22: -0.0013463846471470711,
        23: -0.000578495794074256,
        24: -0.0002831802455782514,
      },
      fives: {
        0: 5283894819690,
        1: 0,
        2: 0,
        3: 0,
        4: 1190392,
        5: 33828616,
        6: 412016534,
        7: 2951013721,
        8: 14424357869,
        9: 52729007311,
        10: 156177248888,
        11: 389575708289,
        12: 839488679252,
        13: 1560225674769,
        14: 2564393305759,
        15: 3742268257844,
        16: 4847833550866,
        17: 5615214994773,
        18: 5813194906188,
        19: 5383997576924,
        20: 4438412216568,
        21: 3234403142905,
        22: 2010013821754,
        23: 938317841762,
        24: 235833133982,
      },
      midnightExclusive: {
        0: 151104652521194,
        1: 0,
        2: 0,
        3: 0,
        4: 15644510,
        5: 434580496,
        6: 5142116926,
        7: 36040284597,
        8: 177487488846,
        9: 683804106533,
        10: 2203383925358,
        11: 6032452968788,
        12: 14206191067251,
        13: 29144678070775,
        14: 52887594507421,
        15: 84848152865368,
        16: 120137251750689,
        17: 152074905237872,
        18: 172295888162591,
        19: 171180013466534,
        20: 148788016710735,
        21: 116819145572773,
        22: 80837621906387,
        23: 45092384929916,
        24: 14669882574776,
      },
    },
  }),
  mounted() {
    this.createSpreadChart('.spread-chart-midnight-exclusive', this.spreads.midnightExclusive);
    this.createSpreadChart('.spread-chart-fives', this.spreads.fives);
    this.createSpreadChartDifference('.spread-chart-one-qualifier', this.spreads.oneQualifierDifference);
  },
  methods: {
    createSpreadChart(elementClass, data) {
      // Define chart dimensions
      const height = 160;
      const width = 550;
      const margin = { left: 40, right: 20, top: 20, bottom: 40 };

      // Gather data
      const dataArr = [];
      Object.keys(data).forEach((score) => {
        dataArr.push({ score, numGames: data[score] });
      });
      const sum = dataArr.reduce((acc, val) => acc + val.numGames, 0);
      const median = dataArr.reduce((acc, val) => acc + val.numGames * val.score, 0) / sum;
      let mean = -1;
      let rollingNumGames = sum / 2;
      while (rollingNumGames > 0) {
        mean += 1;
        rollingNumGames -= data[mean];
      }

      // Add HTML elements to create chart
      const chart = d3.select(elementClass)
        .attr('height', height + margin.top + margin.bottom)
        .attr('width', width + margin.left + margin.right)
        .append('g')
          .attr('transform', `translate(${margin.left}, ${margin.top})`);
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
          .style('fill', d => d3.interpolateRdGy(1 - d.score / 24));
      chart.selectAll('.perc-text')
        .data(dataArr)
        .enter().append('text')
          .attr('class', 'perc-text')
          .attr('x', d => x(d.score))
          .attr('y', d => y(d.numGames) - 2)
          .text(d => this.formatPercentage(d.numGames / sum));
      /* chart.append('line')
        .attr('class', 'median-line')
        .attr('x1', x(median))
        .attr('x2', x(median))
        .attr('y1', 0)
        .attr('y2', height); */
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
    },
    createSpreadChartDifference(elementClass, data) {
      // Define chart dimensions
      const height = 160;
      const width = 550;
      const margin = { left: 40, right: 20, top: 20, bottom: 40 };

      // Gather data
      const dataArr = [];
      Object.keys(data).forEach((score) => {
        dataArr.push({ score, numGames: data[score] });
      });
      const sum = dataArr.reduce((acc, val) => acc + val.numGames, 0);
      const median = 16.4;
      const mean = 18;
      const medianDiff = 0.1266;

      // Add HTML elements to create chart
      const chart = d3.select(elementClass)
        .attr('height', height + margin.top + margin.bottom)
        .attr('width', width + margin.left + margin.right)
        .append('g')
          .attr('transform', `translate(${margin.left}, ${margin.top})`);
      const x = d3.scaleLinear()
        .domain([-1, 25])
        .range([0, width]);
      const y = d3.scaleLinear()
        .domain([-0.012, 0.012])
        .range([height, 0]);

      const xAxis = d3.axisBottom().scale(x);
      const yAxis = d3.axisLeft().scale(y).tickFormat(d3.format('.1%'));

      chart.selectAll('.bar')
        .data(dataArr)
        .enter().append('rect')
          .attr('class', 'bar')
          .attr('x', d => x(d.score) - 10)
          .attr('y', d => (d.numGames > 0) ? y(d.numGames) : y(0))
          .attr('width', 20)
          .attr('height', d => (
            (d.numGames > 0) ? y(0) - y(d.numGames) : y(d.numGames) - y(0)
          ))
          .style('fill', 'steelblue');
      /* chart.selectAll('.perc-text')
        .data(dataArr)
        .enter().append('text')
          .attr('class', 'perc-text')
          .attr('x', d => x(d.score))
          .attr('y', d => y(d.numGames) - 2)
          .text(d => d3.format('+.1%')(d.numGames)); */
      chart.append('text')
        .attr('class', 'stat')
        .attr('x', width - 10)
        .attr('y', 20)
        .text(`Median Diff: +0.13`);
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
</style>
