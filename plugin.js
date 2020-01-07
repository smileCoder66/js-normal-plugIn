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
          img.style.left = x ? `${x / toRem}rem` : x
          img.style.top = y ? `${y / toRem}rem` : y
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
      this.styleSheets = ''
      this.isFloat = n => ~~n !== n
      this.getValue = n => {
        let value = n / this.toRem
        this.isFloat(value) && (value = value.toFixed(6))
        return value
      }
      this.forInStyles = obj =>{
        let str = ''
        for (const key in obj) {
          if (key !== 'imgStyles') {
            str += `${key}:${this.getValue(obj[key])}rem;`
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
          this.styleList.push({ key, styles })
        },
        /**
         * @description: 
         * @param {{key:string,id:string}} obj
         * @param {{}} styles
         * @return: 
         */        
        spritesheet: (obj, styles) => {
          let key = Object.keys(obj)[0]
          let id = obj[key]
          this.styleList.push({ key, styles, id })
        }
      }
      this.addCSS = () => {
        this.createStyles(this.styleList)
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
      const { preload, setStyles, add, active, event } = config
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