# 使用说明

```js
//加载图片
  load.image(key: String, url: String, style: Object)

//精灵图的情况
  load.spritesheet(key: String, url: String,
    style: {
      imgStyles: Object
    }
  )

//定位元素并放置
  add.image(x: Number, y: Number, key: String)
  add.spritesheet(x: Number, y: Number, key: String)

//绑定事件(touchend)
  $touch(key: String, fn: Function)

//启动特效
  active(key: String, fn: Function||String)

//停止特效
  stop(key: String)

//延时执行
  frame(fn: Function, time: Number)
```

## 栗子

```html
soon
```
