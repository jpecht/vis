<template>
  <Post v-bind="postInfo">
    <template v-slot:description>
      <p>
        <b>Note:</b>
        <i>
          This is a refresh of an old post I did back in October 2014.
          I used the same data but d3.js v5 is now being used.
        </i>
      </p>
      <p>
        The chart below presents my network of facebook friends.
        Each node is a facebook friend and each link represents a friendship.
      </p>
      <p>
        I retrieved all this data through a facebook application called
        <a href="https://apps.facebook.com/give_me_my_data/">Give Me My Data</a>. 
        Due to a recent policy change, friendlists are no longer retrievable through facebook's API,
        so I'm unable to generalize the chart for any user =(
      </p>
      <p>
        Also of note, the d3 force layout seems to lag when dynamically rendering ~300-400 nodes.
        I have 400 friends so there is a little lag.
      </p>
    </template>
    <div class="facebook-chart-container">
      <svg
        ref="chart"
        :height="chart.height"
        :width="chart.width"
      />
      <div class="context-container">
        <div class="chart-info">{{ infoText }}</div>
        <div>
          <svg class="legend" ref="legend" />
          <div class="legend-text"># of Mutual Friends</div>
        </div>
      </div>
    </div>
    <template v-slot:post-description>
      <p>
        Alright, looking at my network, I basically have 3 main groups.
        The huge cluster is my friends from my high school, Maret. 
        The other two clusters are mostly friends from my middle school, Barrie,
        and friends from the first university I went to, Carnegie Mellon.
        Some of the little clusters I can tell are little friend groups,
        like people that worked at Plato's or Maryland buddies.
      </p>
      <p>
        It's interesting to see the intermediary friends: friends that have mutual friends in multiple clusters.
        For example, there are 2 people who went to both Maret and CMU and I also have a friend who went to both Barrie and CMU.
        My girlfriend, who's in blue, connects with multiple groups of my friends.
      </p>
    </template>
  </Post>
</template>

<script>
import Post from '@/components/Post.vue';
import * as d3 from 'd3';
import visualizations from '@/constants/VisualizationsList';

// Constants
const FB_NAME = 'Jeff Mowgli';
const nodeRadius = 5;

// Chart colors
const nodeStrokeColor = '#e0e0e0';
const highNodeStrokeColor = '#333';
const linkColor = '#aaa';
const highLinkColor = '#000';

// Scales
const mutualScale = d3.scaleThreshold()
  .domain([3, 5, 10, 30, 50])
  .range([
    'rgb(199, 233, 192)',
    'rgb(161, 217, 155)',
    'rgb(116, 196, 118)',
    'rgb(65, 171, 93)',
    'rgb(35, 139, 69)',
    'rgb(0, 90, 50)',
  ]);

export default {
  name: 'FacebookNetwork',
  components: {
    Post,
  },
  data: () => ({
    chart: {
      height: 600,
      width: 650,
    },
    infoText: '',
    postInfo: visualizations.find(v => v.url === 'facebook-network'),
    selected: '',
    selectedNumMutual: 0,
    simulation: null,
  }),
  mounted() {
    this.createVis();
    this.drawLegend();
  },
  destroyed() {
    if (this.simulation) this.simulation.stop();
  },
  methods: {
    async retrieveData() {
      let [nodesData, linksData] = await Promise.all([
        d3.tsv('/data/fb_friends.tsv'),
        d3.tsv('/data/fb_mutual_friends.tsv'),
      ]);

      nodesData.shift(); // cut out myself

      // attach important info to nodesData (number of mutual friends, name)
      const lookup = {};
      nodesData = nodesData.map((node, i) => {
        lookup[node.uid2] = i;
        return {
          ...node,
          name: node.uid2,
          numMutual: 0,
        };        
      });
      
      // create links using the lookup built
      const links = [];
      linksData.forEach((link) => {
        if (link.uid1 !== FB_NAME && link.uid2 !== FB_NAME) {
          const sourceInd = lookup[link.uid1];
          const targetInd = lookup[link.uid2];
          links.push({ source: sourceInd, target: targetInd });
          
          nodesData[sourceInd].numMutual++;
          nodesData[targetInd].numMutual++;
        }
      });

      return { linksData: links, nodesData };
    },

    async createVis() {
      const self = this;
      const { chart } = this.$refs;

      const { linksData, nodesData } = await this.retrieveData();

      this.simulation = d3.forceSimulation(nodesData)
        .force('charge', d3.forceManyBody().theta(0.8).strength(-30))
        // .force('collision', d3.forceCollide().strength(0.8))
        .force('x', d3.forceX(this.chart.width / 2).strength(0.1))
        .force('y', d3.forceY(this.chart.height / 2).strength(0.1))
        .force('link', d3.forceLink(linksData));

      // draw nodes and links
      const link = d3.select(chart).append('g').selectAll('.link')
        .data(linksData)
        .join('line')
          .attr('class', 'link')
          .style('stroke', linkColor);

      const node = d3.select(chart).append('g').selectAll('.node')
        .data(nodesData)
        .enter().append('circle')
          .attr('class', 'node')
          .attr('r', nodeRadius)
          .style('stroke', nodeStrokeColor)
          .attr('fill', (d) => {
            if (d.name === 'Caitlin Farrell') return 'steelblue';
            if (d.numMutual === 0) return '#999';
            return mutualScale(d.numMutual);
          })
          .on('mouseover', (d) => {
            this.setInfoText(d);
          })
          .on('mouseout', () => {
            this.setInfoText();
          })
          .on('click', function selectNode(d) {
            self.selected = (self.selected.uid2 === d.uid2) ? '' : d;
            d3.event.stopPropagation();
            d3.selectAll('.node').style('stroke', nodeStrokeColor);
            d3.select(this).style('stroke', highNodeStrokeColor);
            
            d3.selectAll('.link')
              .style('stroke', linkColor)
              .filter(linkDatum => (
                linkDatum.source.index === d.index || linkDatum.target.index === d.index
              ))
                .style('stroke', highLinkColor)
                .each(function reorder() {
                  this.parentNode.appendChild(this);
                });
              
            self.setInfoText(d);
          })
          .call(this.dragSimulator());


      // begin simulation
      this.simulation.on('tick', () => {
        node.attr('transform', (d) => {
          d.x = Math.max(nodeRadius, Math.min(this.chart.width - nodeRadius, d.x));
          d.y = Math.max(nodeRadius, Math.min(this.chart.height - nodeRadius, d.y));
          return `translate(${d.x}, ${d.y})`;
        });
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);
      });

      // Clear selected when clicking on the chart itself
      d3.select(chart).on('click', this.clearSelected);
    },

    drawLegend() {
      // draw legend
      const rectWidth = 30;
      const rectHeight = 10;

      const legendData = mutualScale.range();
      legendData.push('');

      const legend = d3.select(this.$refs.legend)
        .attr('height', rectHeight + 25)
        .attr('width', rectWidth * 6 + 40);
      const legendColors = legend.selectAll('g')
        .data(legendData)
        .join('g')
          .attr('transform', (d, i) => `translate(${(i * rectWidth + 20)}, 0)`);
      legendColors.append('rect')
        .attr('width', rectWidth)
        .attr('height', rectHeight)
        .style('display', (d, i) => (i === legendData.length - 1 ? 'none' : ''))
        .attr('fill', function(d) { return d; });
      legendColors.append('text')
        .attr('class', 'legend-text')
        .attr('y', rectHeight + 12)
        .html((d, i) => {
          if (i === 0) return '1';
          if (i === legendData.length - 1) return '150';
          return mutualScale.domain()[i - 1];
        });
    },

    clearSelected() {
      d3.selectAll('.node').style('stroke', nodeStrokeColor);
      d3.selectAll('.link').style('stroke', linkColor);
      this.setInfoText();
    },

    dragSimulator() {
      return d3.drag()
        .on('start', (d) => {
          if (!d3.event.active) this.simulation.alphaTarget(.03).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (d) => {
          d.fx = d3.event.x;
          d.fy = d3.event.y;
        })
        .on('end', (d) => {
          if (!d3.event.active) this.simulation.alphaTarget(.03);
          d.fx = null;
          d.fy = null;
        });
    },

    setInfoText(d) {
      const target = d || this.selected;
      this.infoText = target
        ? `${target.uid2}: ${target.numMutual} mutual friends`
        : '';
    },
  },
};
</script>

<style lang="scss">
.chart { border: 1px solid #ccc; }
.node {
  stroke-width: 1px;
}
.link {
  stroke-width: 1;
  stroke-opacity: .6;
}

.context-container {
  font-weight: 400;
  margin-top: 15px;
  text-align: center;
}
.chart-info {
  display: inline-block;
  font-weight: 600;
}
.legend {
  margin-top: 10px;
  text-align: center;
}
.legend text {
  font-size: 11px;
  text-anchor: middle;
}
</style>
