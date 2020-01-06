; (function (win, doc) {
  let runFrame = win.requestAnimationFrame || win.mozRequestAnimationFrame ||
    win.webkitRequestAnimationFrame || win.msRequestAnimationFrame;

  let cancelFrame = win.cancelAnimationFrame || win.mozCancelAnimationFrame;

  class Game {
    constructor(config) {
      const { app } = config
      const fontSize = doc.querySelector('html').style.fontSize
      const toRem = fontSize ? fontSize.replace('px', '') * 1 : 48
      this.ele = doc.querySelector(app)
      this.toRem = toRem
      this.loadList = {
        images: [],
        spritesheets: []
      }
      this.load = {
        image: (key, url, css) => {
          let image = this.createImg(url)
          image.id = key
          this.loadList.images.push({
            key,
            box: image,
            styles: css || {}
          })
        },
        spritesheet: (key, url, css) => {
          let spritesheet = this.createBox(key, url)
          let { width, height, imgStyles } = css
          let styles = { width, height }
          this.loadList.spritesheets.push({
            key,
            box: spritesheet,
            styles,
            imgStyles
          })
        }
      }
      this.add = {
        image: (x, y, key) => {
          this.loadList.images.forEach(item => {
            if (item.key == key) {
              item.styles.left = x
              item.styles.top = y
            }
          })
        },
        spritesheet: (x, y, key) => {
          this.loadList.spritesheets.forEach(item => {
            if (item.key == key) {
              item.styles.left = x
              item.styles.top = y
            }
          })
        }
      }
      this.find = key => {
        let { images, spritesheets } = this.loadList
        let arr = [...images, ...spritesheets]
        let { box } = arr.filter(item => key == item.key)[0]
        return box
      }
      this.hide = key => {
        this.find(key).style.display = 'none'
      }
      this.show = key => {
        this.find(key).style.display = 'block'
      }
    }
    createImg (url) {
      let img = new Image()
      img.src = url
      img.onload = function () {
        img.width /= 2
      }
      return img
    }
    createBox (key, url) {
      let img = this.createImg(url)
      let div = doc.createElement('div')
      div.id = key
      div.appendChild(img)
      return div
    }
  }

  class setStyle extends Game {
    constructor(config) {
      super(config)
      this.styleSheets = ''
      this.isFloat = n => ~~n !== n
      this.getValue = n => {
        let value = n / this.toRem
        this.isFloat(value) && (value = value.toFixed(6))
        return value
      }
      this.createStyles = arr => {
        arr.forEach(item => {
          let str = `#${item.key}{position: absolute;`
          let { styles, imgStyles } = item
          for (const key in styles) {
            str += `${key}:${this.getValue(styles[key])}rem;`
          }
          str += 'overflow:hidden;}'
          if (imgStyles) {
            str += `#${item.key} img{position: relative;`
            for (const key in imgStyles) {
              str += `${key}:${this.getValue(imgStyles[key])}rem;`
            }
            str += '}'
          }
          this.styleSheets += str
        })
      }
      this.addCSS = () => {
        let { images, spritesheets } = this.loadList
        this.createStyles(images)
        this.createStyles(spritesheets)
        doc.querySelector('style').innerHTML += this.styleSheets
      }
      this.loading = () => {
        this.addCSS()
        this.loadList.images.forEach(item => {
          this.ele.appendChild(item.box)
        })
        this.loadList.spritesheets.forEach(item => {
          this.ele.appendChild(item.box)
        })
        return this
      }
    }
    do = fn => {
      fn.bind(this)()
      return this
    }
  }

  class Active extends setStyle {
    constructor(config) {
      super(config)
      this.frameList = {}
      this.isString = n => n === n + ''
      this.rotate = (ele, key) => {
        let deg = 0
        const movie = () => {
          deg++
          ele.style.WebkitTransform = `rotate(${deg}deg)`
          ele.style.transform = `rotate(${deg}deg)`
          this.frameList[key] = runFrame(movie)
        }
        this.frameList[key] = runFrame(movie)
      }
      this.scale = (ele, key) => {
        let duce = 0.01
        let val = 1
        const movie = () => {
          val -= duce
          if (val >= 1 || val <= 0.8) {
            duce = -duce
          }
          ele.style.WebkitTransform = `scale(${val})`
          ele.style.transform = `scale(${val})`
          this.frameList[key] = runFrame(movie)
        }
        this.frameList[key] = runFrame(movie)
      }
      this.active = (key, fn) => {
        let ele = this.find(key)
        if (this.isString(fn)) {
          this[fn](ele, key)
        } else {
          const movie = () => {
            fn(ele)
            this.frameList[key] = runFrame(movie)
          }
          this.frameList[key] = runFrame(movie)
        }
      }
      this.stop = key => {
        cancelFrame(this.frameList[key])
      }
    }
  }

  class Event extends Active {
    constructor(config) {
      super(config)
      this.movie = []
      this.isRunning = false
      const { preload, add, active, event } = config
      this.$touch = (key, fn) => {
        this.find(key).ontouchend = fn.bind(this)
      }
      this.init = () => {
        this.do(preload)
          .do(add)
          .loading()
          .do(active)
          .do(event)
      }
      this.init()
    }
    laterRun (arr) {
      if (arr.length && !this.isRunning) {
        let { fn, time } = arr.shift()
        this.isRunning = true
        if (time) {
          setTimeout(() => {
            this.isRunning = false
            fn.bind(this)()
            this.laterRun(arr)
          }, time);
        } else {
          this.isRunning = false
          fn.bind(this)()
          this.laterRun(arr)
        }
      }
    }
    frame (fn, time) {
      this.movie.push({ fn, time })
      this.laterRun(this.movie)
      return this
    }
  }

  win.ZXL = Event
})(window, document)
