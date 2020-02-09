<template>
  <Post v-bind="postInfo">
    <template v-slot:description>
      <p>
        <b>Note:</b>
        <i>
          This is a refresh of an old post I did back in October 2014.
          I used the same data but I'm now using d3.js v5.
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
      <div class="row">
        <div class="chart-info col-xs-6"></div>
        <div class="col-xs-6 legend">
          <svg></svg>
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
    selectedName: '',
    selectedNumMutual: 0,
  }),
  mounted() {
    this.createVis();
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
      const { chart } = this.$refs;

      const { linksData, nodesData } = await this.retrieveData();

      const simulation = d3.forceSimulation(nodesData)
        .force('charge', d3.forceManyBody().strength(-15))
        .force('center', d3.forceCenter(this.chart.width / 2, this.chart.height / 2))
        .force('link', d3.forceLink(linksData));

      // draw nodes and links
      const link = d3.select(chart).selectAll('.link')
        .data(linksData)
        .join('line')
          .attr('class', 'link')
          .style('stroke', linkColor);

      const node = d3.select(chart).selectAll('.node')
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
          .on('click', (d) => {
            d3.event.stopPropagation();
            d3.selectAll('.node').style('stroke', nodeStrokeColor);
            d3.select(this).style('stroke', highNodeStrokeColor);
            
            d3.selectAll('.link')
              .style('stroke', linkColor)
              .filter(linkDatum => (
                linkDatum.source.index === d.index || linkDatum.target.index === d.index
              ))
                .style('stroke', highLinkColor);
              
            this.setInfoText(d);
          })
          .call(this.dragSimulator(simulation));


      // begin simulation
      simulation.on('tick', () => {
        node.attr('transform', (d) => {
          d.x = Math.max(nodeRadius, Math.min(this.chart.width - nodeRadius, d.x));
          d.y = Math.max(nodeRadius, Math.min(this.chart.height - nodeRadius, d.y));
          return `translate(${d.x}, ${d.y})`;
        });
        // node.attr('transform', d => `translate(${d.x}, ${d.y})`);
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);
      });

      // Clear selected when clicking on the chart itself
      // d3.select(chart).on('click', this.clearSelected);
    },

    drawLegend() {
      // draw legend
      var rect_width = 30, rect_height = 10;
      var legend_data = mutualScale.range();
      legend_data.push('');
      var legend = d3.select('.legend svg')
        .attr('height', rect_height + 25)
        .attr('width', rect_width * 6 + 20);
      var legend_colors = legend.selectAll('g')
        .data(legend_data)
        .enter().append('g')
          .attr('transform', function(d, i) {
            return 'translate(' + (i*rect_width+10) + ', 0)';
          });
      legend_colors.append('rect')
        .attr('width', rect_width)
        .attr('height', rect_height)
        .style('display', function(d, i) { return (i === legend_data.length - 1) ? 'none' : ''; })
        .attr('fill', function(d) { return d; });
      legend_colors.append('text')
        .attr('class', 'legend-text')
        .attr('y', rect_height + 12)
        .html(function(d, i) {
          if (i === 0) return '1';
          else if (i === legend_data.length - 1) return '150';
          else return mutualScale.domain()[i-1];
        });
    },

    clearSelected() {
      d3.selectAll('.node').style('stroke', nodeStrokeColor);
      d3.selectAll('.link').style('stroke', linkColor);
      this.setInfoText();
    },

    dragSimulator(simulation) {
      return d3.drag()
        .on('start', (d) => {
          if (!d3.event.active) simulation.alphaTarget(.03).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (d) => {
          d.fx = d3.event.x;
          d.fy = d3.event.y;
        })
        .on('end', (d) => {
          if (!d3.event.active) simulation.alphaTarget(.03);
          d.fx = null;
          d.fy = null;
        });
    },

    setInfoText(d) {
      this.infoText = d
        ? `${d.uid2}: ${d.numMutual} mutual friends`
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
.chart-info {
  font-weight: 400;
  margin-top: 10px;
  text-align: center;
}
.legend {
  margin-top: 10px;
  text-align: center;
}
.legend text { text-anchor: middle; }
.legend-text { margin-top: -5px; }
</style>
