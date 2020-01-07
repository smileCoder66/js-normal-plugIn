### 使用说明

```js
//加载图片
load(key: String, url: String)

//设置样式
setStyles.image(key: String, style: Object)
setStyles.spritesheet({
  '已load的key': '你要设置的元素id'
}, style: {..., imgStyles: Object})

//定位元素并放置
add.image(x: Number, y: Number, key: String)
add.spritesheet(x: Number, y: Number, {
  '已load的key': '你要设置的元素id'
})

//绑定事件(touchend)
$touch(key: String, fn: Function)

//启动特效
active(key: String, fn: Function||String)

//停止特效
stop(key: String)

//延时执行
frame(fn: Function, time: Number)
```

### 栗子

```html
正在完善,后续会补充和插件注释
```
