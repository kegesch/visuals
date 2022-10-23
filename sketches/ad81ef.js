const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const Color = require('canvas-sketch-util/color');
const { degToRad } = require('canvas-sketch-util/math');
const Tweakpane = require('tweakpane');


const settings = {
  dimensions: [ 2048, 2048 ]
};

Array.Enumerate = (count) => {
    let keys = new Array(count).keys();
    return [...keys];
}

const greenColors = [
    "#F8EDE3",
    "#BDD2B6",
    "#A2B29F",
    "#798777"
]

const redColors = [
    "#FFF2F2",
    "#FAD4D4",
    "#EF9F9F",
    "#F47C7C"
]

const colors = greenColors

let params = {
    linesCount: 10,
    maxGapCount: 3,
    rotation: 0,
    yTranslate: 0,
    xTranslate: 0,
}

const sketch = async () => {
  return ({ context, width, height }) => {
      context.fillStyle = colors[0];
      context.fillRect(0, 0, width, height);

      context.strokeStyle = '#000000'
      context.lineWidth = 2

      let segmentCount = params.linesCount

      let segments = Array.Enumerate(segmentCount).map(i => {
          return LineSegement.newRandom(width, height)
      })

      segments.sort((segA, segB) => segA.startY - segB.startY)
      context.translate(params.xTranslate, params.yTranslate)
      context.rotate(degToRad(params.rotation))
      segments.forEach(seg => seg.draw(context, width, height))

  };
};

let canvasManager

const createPane = (dimensions) => {
    const pane = new Tweakpane.Pane()
    let folder

    folder = pane.addFolder({title: 'Lines'})
    folder.addInput(params, 'linesCount', { min: 1, max: 100, step: 1})
    folder.addInput(params, 'maxGapCount', { min: 1, max: 10, step: 1})
    folder.addInput(params, 'rotation', { min: 0, max: 180, step: 10 })
    folder.addInput(params, 'xTranslate', { min: -1 * dimensions[0], max: dimensions[0], step: 100 })
    folder.addInput(params, 'yTranslate', { min: -1 * dimensions[1], max: dimensions[1], step: 100 })

    const btn = pane.addButton({
        title: 'Increment',
    });
    btn.on('click', () => {
        canvasManager.render()
    })
}

const start = async () => {
    canvasManager = await canvasSketch(sketch, settings);
    createPane(settings.dimensions)
}

start()

const gapHeightFactors = [0.02, 0.05, 0.1, 0.2, 0.5, 0.9]
const gapWidthFactors = [0.08, 0.1, 0.2, 0.2, 0.4, 0.5]
const gapRandomWeights = gapHeightFactors.map((_, index) => Math.pow(2, gapHeightFactors.length - index))

class Gap {
    static newRandom(width, height) {
        let randomIndex = random.weighted(gapRandomWeights)
        let gapHeight = gapHeightFactors[randomIndex] * height // random.range(height * 0.02, height * 0.1)
        let gapOffsetX = random.range(0.2, 0.8) * width
        let gapWidth = gapWidthFactors[randomIndex] * width //random.range(0.08, 0.1) * width
        return new Gap(gapOffsetX, gapWidth, gapHeight)
    }
    constructor(gapOffsetX, gapWidth, gapHeight) {
        this.gapOffsetX = gapOffsetX
        this.gapWidth = gapWidth
        this.gapHeight = gapHeight
    }
}

class LineSegement {

    static newRandom(width, height) {
        let startY = random.range(0, height)
        //let color = Color.parse([ random.range(0, 255),random.range(0, 255), random.range(0, 255), 1 ])


        let gapsCount = parseInt(random.range(1, params.maxGapCount), 10)
        let gaps = Array.Enumerate(gapsCount).map(i => Gap.newRandom(width, height))
        let isDownwards = false //random.chance()
        let colorSelection = isDownwards ? redColors : greenColors
        let availableColors = [colorSelection[1], colorSelection[2], colorSelection[3]]
        let color = Color.blend(colors[0], random.pick(availableColors), 0.8)

        return new LineSegement(startY, gaps, color, isDownwards)
    }
    constructor(startY, gaps, color, isDownwards) {
        this.startY = startY
        this.gaps = gaps
        this.color = color
        this.isDownwards = isDownwards
    }

    add(a, b) {
        return a + (this.isDownwards ? b : -b)
    }

    draw(context, width, height) {
        context.beginPath()
        context.moveTo(0, this.startY)

        let lastAfterGapY = this.startY;
        let lastAfterGapX = 0
        for(let i = 0; i < this.gaps.length; i++) {
            let gap = this.gaps[i]
            let xStart = lastAfterGapX + gap.gapOffsetX
            context.lineTo(xStart, lastAfterGapY)

            let c1 = { x: xStart + (gap.gapWidth) * 0.7, y: lastAfterGapY }
            let afterGapY = this.add(lastAfterGapY, gap.gapHeight)
            let c2 = { x: xStart + (gap.gapWidth) * 0.3, y: afterGapY }

            let afterGapX = xStart + gap.gapWidth

            context.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, afterGapX, afterGapY);

            lastAfterGapX = afterGapX
            lastAfterGapY = afterGapY
        }

        const lineWidth = 20

        context.lineTo(width + lineWidth, lastAfterGapY)
        context.lineTo(width + lineWidth, height + lineWidth)
        context.lineTo(0 - lineWidth, height + lineWidth)
        context.lineTo(0 - lineWidth, this.startY)

        const gradientStart = this.isDownwards ? this.startY : lastAfterGapY
        const gradient = context.createLinearGradient(0, gradientStart, 0, gradientStart + height * 0.3)
        gradient.addColorStop(0, this.color.hex)
        const endColor = Color.blend(colors[0], this.color.hex, 0.1)
        //gradient.addColorStop(0.3, `rgba(${endColor.rgb[0]}, ${endColor.rgb[1]}, ${endColor.rgb[2]}, 0.5)`)
        gradient.addColorStop(1, `rgba(${endColor.rgb[0]}, ${endColor.rgb[1]}, ${endColor.rgb[2]}, 0)`)

        context.strokeStyle = this.color.hex
        context.lineWidth = lineWidth
        context.fillStyle = gradient
        context.fill()
        context.stroke()
    }
}