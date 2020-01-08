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
      this.IsNum = (value) => {
        return typeof value === 'number' && !isNaN(value);
      }

      //存放已加载的图片loadList
      this.loadList = []
      //存放已生成到页面的dom元素及对应图片的key
      this.domList = []

      /**
       * @description: 加载图片list
       * @param {string} key
       * @param {string} url
       */
      this.load = (key, url) => {
        new Image().src = url
        this.loadList.push({ key, url })
      }

      this.add = {
        /**
         * @description: 生成dom元素并记录
         * @param {number} x
         * @param {number} y
         * @param {string} key
         */
        image: (x, y, key) => {
          let { url } = this.loadList.filter(i => i.key == key)[0]
          let img = this.createIMG(url)
          img.style.position = 'absolute'
          img.style.left = this.IsNum(x) ? `${x / toRem}rem` : x
          img.style.top = this.IsNum(y) ? `${y / toRem}rem` : y
          this.domList.push({ box: img, key, id: key })
        },
        /**
         * @description: 生成dom元素并记录
         * @param {number} x
         * @param {number} y
         * @param {object} obj {key(对应图片key):id(你要设置的盒子id)}
         */
        spritesheet: (x, y, obj) => {
          let key = Object.keys(obj)
          let id = obj[key]
          let { url } = this.loadList.filter(i => i.key == key)[0]
          let box = this.createBOX(url)
          box.id = id
          box.style.position = 'absolute'
          box.style.left = x ? `${x / toRem}rem` : x
          box.style.top = y ? `${y / toRem}rem` : y
          this.domList.push({ box, key, id })
        }
      }
      this.find = id => {
        return this.domList.filter(item => id == item.id)[0].box
      }
    }
    /**
     * @description: 生成img元素
     * @param {string} url
     * @return: <img>
     */
    createIMG (url) {
      let img = new Image()
      img.src = url
      img.onload = () => {
        img.width /= 2
      }
      return img
    }
    /**
     * @description: 生成精灵盒子元素
     * @param {string} url
     * @return: <div><img></div>
     */
    createBOX (url) {
      let img = new Image()
      img.src = url
      img.onload = () => {
        img.width /= 2
      }
      let div = doc.createElement('div')
      div.appendChild(img)
      return div
    }
    show (id) {
      this.find(id).style.display = 'block'
    }
    hide (id) {
      this.find(id).style.display = 'none'
    }
  }

  class setStyle extends Game {
    constructor(config) {
      super(config)
      this.styleList = []
      this.keyframesSheets = ''
      this.styleSheets = ''
      this.activeSheets = ''
      this.isFloat = n => ~~n !== n
      this.getValue = n => {
        let value = n / this.toRem
        this.isFloat(value) && (value = value.toFixed(6))
        return value
      }
      this.needHack = key => {
        if (key.indexOf('transform') !== -1) {
          return `-webkit-${key}`
        } else {
          return false
        }
      }
      this.forInStyles = obj => {
        let str = ''
        for (const key in obj) {
          if (key !== 'imgStyles') {
            if (this.IsNum(obj[key])) {
              if (this.needHack(key)) {
                str += `${this.needHack(key)}:${this.getValue(obj[key])}rem;`
              }
              str += `${key}:${this.getValue(obj[key])}rem;`
            } else {
              if (this.needHack(key)) {
                str += `${this.needHack(key)}:${obj[key]};`
              }
              str += `${key}:${obj[key]};`
            }
          }
        }
        return str
      }
      /**
       * @description: 集成styleSheets,推至style标签内
       * @param {[{styles,id:String,imgStyles}]} arr
       */
      this.createStyles = arr => {
        arr.forEach(item => {
          let { styles, id } = item
          let str = `#${id}{position: absolute;`
          str += this.forInStyles(styles)
          str += 'overflow:hidden;}'
          let { imgStyles } = styles
          if (imgStyles) {
            str += `#${id} img{position: relative;`
            str += this.forInStyles(imgStyles)
            str += '}'
          }
          this.styleSheets += str
        })
      }
      this.setStyles = {
        image: (key, styles) => {
          this.styleList.push({ key, styles, id: key })
        },
        spritesheet: (obj, styles) => {
          let key = Object.keys(obj)[0]
          let id = obj[key]
          this.styleList.push({ key, styles, id })
        },
        active: (key, className, styles) => {
          let str = `#${key}.${className} img{`
          for (const a in styles) {
            if (this.IsNum(styles[a])) {
              str += `${a}:${this.getValue(styles[a])}rem;`
            } else {
              str += `${a}:${style[a]};`
            }
          }
          str += '}'
          this.activeSheets = str
        },
        keyframes: (name, step, stepStyle, frameDetail) => {
          let str = `${name}{`
          let stepValue = parseInt(100 / (step - 1))
          Array.from(new Array(step)).forEach((i, idx) => {
            let persent = idx * stepValue
            str += `${persent}%{`
            for (let key in stepStyle[idx]) {
              let vals = stepStyle[idx][key]
              let setIn = ''
              if (this.IsNum(vals)) {
                if (this.needHack(key)) {
                  setIn = `${this.needHack(key)}:${this.getValue(vals)}rem;`
                }
                setIn += `${key}:${this.getValue(vals)}rem;`
              } else {
                if (this.needHack(key)) {
                  setIn = `${this.needHack(key)}:${vals};`
                }
                setIn += `${key}:${vals};`
              }
              str += setIn
            }
            str += '}'
          })
          str += '}'
          this.keyframesSheets += ` @-webkit-keyframes ${str} @keyframes ${str}`
          this.keyframesSheets += ` .${name}{-webkit-animation:${name} ${frameDetail};animation:${name} ${frameDetail};}`
        }
      }
      this.addCSS = () => {
        this.styleSheets += this.keyframesSheets
        this.createStyles(this.styleList)
        this.styleSheets += this.activeSheets
        doc.querySelector('style').innerHTML += this.styleSheets
      }
      this.loading = () => {
        this.addCSS()
        this.domList.forEach(item => {
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
      this.keyframesList = {}
      this.isString = n => n === n + ''
      /**
       * @description: 执行默认特效
       * @param {Node} ele 
       * @param {[]} area 
       * @param {string} key 
       */
      this.goFrame = (ele, area, key) => {
        const min = area[0]
        const max = area[1]
        let ud = area[2]
        let deg = min
        let value = null
        let id = ele.id
        if (key == 'rotate') {
          value = deg => {
            return `${key}(${deg}deg)`
          }
        } else if (key == 'scale') {
          value = deg => {
            return `${key}(${deg})`
          }
        }
        const movie = () => {
          deg -= ud
          if (deg >= min || deg <= max) {
            ud = -ud
          }
          ele.style.WebkitTransform = value(deg)
          ele.style.transform = value(deg)
          this.frameList[id] = runFrame(movie)
        }
        this.frameList[id] = runFrame(movie)
      }
      /**
       * @description: 指定元素执行特效
       * @param {string} key
       * @param {[]} area
       * @param {Function} fn
       */
      this.active = {
        frame: (key, area, fn) => {
          let ele = this.find(key)
          if (this.isString(fn)) {
            this.goFrame(ele, area, fn)
          } else {
            const movie = () => {
              fn(ele)
              this.frameList[key] = runFrame(movie)
            }
            this.frameList[key] = runFrame(movie)
          }
        },
        keyframes: (obj, time) => {
          let id = Object.keys(obj)
          let ele = this.find(id)
          this.keyframesList[id] = setInterval(() => {
            ele.className = ele.className == obj[id] ? '' : obj[id]
          }, time);
        }
      }
      this.stop = {
        frame: key => {
          cancelFrame(this.frameList[key])
        },
        keyframes: id => {
          clearInterval(this.keyframesList[id])
          this.find(id).className = ''
        }
      }
    }
  }

  class Event extends Active {
    constructor(config) {
      super(config)
      const { preload, setStyles, add, active, event } = config
      this.movie = []
      this.timer = []
      this.isRunning = false
      this.$touch = (key, fn) => {
        this.find(key).ontouchend = fn.bind(this)
      }
      this.init = () => {
        this.do(preload)
          .do(setStyles)
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
        setTimeout(() => {
          this.isRunning = false
          fn.bind(this)()
          this.laterRun(arr)
        }, time || 0);
      }
    }
    frame (fn, time) {
      this.movie.push({ fn, time })
      this.laterRun(this.movie)
      return this
    }
    sTimeFn (key, fn, time) {
      this.timer[key] = setInterval(fn.bind(this), time);
    }
  }

  win.ZXL = Event
})(window, document)