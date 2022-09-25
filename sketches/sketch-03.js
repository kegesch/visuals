const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random')
const math = require('canvas-sketch-util/math');
const { mapRange } = require('canvas-sketch-util/math');

const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true
};

const sketch = ({ width, height }) => {    
  const agents = []
  
  for(let i = 0; i < 40; i++) {
    const x = random.range((0, width))
    const y = random.range(0, height)

    agents.push(new Agent(x, y))
  }

  return ({ context, width, height }) => {

    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);

    let neighbours = []
    agents.forEach((agent, idx) => {
      neighbours[idx] = 0
    })


    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      for (let j = i + 1; j < agents.length; j++) {
        const other = agents[j];

        const dist = agent.position.getDistance(other.position)

        if(dist > 200) continue

        neighbours[i] += 1
        neighbours[j] += 1

        console.log(neighbours[i])

        context.lineWidth = mapRange(dist, 0, 200, 12, 1)

        context.beginPath()
        context.moveTo(agent.position.x, agent.position.y)
        context.lineTo(other.position.x, other.position.y)
        context.stroke()
      }
    }


    agents.forEach((agent, idx) => {
      agent.update()
      agent.draw(context, mapRange(neighbours[idx], 0, 6, 4, 12))
      agent.bounce(width, height)
    })
  };
};

canvasSketch(sketch, settings);

class Vector {
  constructor(x, y) {
    this.x = x
    this.y = y
  }

  getDistance(v) {
    const dx = this.x - v.x
    const dy = this.y - v.y

    return Math.sqrt(dx * dx + dy * dy)
  }
}

class Agent {
  constructor(x, y) {
    this.position = new Vector(x, y)
    this.velocity = new Vector(random.range(-1, 1), random.range(-1, 1))
  }

  bounce(width, height) {
    if (this.position.x <= 0 || this.position.x >= width) this.velocity.x *= -1
    if (this.position.y <= 0 || this.position.y >= height) this.velocity.y *= -1
  }

  update() {
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y
  }

  draw(context, radius) {
    context.save()
    context.translate(this.position.x, this.position.y)
    context.lineWidth = 4

    context.beginPath()
    context.arc(0, 0, radius, 0, Math.PI * 2)
    context.fill()
    context.stroke()
    context.restore()
  }
}