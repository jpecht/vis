<template>
  <Post v-bind="info">
    <template v-slot:description>
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
      <svg class="chart"></svg>
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

export default {
  name: 'FacebookNetwork',
  components: {
    Post,
  },
  data: () => ({
    info: visualizations.find(v => v.url === 'facebook-network'),
  }),
  mounted() {
    this.createVis();
  },
  methods: {
    async createVis() {
      var FB_NAME = 'Jeff Mowgli';

      var width = 650, height = 600;
      
      var nodeStrokeColor = '#E0E0E0',
        highNodeStrokeColor = '#333';
      var linkColor = '#AAA',
        highLinkColor = '#000';
      
      var chart = d3.select('.chart')
        .attr('width', width)
        .attr('height', height);

      var force = d3.forceSimulation()
        .force('charge', d3.forceManyBody());
        
      var mutualScale = d3.scaleThreshold()
        .domain([3, 5, 10, 30, 50])
        .range(['rgb(199,233,192)','rgb(161,217,155)','rgb(116,196,118)','rgb(65,171,93)','rgb(35,139,69)','rgb(0,90,50)']);
      
      var defaultInfoText = '&nbsp;';
      var infoText = defaultInfoText;

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
      
      var dataReady = function(error, nodesData, linksData) {
        nodesData.shift(); // cut out myself

        // attach important info to nodesData (number of mutual friends, name)
        var lookup = {};
        for (var i = 0; i < nodesData.length; i++) {
          nodesData[i].numMutual = 0;
          nodesData[i].name = nodesData[i].uid2;
          
          lookup[nodesData[i].uid2] = i;
        }
        
        // create links using the lookup built
        var links = [];
        for (var j = 0; j < linksData.length; j++) {
          if (linksData[j].uid1 !== FB_NAME && linksData[j].uid2 !== FB_NAME) {
            var sourceInd = lookup[linksData[j].uid1];
            var targetInd = lookup[linksData[j].uid2];
            links.push({source: sourceInd, target: targetInd});
            
            nodesData[sourceInd].numMutual++;
            nodesData[targetInd].numMutual++;
          }
        }

        force.nodes(nodesData);
        force.force('link').links(links);  
            
        var link = chart.selectAll('.link')
          .data(links)
          .enter().append('line')
            .attr('class', 'link')
            .style('stroke', linkColor);

        var node = chart.selectAll('.node')
          .data(nodesData)
          .enter().append('circle')
            .attr('class', 'node')
            .attr('r', 5)
            .style('stroke', nodeStrokeColor)
            .attr('fill', function(d) {
              if (d.name === 'Caitlin Farrell') return 'steelblue';
              else if (d.numMutual === 0) return '#999';
              else return mutualScale(d.numMutual);
            })
            .on('mouseover', function(d) {
              var info = infoTextize(d);
              d3.select('.chart-info').html(info);
            })
            .on('mouseout', function() {
              d3.select('.chart-info').html(infoText);
            })
            .on('click', function(d) {
              d3.event.stopPropagation();
              d3.selectAll('.node').style('stroke', nodeStrokeColor);
              d3.select(this).style('stroke', highNodeStrokeColor);
              
              d3.selectAll('.link').style('stroke', linkColor)
                .filter(function(linkDatum) {
                  return linkDatum.source.index === d.index || linkDatum.target.index === d.index;
                }).style('stroke', highLinkColor);
                
              infoText = infoTextize(d);
              d3.select('.chart-info').html(infoText);
            })
            .call(force.drag);
            
        // reset; clear node focus
        chart.on('click', function() {
          d3.selectAll('.node').style('stroke', nodeStrokeColor);
          d3.selectAll('.link').style('stroke', linkColor);
          
          infoText = defaultInfoText;
          d3.select('.chart-info').html(infoText);
        });
            
        // allow dynamic force layout movement
        force.on('tick', function() {
          link
            .attr('x1', function(d) { return d.source.x; })
            .attr('y1', function(d) { return d.source.y; })
            .attr('x2', function(d) { return d.target.x; })
            .attr('y2', function(d) { return d.target.y; });

          node
            .attr('cx', function(d) { return d.x; })
            .attr('cy', function(d) { return d.y; });
        });
      };
      
      var infoTextize = function(d) {
        return d.uid2 + ': ' + d.numMutual + ' mutual friends';
      };
      
      const [nodesData, linksData] = await Promise.all([
        d3.tsv('/data/fb_friends.tsv'),
        d3.tsv('/data/fb_mutual_friends.tsv'),
      ]);
      dataReady(null, nodesData, linksData);
    },
  },
};
</script>

<style lang="scss">
@import '~@/styles/legacy/bootstrap-partial.css';

.fantasy-football-performance-wrapper {
  font-size: 14px;

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
    font-size: 12px;
  }

  #ff-2-source {
    font-size: 11px;
    margin-top: 10px;
    text-align: right;
  }
}
</style>
