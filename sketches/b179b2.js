const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random')

const settings = {
  dimensions: [ 2048, 2048 ]
};

const sketch = ({ width, height }) => {
  const graphMidX = width * 0.5
  const graphMidY = height * 0.5
  const graphDrawer = new GraphDrawer(width * 0.8, height * 0.8, graphMidX, graphMidY)
  const graph = new Graph()
  const graphVariator = new GraphVariator(graph)

  let range = [...Array(2).keys()]
  range.forEach((_) => graphVariator.apply(EdgeSplit))

  return ({ context, width, height }) => {
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);

    graphDrawer.drawGraph(context, graph)
  };
};

canvasSketch(sketch, settings);

class Node {
  static nodeNumber = 0
  constructor() {
    this.id = ++Node.nodeNumber
  }

}

class Edge {
  constructor(node1, node2, weight) {
    this.nodes = [node1, node2]
    this.weight = weight
  }
}

class Graph {
  constructor() {
    const iNode1 = new Node()
    const iNode2 = new Node()

    this.nodes = [iNode1, iNode2]
    this.edges = [new Edge(iNode1, iNode2, random.range(0, 1))]
  }
}

class NodePositioner {
  constructor(height, width) {
    this.height = height
    this.width = width
  }

  calculateNodePositions(graph) {
    let nodePositions = {}

    let y = random.range(-this.height/2, this.height/2)

    let x = random.range(-this.width/2, this.width/2)
    for (let i = 0; i < graph.nodes.length; i++) {
      const node = graph.nodes[i];
      x += 1000 * graph.edges.filter(e => e.nodes[0] == node).map(e => e.weight).reduce((pv, cv) => pv + cv, 0)
      y += 50
      nodePositions[node.id] = [x, y]
    }


    return nodePositions
  }
}


class GraphDrawer {
  constructor(width, height, midX, midY) {
    this.width = width
    this.height = height
    this.midX = midX
    this.midY = midY
  }

  drawGraph(context, graph) {
    context.save()
    context.translate(this.midX, this.midY)
    context.fillStyle = '#ccc'
    let nodePositions = (new NodePositioner(this.width, this.height)).calculateNodePositions(graph)
    console.log(nodePositions)
    for (let i = 0; i < graph.nodes.length; i++) {
      const node = graph.nodes[i];
      context.beginPath()
      context.arc(nodePositions[node.id][0], nodePositions[node.id][1], 100, 0, 2 * Math.PI)
      context.fill()
    }
    for (let i = 0; i < graph.edges.length; i++) {
      const edge = graph.edges[i];
      const node1Position = nodePositions[edge.nodes[0].id]
      const node2Position = nodePositions[edge.nodes[1].id]
      context.beginPath()
      context.lineWidth = 10
      context.moveTo(node1Position[0], node1Position[1])
      context.lineTo(node2Position[0], node2Position[1])
      context.stroke()
    }
    context.restore()
  }
}

class GraphVariator {
  constructor(graph) {
    this.graph = graph
  }

  apply(func) {
    let nodeAdds = []
    let edgeAdds = []
    for(let i = 0; i < this.graph.edges.length; i++) {
      let edge = this.graph.edges[i]
      let changes = func(edge, random.range(0.3, 0.7))
      nodeAdds = nodeAdds.concat(changes[0])
      edgeAdds = edgeAdds.concat(changes[1])
    }

    this.graph.nodes = this.graph.nodes.concat(nodeAdds)
    this.graph.edges = this.graph.edges.concat(edgeAdds)
  }
}

const EdgeSplit = (edge, fraction) => {
  let splitNode = new Node()
  let otherOldNode = edge.nodes[1]
  edge.nodes = [edge.nodes[0], splitNode]
  let oldWeight = edge.weight
  edge.weight *= fraction

  let splitEdge = new Edge(splitNode, otherOldNode, oldWeight * (1 - fraction))

  return [[splitNode], [splitEdge]]
}