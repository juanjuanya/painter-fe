import React, { Component } from "react";
import ReactDOM from 'react-dom'
import _ from 'lodash'


function getMousePos(e) {
  var layerX = e.layerX
  var layerY = e.layerY
  var zoom = e.target.style.transform.match(/scale\((.*?)\)/)[1]
  // console.log('zoom',zoom)
  return [
    Math.floor(layerX / zoom),
    Math.floor(layerY / zoom)
  ]
  
}

var canvasStyle = {
  // position: 'absolute', //div包了一下
  display: 'block',
  transformOrigin:'top left',
  isPickingColor:false, //取色功能
}

////定义一个函数画图片render
function createImageFromArrayBuffer(buf) {//等图片加载完onload的时候再画
  return new Promise(resolve => {

    var blob = new Blob([buf], {type: 'image/png'})
    var image = new Image()
    var url = URL.createObjectURL(blob)
    image.src = url
    image.onload = function () {
      resolve(image)
    }
  })
}

class PixelGrid extends Component {
  //不写也相当于这么写，构造函数会自动调上面的内容
  constructor(props) {
    super(props)
    this.state = {
      zoomLevel: 1,
      dotHoverX: -1,
      dotHoverY: -1,
      width:100,
      height:100,
    }
    this.canvas = null
    this.socket = this.props.socket
  }

  setUpZoomHandler = () => {
    this.canvasWrapper.addEventListener('mousewheel', e => {
      console.log(e)
      var mouseLayerX = e.layerX
      var mouseLayerY = e.layerY  //中心点放大，鼠标就点不准了，有偏移
      console.log('layer', e.layerX, e.layerY)
      console.log('offset', e.offsetY, e.offsetY)

      var oldZoomLevel = this.state.zoomLevel
      var newZoomLevel 
      if(e.deltaY < 0) {
        newZoomLevel = this.state.zoomLevel + 1
      } else {
        newZoomLevel = this.state.zoomLevel - 1
      }

      var zoomRatio = newZoomLevel / oldZoomLevel

      
      var a = oldZoomLevel
      var b = newZoomLevel
      var x = mouseLayerX
      var y = mouseLayerY
      var l1 = parseFloat(this.canvasWrapper.style.left)
      var t1 = parseFloat(this.canvasWrapper.style.top)

      // var l2 = (-(b/a - 1) * x + l1 *a) / b
      // var t2 = (-(b/a - 1) * y + t1 * a) / b  //放大布局会变


      //用transition来做 直接放大不会重新布局，像图片放大镜 
      var l2 = l1 - (b / a - 1) * x  //像素不准了，
      var t2 = t1 - (b / a - 1) * y

      //设置最小为1
      if (newZoomLevel < 1) {
        newZoomLevel = 1
        l2= 0
        t2 = 0  //复位
        console.log('再小就不好看了呦')
      }

      this.canvasWrapper.style.left = l2 + 'px'
      this.canvasWrapper.style.top = t2 + 'px'

      

      this.setState({
        zoomLevel: newZoomLevel
      })
      e.preventDefault()
    })
  }

  setUpDragHandler = () => {
    var initialLeft
    var initialTop
    var mouseInitialX
    var mouseInitialY
    var dragging = false
    //拖动时阻止click事件用，声明到外面
    var mouseMoveX
    var mouseMoveY
    this.canvasWrapper.addEventListener('mousedown',e=> {//canvas包了一层，改为挂在外层div上
      initialLeft = parseFloat(this.canvasWrapper.style.left)
      initialTop = parseFloat(this.canvasWrapper.style.top)
      mouseInitialX = e.clientX
      mouseInitialY = e.clientY
      dragging = true
    })

    this.canvas.addEventListener('mousemove', e=> {
      var x = Math.floor(e.layerX / this.state.zoomLevel)
      var y = Math.floor(e.layerY / this.state.zoomLevel)

      this.setState({
        dotHoverX: x,
        dotHoverY: y,
      })

    })
    window.addEventListener('mousemove', e=> { //改为window上的mousemove,可以一直跟随
      // console.log('手抖了')
      if(dragging) {
        var mouseX = e.clientX
        var mouseY = e.clientY
        mouseMoveX = mouseX - mouseInitialX
        mouseMoveY = mouseY - mouseInitialY
        // var left = initialLeft + mouseMoveX / this.state.zoomLevel  //把加上的放大的值再除回去
        // var top = initialTop + mouseMoveY / this.state.zoomLevel

        var left = initialLeft + mouseMoveX //transfrom方式不用除回去
        var top = initialTop + mouseMoveY 

        this.canvasWrapper.style.left = left + 'px'
        this.canvasWrapper.style.top = top + 'px'
      }

    })
    window.addEventListener('mouseup', e=> {
      dragging = false //mouseup时松手
    })
    this.canvasWrapper.addEventListener('mouseup', e => {
      console.log('mouseup',e)
      dragging = false
      var mouseMoveDistance = Math.sqrt(mouseMoveX * mouseMoveX + mouseMoveY * mouseMoveY) || 0  //解决第一次click不上的问题
      // debugger
      console.log('distance',mouseMoveDistance)
      if(mouseMoveDistance < 3 && !this.state.isPickingColor) {
        //有移动距离大于XX时再click点
        this.handleDotClick(e)
      }

      mouseMoveX = 0 //解决
      mouseMoveY = 0
      //e.preventDefault()  //阻止鼠标点击事件，mouseup里面没有阻止click事件成功，可以把click事件放到mouseup里面
    })
  }

  setUpPickColorHandler = (e) => {
    function makeCursor(color) {
      var cursor = document.createElement('canvas')
      var ctx = cursor.getContext('2d')
      cursor.width = 41
      cursor.height = 41

      ctx.beginPath()
      ctx.lineWidth = 2
      ctx.stokeStyle = '#000000'
      ctx.moveTo(0,6)
      ctx.lineTo(12,6)
      ctx.moveTo(6,0)
      ctx.lineTo(6,12)
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(25,25,14,0,2 * Math.PI, false)
      ctx.lineWidth = 2
      ctx.strokeStyle = '#000000'
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(25,25,13.4,0,2*Math.PI,false)
      ctx.fillStyle = color
      ctx.fill()
      return cursor.toDataURL()
    }
    this.canvas.addEventListener('mousemove',e => {
      if(this.state.isPickingColor) {
        var[x,y] = getMousePos(e)
        var pixelColor = Array.from(this.ctx.getImageData(x,y,1,1).data)
        var pixelColorCss = 'rgba(' + pixelColor + ')'
        var cursorUrl = makeCursor(pixelColorCss)
        this.canvas.style.cursor = `url(${cursorUrl}) 6 6, crosshair`
      }
    })
    this.canvas.addEventListener('click', e => {
      if(this.state.isPickingColor) {
        //拿到此时颜色
        var [x,y] = getMousePos(e)
        var pixelColor = Array.from(this.ctx.getImageData(x,y,1,1).data)
        var hexColor = '#' + pixelColor.slice(0,3).map(it => {
          return it.toString(16).padStart(2, '0')
        }).join('')
        this.props.onPickColor(hexColor)
        this.setState({
          isPickingColor:false  //取色后button状态还原
        })
        this.canvas.style.cursor = '' //取色指针状态还原
      }
    })
  }

  handleDotClick = (e) => { //不让这个函数运行的太频繁,3s_.throttle(,3000)
    //找到用户点击坐标发回去
    console.log('handleDotClick',e.nativeEvent)

    var layerX = e.layerX   //e.nativeEvent.layerX e变了  
    var layerY = e.layerY
    console.log('layer', layerX, layerY)

    var row = Math.floor(layerY / this.state.zoomLevel)
    var col = Math.floor(layerX / this.state.zoomLevel)
    console.log('colrow', col, row)

    this.socket.emit('draw-dot', { row, col, color: this.props.currentColor })
  }


  componentDidMount() {
    this.setUpZoomHandler()
    this.setUpDragHandler()
    this.setUpPickColorHandler()
    //这样就只运行一次了，canvas元素还是这个元素，没有变
    console.log('pixel grid did mount')
    this.canvas.style.imageRendering = 'pixelated'
    this.ctx = this.canvas.getContext('2d')

    //socket监听数据
      //上面onload,这里需要是异步的
    this.socket.on('initial-pixel-data', async pixelData => {
      var image = await createImageFromArrayBuffer(pixelData)//异步构造图片

      document.body.append(image)
      //根据二进制图片对象来重新设置图片大小
      this.canvas.width = image.width 
      this.canvas.height = image.height

      this.setState({
        width: image.width,
        height: image.height * 0.5, //删除
      })

      this.ctx.drawImage(image,0,0)

      //首次画面出现以后，触发一次重新渲染image,因为取色按钮第一次不出现，render()才出现，有可能是没挂上去
      this.forceUpdate()
    })

    this.socket.on('update-dot', ({row,col,color}) => {
      this.draw(col, row,color)
    })

  }

  draw = (row,col,color) => {
    this.ctx.fillStyle = color
    this.ctx.fillRect(row,col,1,1)
  }

  setPickColor = () => {
    this.setState({
      isPickingColor: true
    })
  }
  renderPickColorBtn() {
    var el = document.getElementById('color-pick-placeholder')//取到了就用，取不到就不用
    if (!el) {
      return null
    } else {
      return ReactDOM.createPortal ((
        <button onClick={this.setPickColor}>{
          this.state.isPickingColor ? '正在取色' : '取色'
        }</button>
      ), el)

    }
  }

  
//放大缩小的时候会rerender， transfrom是不会把canvas真正放大的，宽高还是20
  render(){   
    console.log("pixel grid render")
   
    return (
      <div style={{ 
        position:'relative', 
        width: this.state.width, 
        height:this.state.height, 
        display:'inline-block', 
        border:'1px solid',
        overflow: 'hidden'
        }}>
        {this.renderPickColorBtn()}
        <div ref={el => this.canvasWrapper = el} className="canvas-wrapper" style={{
          position: 'absolute',
          left: 0,
          top: 0,
        }}>
          <span className="dot-hover-box" style={{
            boxShadow: '0 0 1px black',
            width: this.state.zoomLevel + 'px',
            height: this.state.zoomLevel + 'px',
            position: 'absolute',
            left: this.state.dotHoverX * this.state.zoomLevel + 'px',
            top: this.state.dotHoverY * this.state.zoomLevel + 'px',
            zIndex: 5,
            pointerEvents: 'none'
          }}></span>
          <canvas  
                  style={{
                    ...canvasStyle,
                    // zoom: this.state.zoomLevel
                    transform: 'scale(' + this.state.zoomLevel + ')'
                  }} 
                  ref={el => this.canvas = el}>
          </canvas>
        </div>
      </div>
    )
    
  } 
}


export default PixelGrid
