const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');

const settings = {
  dimensions: [ 2048, 2048 ]
};

const sigmoid = (x) => 1 / (1 + Math.pow(Math.E, -x))

const sketch = () => {
  return ({ context, width, height }) => {
      context.fillStyle = 'white';
      context.fillRect(0, 0, width, height);

      let segmentHeight = random.range(height * 0.02, height * 0.1)
      context.beginPath()
      let segmentY = random.range(0, height)
      let segmentMiddlePointX = random.range(0.2, 0.8) * width
      context.moveTo(0, segmentY)
      context.lineTo(segmentMiddlePointX, segmentY)
      context.moveTo(segmentMiddlePointX, segmentY + segmentHeight)
      context.lineTo(width, segmentY + segmentHeight)
      context.strokeStyle = '#000000'
      context.lineWidth = 2
      context.stroke()
  };
};

canvasSketch(sketch, settings);
