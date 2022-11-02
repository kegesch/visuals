const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const Color = require('canvas-sketch-util/color');
const { degToRad } = require('canvas-sketch-util/math');
const Tweakpane = require('tweakpane');
const lemon = require('lemon.markets.js').default;

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

const purpleColors = [
    "#EEF1FF",
    "#B1B2FF",
    "#AAC4FF",
    "#D2DAFF"
]



let params = {
    linesCount: 10,
    maxGapCount: 3,
    rotation: 0,
    yTranslate: 0,
    xTranslate: 0,
    colorPalette: "purple",
}

const getColor = () => {
    switch (params.colorPalette) {
        case "green": return greenColors;
        case "purple": return purpleColors;
        case "red": return redColors;
    }
}

const sketch = async () => {
  return ({ context, width, height }) => {
      context.fillStyle = getColor()[0];
      context.fillRect(0, 0, width, height);

      context.strokeStyle = '#000000'
      context.lineWidth = 2

      let segmentCount = params.linesCount

      let segments = Array.Enumerate(segmentCount).map(i => {
          return LineSegement.newRandom(width, height)
      })

      segments.sort((segA, segB) => segA.startY - segB.startY)
      context.save()
      context.rotate(degToRad(params.rotation))
      context.translate(params.xTranslate, params.yTranslate)
      segments.forEach(seg => seg.draw(context, width, height))

      console.log(candleData)
      var max = Math.max(...candleData.map(c => c.h))
      var min = Math.min(...candleData.map(c => c.l))
      var maxHeight = max - min
      var baseX = 0.07 * width
      var baseY = 0.07 * height
      const xMargin = 15

      var maxHeightPixel = 1/3 * height - 2 * baseX
      var pixelPerPriceUnit = maxHeightPixel / maxHeight 

      var candles = candleData.map(candle => {
        let height = (candle.h - candle.l) * pixelPerPriceUnit
        let pillHeight = Math.abs(candle.o - candle.c) * pixelPerPriceUnit
        let yOffset = (candle.l - min) * pixelPerPriceUnit
        let pillTopOffset = (candle.h - Math.max(candle.o, candle.c)) * pixelPerPriceUnit

        let c = new Candle(baseX, baseY + yOffset, height, pillHeight, pillTopOffset);
        baseX = baseX + 20 + xMargin

        return c
      })
      context.restore()

      candles.forEach(c => c.draw(context))

  };
};

let canvasManager

const createPane = (dimensions) => {
    const pane = new Tweakpane.Pane()
    let folder

    folder = pane.addFolder({title: 'Lines'})
    
    folder.addInput(params, 'colorPalette', { options: { green: "green", red: "red", purple: "purple"}})
    folder.addInput(params, 'linesCount', { min: 1, max: 100, step: 1})
    folder.addInput(params, 'maxGapCount', { min: 1, max: 10, step: 1})
    folder.addInput(params, 'rotation', { min: 0, max: 180, step: 10 })
    folder.addInput(params, 'xTranslate', { min: -1 * dimensions[0], max: dimensions[0], step: 100 })
    folder.addInput(params, 'yTranslate', { min: -1 * dimensions[1], max: dimensions[1], step: 100 })

    const btn = pane.addButton({
        title: 'Apply',
    });
    btn.on('click', () => {
        canvasManager.render()
    })
}

let candleData;

const start = async () => {
    const client = new lemon.Client({
        mode: 'paper',
        tradingKey: process.env.LEMON_MARKETS_MARKET_KEY
    })
    
    yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday = new Date(yesterday.toDateString())
    yesterday = new Date(yesterday.getTime() - yesterday.getTimezoneOffset() * 60000)

    // get eth data
    let page = await client.ohlc.get({
        x1: "h1",
        isin: "DE0005557508",
        from: yesterday,
    })
    while(page.values.length == 0) {
        yesterday.setDate(yesterday.getDate() - 1);
        page = await client.ohlc.get({
            x1: "h1",
            isin: "DE0005557508",
            from: yesterday,
        })
    }
    candleData = page.values

    
    canvasManager = await canvasSketch(sketch, settings);
    createPane(settings.dimensions)
}

start()

const gapHeightFactors = [0.02, 0.05, 0.1, 0.2, 1/3, 2/3]
const gapWidthFactors = [0.08, 0.1, 0.2, 0.2, 0.4, 0.5]
const gapRandomWeights = gapHeightFactors.map((_, index) => Math.pow(2, gapHeightFactors.length - index))

class Gap {
    static newRandom(width, height) {
        let randomIndex = random.weighted(gapRandomWeights)
        let gapHeight = gapHeightFactors[randomIndex] * height // random.range(height * 0.02, height * 0.1)
        let gapOffsetX = random.range(0.05, 0.8) * width
        let gapWidth = gapWidthFactors[randomIndex] * width //random.range(0.08, 0.1) * width
        let isUpwards = random.range(0, 9) < 8
        return new Gap(gapOffsetX, gapWidth, gapHeight, isUpwards)
    }
    constructor(gapOffsetX, gapWidth, gapHeight, isUpwards) {
        this.gapOffsetX = gapOffsetX
        this.gapWidth = gapWidth
        this.gapHeight = gapHeight
        this.isUpwards = isUpwards
    }
}

class Candle {
    constructor(x, y, wickHeight, pillHeight, pillTopOffset) {
        this.x = x
        this.y = y
        this.wickHeight = wickHeight
        this.pill = new Pill(x, y + pillTopOffset, pillHeight)
    }    

    draw(context) {
        context.beginPath()
        context.moveTo(this.x, this.y)
        context.lineTo(this.x, this.y + this.wickHeight)
        
        const lineWidth = 2
        context.strokeStyle = getColor()[1]
        context.lineWidth = lineWidth
        context.stroke()
        
        this.pill.draw(context)
    }
}

class Pill {
    constructor(x, y, height) {
        this.x = x
        this.y = y
        this.height = height
    }

    draw(context) {
        const lineWidth = 20

        context.beginPath()
        context.moveTo(this.x, this.y)
        context.lineTo(this.x, this.y + this.height)
        
        context.strokeStyle = getColor()[1]
        context.lineWidth = lineWidth
        context.lineCap = "round"
        context.stroke()
    }
}

class LineSegement {

    static newRandom(width, height) {
        let startY = random.range(1/3 * height, height)
        let gapsCount = parseInt(random.range(1, params.maxGapCount), 10)
        let gaps = Array.Enumerate(gapsCount).map(i => Gap.newRandom(width, height))
        let availableColors = getColor().slice(1)
        let color = Color.blend(getColor()[0], random.pick(availableColors), 0.8)

        return new LineSegement(startY, gaps, color)
    }
    constructor(startY, gaps, color) {
        this.startY = startY
        this.gaps = gaps
        this.color = color
    }

    add(a, b, isDownwards) {
        return a + (isDownwards ? b : -b)
    }

    draw(context, width, height) {
        context.beginPath()
        context.moveTo(-width, this.startY)

        let lastAfterGapY = this.startY;
        let lastAfterGapX = 0
        for(let i = 0; i < this.gaps.length; i++) {
            let gap = this.gaps[i]
            let xStart = lastAfterGapX + gap.gapOffsetX
            context.lineTo(xStart, lastAfterGapY)

            let c1 = { x: xStart + (gap.gapWidth) * 0.7, y: lastAfterGapY }
            let afterGapY = this.add(lastAfterGapY, gap.gapHeight, !gap.isUpwards)
            let c2 = { x: xStart + (gap.gapWidth) * 0.3, y: afterGapY }

            let afterGapX = xStart + gap.gapWidth

            context.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, afterGapX, afterGapY);

            lastAfterGapX = afterGapX
            lastAfterGapY = afterGapY
        }

        const lineWidth = 20

        context.lineTo(2*width + lineWidth, lastAfterGapY)
        context.lineTo(2*width + lineWidth, 2*height + lineWidth)
        context.lineTo(-width - lineWidth, 2*height + lineWidth)
        context.lineTo(-width - lineWidth, this.startY)

        const gradientStart = this.isDownwards ? this.startY : lastAfterGapY
        const gradient = context.createLinearGradient(0, gradientStart, 0, gradientStart + height * 0.3)
        gradient.addColorStop(0, this.color.hex)
        const endColor = Color.blend(getColor()[0], this.color.hex, 0.1)
        //gradient.addColorStop(0.3, `rgba(${endColor.rgb[0]}, ${endColor.rgb[1]}, ${endColor.rgb[2]}, 0.5)`)
        gradient.addColorStop(1, `rgba(${endColor.rgb[0]}, ${endColor.rgb[1]}, ${endColor.rgb[2]}, 0)`)

        context.strokeStyle = this.color.hex
        context.lineWidth = lineWidth
        context.fillStyle = gradient
        context.fill()
        context.stroke()
    }
}