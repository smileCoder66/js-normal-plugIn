; (function (win, doc) {
  let runFrame = win.requestAnimationFrame || win.mozRequestAnimationFrame ||
    win.webkitRequestAnimationFrame || win.msRequestAnimationFrame;

  let cancelFrame = win.cancelAnimationFrame || win.mozCancelAnimationFrame;

  class Game {
    constructor(config) {
      const { app, preload } = config
      const fontSize = doc.querySelector('html').style.fontSize
      this.toRem = fontSize ? fontSize.replace('px', '') * 1 : 48
      this.ele = doc.querySelector(app)

      this.IsNum = (value) => {
        return typeof value === 'number' && !isNaN(value)
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

      this.find = id => {
        let ele = null
        this.domList.forEach(item => {
          if (id == item.id) {
            ele = item.box
          } else if (item.box.querySelector(`#${id}`)) {
            ele = item.box.querySelector(`#${id}`)
          } else if (item.box.querySelector(`.${id}`)) {
            ele = item.box.querySelector(`.${id}`)
          }
        })
        ele = ele || doc.querySelector(`#${id}`)
        return ele
      }

      this.do = fn => {
        fn.bind(this)()
        return this
      }

      this.do(preload)
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

  class Fun extends Game {
    constructor(config) {
      super(config)
      // this.coinTimes = getCookie(`coins${lpid}`) || 8
      this.advertiseTime = null

      this.getParms = obj => {
        let str = ''
        for (const a in obj) {
          str += `${a}=${obj[a]}&`
        }
        return str
      }

      this.clearCheck = () => {
        clearInterval(this.advertiseTime)
      }

      this.ajax = opt => {
        let defaults = { async: true, data: '', ...opt }
        let xhr = new XMLHttpRequest();
        if (defaults.type.toLowerCase() == 'get') {
          defaults.url += '?' + this.getParms(defaults.data);
          xhr.open('get', defaults.url, defaults.async);
          xhr.send(null);
        } else {
          xhr.open('post', defaults.url, defaults.async);
          xhr.setRequestHeader('content-type',
            'application/x-www-form-urlencoded');
          xhr.send(defaults.data);
        }
        xhr.onreadystatechange = function () {
          if (xhr.readyState == 4) {
            if (xhr.status == 200) {
              defaults.success(xhr.responseText);
            } else {
              console('错误是：' + xhr.status);
            }
          }
        }
      }

      this.checkImg = img => {
        this.advertiseTime = setInterval(() => {
          imgLoad(img, () => {
            if (!img.complete) {
              img.src = ''
              img.src = data.iurl
            } else {
              clearInterval(this.advertiseTime);
              StatisticsPix('ad_imp')
            }
          })
        }, 4000);
      }

    }
  }

  class setStyle extends Fun {
    constructor(config) {
      super(config)
      const { setStyles } = config
      this.styleList = []
      this.styleSheets = ''
      this.keyframesSheets = ''
      this.activeSheets = ''
      this.renderSheets = ''
      this.isFloat = n => ~~n !== n

      /**
       * @description: 浮点数 && rem保留小数点
       * @param {number} n
       * @return:float || int
       */
      this.getValue = n => {
        let value = n / this.toRem
        this.isFloat(value) && (value = value.toFixed(6))
        return value
      }

      /**
       * @description:驼峰大小写分割 
       * @param {string} str 
       * @return: in:fontSize out:font-size
       */
      this.strsplit = str => {
        let arr = str.split(/(?=[A-Z])/);
        return arr.join('-').toLowerCase();
      }

      /**
       * @description: 兼容css3前缀
       * @param {string} key 
       * @return {boolean}
       */
      this.needHack = key => {
        if (key.indexOf('transform') !== -1 || key.indexOf('animation') !== -1) {
          return `-webkit-${key}`
        } else {
          return false
        }
      }

      /**
       * @description: 兼容样式集合
       * @param {{}} css
       * @param {[]} filterArr
       * @return: 兼容后的css内容
       */
      this.forStyles = (css, filterArr) => {
        let str = ''
        !filterArr && (filterArr = [])
        Object.keys(css).filter(key => !filterArr.includes(key)).forEach(key => {
          if (this.IsNum(css[key])) {
            str += `${this.strsplit(key)}:${this.getValue(css[key])}rem;`
          } else {
            if (this.needHack(key)) {
              str += `${this.needHack(this.strsplit(key))}:${css[key]};`
            }
            str += `${this.strsplit(key)}:${css[key]};`
          }
        })
        return str
      }

      /**
       * @description: 集成styleSheets,推至style标签内
       * @param {[{styles,id:String,imgStyles}]} arr
       * @return {string}
       */
      this.createStyles = arr => {
        let str = ''
        arr.forEach(item => {
          let { styles, id } = item
          str += `#${id}{position: absolute;${this.forStyles(styles, ['imgStyles'])}overflow:hidden;}`
          let { imgStyles } = styles
          if (imgStyles) {
            str += `#${id} img{position: relative;${this.forStyles(imgStyles)}}`
          }
        })
        return str
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
        active: (key, styles) => {
          let str = `#${key}.active img{`
          for (const a in styles) {
            if (this.IsNum(styles[a])) {
              str += `${a}:${this.getValue(styles[a])}rem;`
            } else {
              str += `${a}:${style[a]};`
            }
          }
          this.activeSheets = `${str}}`
        },
        keyframes: (name, step, stepStyle, frameDetail) => {
          let str = `${name}{`
          let stepValue = parseInt(100 / (step - 1))
          Array.from(new Array(step)).forEach((i, idx) => {
            let persent = idx * stepValue
            str += `${persent}%{${this.forStyles(stepStyle[idx])}}`
          })
          str += '}'
          this.keyframesSheets += ` @-webkit-keyframes ${str} @keyframes ${str}`
          this.keyframesSheets += ` .${name}{-webkit-animation:${name} ${frameDetail};animation:${name} ${frameDetail};}`
        }
      }

      this.addCSS = () => {
        this.styleSheets += this.keyframesSheets + this.createStyles(this.styleList) + this.activeSheets + this.renderSheets
        doc.querySelector('style').innerHTML += this.styleSheets
      }

      this.do(setStyles)
    }
  }

  class Add extends setStyle {
    constructor(config) {
      super(config)
      const { add } = config

      this.setCSS = (ele, css) => {
        let { id, className } = ele
        let i = id ? `#${id}` : ''
        let c = className ? `.${className}` : ''
        if (i || c) {
          let str = `${i}${c}{position:absolute;`
          let fArr = ['id', 'className', 'props', 'font']
          str += `${this.forStyles(css, fArr)}}`
          this.renderSheets += str
        }
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
          img.id = key
          img.style.position = 'absolute'
          img.style.left = this.IsNum(x) ? `${x / this.toRem}rem` : x
          img.style.top = this.IsNum(y) ? `${y / this.toRem}rem` : y
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
          box.style.left = x ? `${x / this.toRem}rem` : x
          box.style.top = y ? `${y / this.toRem}rem` : y
          this.domList.push({ box, key, id })
        },
        render: fn => {
          /**
           * @description: 仿render
           * @param {string} type
           * @param {{}} css
           * @param {Array} childs
           * @return {HTMLElement}
           */
          const h = (type, css, childs) => {
            let ele = doc.createElement(type)
            let { id, className } = css || {}
            if (id) {
              ele.id = id
              if (type == 'img') {
                let arr = this.loadList.filter(i => i.key == id)[0]
                ele.src = arr ? arr.url : ''
              }
            }
            className && (ele.className = className)
            this.setCSS(ele, css)
            if (childs && childs.length) {
              childs.forEach(i => {
                if (typeof (i) !== 'string') {
                  ele.appendChild(i)
                } else {
                  ele.innerText += i
                }
              })
            }
            return ele
          }
          let box = fn.bind(this)(h)
          this.domList.push({ box, key: box.id, id: box.id })
        }
      }

      this.loading = () => {
        this.addCSS()
        this.domList.forEach(item => {
          this.ele.appendChild(item.box)
        })
        return this
      }

      this.do(add).loading()
    }
  }

  class Active extends Add {
    constructor(config) {
      super(config)
      const { active } = config
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
        let [min, max, ud] = area
        let deg = min
        let value = null
        let id = ele.id
        if (key == 'rotate') {
          value = deg => `${key}(${deg}deg)`
        } else if (key == 'scale') {
          value = deg => `${key}(${deg})`
        }
        const movie = () => {
          deg += ud
          if (deg <= min || deg >= max) {
            ud = -ud
          }
          ele.style.WebkitTransform = value(deg)
          ele.style.transform = value(deg)
          this.frameList[id] = runFrame(movie)
        }
        this.frameList[id] = runFrame(movie)
      }

      this.makeSimple = (ele, active, val) => {
        ele.style[this.needHack('transform')] = `${active}(${val}${active == 'rotate' ? 'deg' : ''})`
        ele.style.transform = `${active}(${val}${active == 'rotate' ? 'deg' : ''})`
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
          let id = Object.keys(obj)[0]
          let ele = this.find(id)
          this.keyframesList[id] = setInterval(() => {
            ele.className = ele.className == obj[id] ? '' : obj[id]
          }, time);
        },
        speed: (key, sty, time) => {
          let ele = this.find(key)
          let { active, area } = sty
          let [bg, ed] = area
          this.makeSimple(ele, active, bg)
          ele.style.transition = `all ${time / 1000}s`
          this.makeSimple(ele, active, ed)
          setTimeout(() => {
            ele.style.transition = 'all 0s'
            setTimeout(() => {
              this.makeSimple(ele, active, bg)
            }, 500)
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
      active && this.do(active)
    }
  }

  class Event extends Active {
    constructor(config) {
      super(config)
      const { event } = config
      this.movie = []
      this.classTimer = []
      this.isRunning = false
      this.openTouch = {}
      this.watchs = {}
      this.watchsTimer = {}

      this.watchProps = (id, key, eleID) => {
        let ele = this.find(eleID)
        let a = null
        Object.defineProperty(this.watchs, id, {
          get: function () {
            return a
          },
          set: function (val) {
            a = val
            ele[key] = val
          }
        })
      }

      this.hasTime = () => {
        this.watchs.coinTimes = getCookie(`coins${lpid}`) || 8
        return this.watchs.coinTimes > 0
      }

      this.calCoins = () => {
        this.watchs.coinTimes--
        let timeStamp = new Date()
        timeStamp.setTime(timeStamp.getTime() + 24 * 3600 * 1000)
        timeStamp.setHours(0, 0, 0, 0)
        doc.cookie = `coins${lpid}=${escape(this.watchs.coinTimes)};expires=${timeStamp.toGMTString()}`
      }

      this.$touch = (key, opKey, fn) => {
        let ele = typeof key === 'string' ? this.find(key) : key
        if (opKey) {
          ele.ontouchend = () => {
            if (!this.openTouch[opKey]) {
              this.openTouch[opKey] = true
              fn.bind(this)()
            }
          }
        } else {
          ele.ontouchend = fn.bind(this)
        }
      }

      this.return = (opKey) => {
        this.openTouch[opKey] = false
      }

      this.do(event)
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
  }

  win.ZXL = Event
})(window, document)