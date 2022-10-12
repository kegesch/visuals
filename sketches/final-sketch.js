const canvasSketch = require('canvas-sketch');
const math = require('canvas-sketch-util/math')
const random = require('canvas-sketch-util/random')
const Tweakpane = require('tweakpane')

const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true
};

let params = {
  freq: 0.001,
  amplitude: 0.2,
  velocity: 1,
  patchSize: 4,
  patchesCount: 3
}

const backgroundCanvas = document.createElement('canvas')
const backgroundContext = backgroundCanvas.getContext('2d')

const patchesCanvas = document.createElement('canvas')
const patchesContext = patchesCanvas.getContext('2d')
let manager

const sketch = ({width, height}) => {

  // background
  backgroundCanvas.width = width
  backgroundCanvas.height = height
  backgroundContext.fillStyle = '#FAF0D7';
  backgroundContext.fillRect(0, 0, width, height);

  patchesCanvas.width = width
  patchesCanvas.height = height


  const colors1 = ['#F4BFBF', '#FFD9C0', '#8CC0DE']
  const colorsPurple = ['#645CAA', '#A084CA', '#BFACE0', '#EBC7E8']

  const colors = [...colors1, ...colorsPurple]

  let movingPatches = [...Array(params.patchesCount).keys()].map(_ => new Patch(random.range(-100, 100), random.range(-100, 100), random.pick(colors), params.patchSize))

  const circleRadius = width * 0.4
  const circlePosition = new Vector(0, 0)

  backgroundContext.save()
  backgroundContext.translate(width / 2, height / 2)
  backgroundContext.beginPath()
  backgroundContext.arc(circlePosition.x, circlePosition.y, circleRadius, 0, Math.PI * 2)
  backgroundContext.strokeStyle = 'white'
  backgroundContext.lineWidth = 4
  backgroundContext.stroke()
  backgroundContext.restore()

  imageDataBackground = backgroundContext.getImageData(0, 0, width, height)
  imageDataPatches = new ImageData(width, height)

  return ({ context, width, height, frame }) => {
    context.globalCompositeOperation = settings.blend
    context.fillStyle = '#FAF0D7';
    context.fillRect(0, 0, width, height);
  
    context.putImageData(imageDataBackground, 0, 0)  
  
    let patchesData = patchesContext.getImageData(0,0,width, height).data
    for (let i = 0; i < patchesData.length; i+=4) {
      let newColor = decrease_brightness(patchesData[i], patchesData[i+1], patchesData[i+2], 99)
      patchesData[i] = newColor[0];
      patchesData[i+1] = newColor[1];
      patchesData[i+2] = newColor[2];
    }
    patchesContext.putImageData(new ImageData(patchesData, width, height), 0, 0)

    patchesContext.save()
    patchesContext.translate(width / 2, height / 2)
    movingPatches.forEach((p) => {
      p.draw(patchesContext, width, height)
      p.bounce(circlePosition, circleRadius)
      p.update(frame)    
    })
    
    //patches.forEach((p) => {
    //  p.radius = Math.min(p.radius + 1, 30)
    //  p.opacity = Math.max(0, p.opacity - 0.0005)
    //})
    //patches = patches.concat(newPatches).slice(-1000)
    patchesContext.restore()
    context.drawImage(patchesCanvas, 0, 0)
  };
};


const createPane = () => {
  const pane = new Tweakpane.Pane()
  let folder

  folder = pane.addFolder({title: 'General'})
  folder.addInput(params, 'velocity', { min: -15, max: 15, step: 1})
  folder.addInput(params, 'patchesCount', { min: -1, max: 200, step: 1})
  folder.addInput(params, 'patchSize', { min: 1, max: 50, step: 1})
  const btn = folder.addButton({title: 'Reset'})
  btn.on('click', async () => {
    manager.unload()
    manager = await canvasSketch(sketch, settings);
  })

  folder = pane.addFolder({title: "Noise"})
  folder.addInput(params, 'freq', { min: -0.01, max: 0.02})
  folder.addInput(params, 'amplitude', { min: 0, max: 10})
}

const start = async () => {
  manager = await canvasSketch(sketch, settings);
  createPane()
}

start()


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

class Patch {
  constructor(x, y, color, radius) {
    this.color = color
    this.radius = radius
    this.inBound = true
    this.opacity = 1
    this.position = new Vector(x, y)
    this.velocity = new Vector(random.range(-5, 5), random.range(-5, 5))
  }

  bounce(vector, radius) {
    if(this.inBound && this.position.getDistance(vector) + this.radius + 2 >= radius) {
      this.velocity.x *= -1
      this.velocity.y *= -1
      this.inBound = false
    } else {
      this.inBound = true
    }
  }

  update(frame) {
    let noise = random.noise3D(this.position.x, this.position.y, frame, params.freq, params.amplitude)
    this.position.x += this.velocity.x * params.velocity + 2 * noise
    this.position.y += this.velocity.y * params.velocity + 2 * noise
  }

  draw(context, width, height) {
    context.save()
    let imageData = context.getImageData(width / 2 + this.position.x + (this.velocity.x * this.radius), height / 2 + this.position.y + (this.velocity.y * this.radius), 1, 1).data
    let colorOfBackground = rgb2hex(imageData[0], imageData[1], imageData[2])
    let isBlack = imageData[0] == 0 && imageData[1] == 0 && imageData[2] == 0
    let blendedColor = isBlack ? this.color : mix_hexes(colorOfBackground, this.color)
    this.color = blendedColor
    context.translate(this.position.x, this.position.y)
    //context.lineWidth = 4
    // TODO draw only on blank canvas and ignore background image for color blending

    context.beginPath()
    const alpha = decimalToHexString(Math.floor(this.opacity * 255));
    context.fillStyle = `${blendedColor}${alpha}`
    context.arc(0, 0, this.radius, 0, Math.PI * 2)
    context.fill()
    context.restore()
  }

  getImageCanvas() {
    const canvas = document.createElement('canvas')
    canvas.width = 2 * this.radius
    canvas.height = 2 * this.radius
    const ctx = canvas.getContext('2d')
    ctx.translate(-this.position.x + this.radius, -this.position.y + this.radius)
    this.draw(ctx)
    
    return canvas
  }
}

function decimalToHexString(number)
{
  if (number < 0)
  {
    number = 0xFFFFFFFF + number + 1;
  }

  return number.toString(16).toUpperCase();
}

function hex2dec(hex) {
  return hex.replace('#', '').match(/.{2}/g).map(n => parseInt(n, 16));
}

function rgb2hex(r, g, b) {
  r = Math.round(r);
  g = Math.round(g);
  b = Math.round(b);
  r = Math.min(r, 255);
  g = Math.min(g, 255);
  b = Math.min(b, 255);
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

function rgb2cmyk(r, g, b) {
  let c = 1 - (r / 255);
  let m = 1 - (g / 255);
  let y = 1 - (b / 255);
  let k = Math.min(c, m, y);
  c = (c - k) / (1 - k);
  m = (m - k) / (1 - k);
  y = (y - k) / (1 - k);
  return [c, m, y, k];
}

function cmyk2rgb(c, m, y, k) {
  let r = c * (1 - k) + k;
  let g = m * (1 - k) + k;
  let b = y * (1 - k) + k;
  r = (1 - r) * 255 + .5;
  g = (1 - g) * 255 + .5;
  b = (1 - b) * 255 + .5;
  return [r, g, b];
}


function mix_cmyks(...cmyks) {
  let c = cmyks.map(cmyk => cmyk[0]).reduce((a, b) => a + b, 0) / cmyks.length;
  let m = cmyks.map(cmyk => cmyk[1]).reduce((a, b) => a + b, 0) / cmyks.length;
  let y = cmyks.map(cmyk => cmyk[2]).reduce((a, b) => a + b, 0) / cmyks.length;
  let k = cmyks.map(cmyk => cmyk[3]).reduce((a, b) => a + b, 0) / cmyks.length;
  return [c, m, y, k];
}

function mix_hexes(...hexes) {
  let rgbs = hexes.map(hex => hex2dec(hex)); 
  let cmyks = rgbs.map(rgb => rgb2cmyk(...rgb));
  let mixture_cmyk = mix_cmyks(...cmyks);
  let mixture_rgb = cmyk2rgb(...mixture_cmyk);
  let mixture_hex = rgb2hex(...mixture_rgb);
  return mixture_hex;
}

function rgbToHsl(r, g, b){
  r /= 255, g /= 255, b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if(max == min){
      h = s = 0; // achromatic
  }else{
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max){
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
  }

  return [h, s, l];
}

function decrease_brightness(r,g,b, percent) {
  console.log(`${r}${g}${b}${percent}`)
  let hsl = rgbToHsl(r,g,b)
  let newBrightness = hsl[2] - hsl[2] * (percent / 100)
  return hslToRgb(hsl[0], hsl[1], newBrightness)
}

function decrease_brightness_hex(hex, percent) {
  let rgbs = hex2dec(hex)
  let hsl = rgbToHsl(...rgbs)
  let newBrightness = hsl[2] - hsl[2] * (percent / 100)
  let newRgbs = hslToRgb(hsl[0], hsl[1], newBrightness)
  return rgb2hex(...newRgbs)
}

function hslToRgb(h, s, l){
  var r, g, b;

  if(s == 0){
      r = g = b = l; // achromatic
  }else{
      function hue2rgb(p, q, t){
          if(t < 0) t += 1;
          if(t > 1) t -= 1;
          if(t < 1/6) return p + (q - p) * 6 * t;
          if(t < 1/2) return q;
          if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
      }

      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
  }

  return [r * 255, g * 255, b * 255];
}