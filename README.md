### 使用说明

```js
//加载图片
load(key: String, url: String)

//设置样式
setStyles.image(key: String, style: Object)

setStyles.spritesheet({
  '已load的key': '你要设置的元素id'
}, style: {..., imgStyles: Object})

setStyles.keyframes(key: String, step: Number, frameStyle: [{}], frameDetail: String)
  //step:分多少步完成动画特效,frameStyle:每一步设置的特效样式
  //(frameStyle内数据需对应step的步数,frameDetail:类似写入css的animation值,无需写动画名已绑定对应key)

//定位元素并放置
add.image(x: Number, y: Number, key: String)
add.spritesheet(x: Number, y: Number, {
  '已load的key': '你要设置的元素id'
})
add.render(fn: Function)

//绑定事件(touchend)
$touch(key: String, fn: Function)

//启动特效
active.frame(key: String, area: [min, max, ud], fn: String || Function)
  //fn为string则代表使用默认特效(scale,rotate)并且area无效,具体查看plugin.js
this.active.keyframes({ '元素id': '已设置keyframes的key' }, time: Number)

//停止特效
stop.frame(key: String)
stop.keyframes(key: String)

//延时执行
frame(fn: Function, time: Number)
```

### 栗子

```js
//仿render
this.add.render(h => {
  //h(etype, css, childs)
  return h('div', {}, [
    h('p', {}, [
      h('span', {})
    ]),
    h('h2')
  ])
})
/*
  <div>
    <p><span></span><p>
    <h2></h2>
  </div>
*/
```

```html
正在完善,后续会完善功能及补充注释
```
