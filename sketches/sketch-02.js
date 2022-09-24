const canvasSketch = require('canvas-sketch');
const math = require('canvas-sketch-util/math');
const random = require('canvas-sketch-util/random');

const settings = {
  dimensions: [ 1080, 1080 ]
};


const sketch = () => {
  return ({ context, width, height }) => {
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);

    const cx = width;
    const cy = height;
    const w = width * 0.01;
    const h = height * 0.1;

    let x,y;

    const num = 40

    const radius = width ;
    context.strokeStyle = 'black'
    context.fillStyle = 'black';
    for(let i = 0; i < num; i++) {
      const slice = math.degToRad(360 / num)
      const angle = slice * i;
    
      x = cx + radius * Math.sin(angle)
      y = cy + radius * Math.cos(angle)

      context.save();
      context.translate(x, y);
      context.rotate(-angle);
      context.scale(random.range(0.1, 2), random.range(0.2, 0.5))
  
      context.fillRect(-w * 0.5, random.range(0, -h * 0.5), w, h);
      context.restore();

      context.save()
      context.translate(cx, cy)
      context.rotate(-angle)

      context.lineWidth = random.range(5, 20)

      context.beginPath()
      context.arc(0, 0, radius * random.range(0.5, 1.3), slice * random.range(1, -8), slice * random.range(1, 5))
      context.stroke()
      context.d
      context.restore()
    }
  };
};

canvasSketch(sketch, settings);
