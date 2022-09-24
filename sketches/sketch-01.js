const canvasSketch = require('canvas-sketch');

const settings = {
  dimensions: [ 1080, 1080 ]
};

const sketch = () => {
  return ({ context, width, height }) => {
    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);

    context.strokeStyle = 'white'
    context.lineWidth = 4
        
    context.beginPath();
    context.arc(width * 0.5, height * 0.5, width * 1 / 6, 0, Math.PI * 2);
    context.stroke();

    

    const columns = 5;
    const rows = 5;

    const w = width * 0.1;
    const h = height * 0.1;
    const ix = width * 1 / 8;
    const iy = height * 1 / 8;
    const gapX = (width - columns * w - 2 * ix) / (columns - 1);
    const gapY = (width - rows * w - 2 * iy) / (rows - 1);

    const off = width * 0.02;

    for (let i = 0; i < columns; i++) {
        for (let j = 0; j < rows; j++) {
            context.lineWidth = 2

            let x = ix + (w + gapX) * i;
            let y = iy + (h + gapY) * j;
            context.beginPath();
            context.rect(x, y, w, h)
            context.stroke();  

            if(Math.random() > 0.5) {
                
                context.lineWidth = (Math.random() + 1) * 4
                context.beginPath();
                context.rect(x + off / 2, y + off / 2, w - off, h - off);
                context.stroke();
            }
        }          
    }
  };
};

canvasSketch(sketch, settings);
