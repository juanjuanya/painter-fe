import React, { Component } from "react";

var canvasStyle = {
  position: 'absolute', //div包了一下
  display: 'block',
  left:0,
  top:0,
  transformOrigin:'top left',
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
      zoomLevel: 5,
      dotHoverX: -1,
      dotHoverY: -1,
    }
    this.canvas = null
    this.socket = this.props.socket
  }

  setUpZoomHandler = () => {
    this.canvas.addEventListener('mousewheel', e => {
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
        //设置最小为1
        if(this.state.zoomLevel === 1) {
          this.state.zoomLevel = 2
          alert('再小就不好看了呦')
        }
        newZoomLevel = this.state.zoomLevel - 1
      }

      var zoomRatio = newZoomLevel / oldZoomLevel

      
      var a = oldZoomLevel
      var b = newZoomLevel
      var x = mouseLayerX
      var y = mouseLayerY
      var l1 = parseFloat(this.canvas.style.left)
      var t1 = parseFloat(this.canvas.style.top)

      // var l2 = (-(b/a - 1) * x + l1 *a) / b
      // var t2 = (-(b/a - 1) * y + t1 * a) / b  //放大布局会变


      //用transition来做 直接放大不会重新布局，像图片放大镜 
      var l2 = l1 - (b / a - 1) * x  //像素不准了，
      var t2 = t1 - (b / a - 1) * y

      this.canvas.style.left = l2 + 'px'
      this.canvas.style.top = t2 + 'px'

      

      this.setState({
        zoomLevel: newZoomLevel
      })
      e.preventDefault()
    })

    this.setUpDragHandler()
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
      initialLeft = parseFloat(this.canvas.style.left)
      initialTop = parseFloat(this.canvas.style.top)
      mouseInitialX = e.clientX
      mouseInitialY = e.clientY
      dragging = true
    })
    this.canvasWrapper.addEventListener('mousemove', e=> {
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

        this.canvas.style.left = left + 'px'
        this.canvas.style.top = top + 'px'
      }

    })
    this.canvasWrapper.addEventListener('mouseup', e => {
      console.log('mouseup',e)
      dragging = false
      var mouseMoveDistance = Math.sqrt(mouseMoveX * mouseMoveX + mouseMoveY * mouseMoveY) || 0  //解决第一次click不上的问题
      // debugger
      console.log('distance',mouseMoveDistance)
      if(mouseMoveDistance < 5) {
        //有移动距离大于XX时再click点
        this.handleDotClick(e)
      }

      mouseMoveX = 0 //解决
      mouseMoveY = 0
      //e.preventDefault()  //阻止鼠标点击事件，mouseup里面没有阻止click事件成功，可以把click事件放到mouseup里面
    })
  }

  handleDotClick = (e) => {
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
      this.ctx.drawImage(image,0,0)
      
    })

    this.socket.on('update-dot', ({row,col,color}) => {
      this.draw(col, row,color)
    })

  }

  draw = (row,col,color) => {
    this.ctx.fillStyle = color
    this.ctx.fillRect(row,col,1,1)
  }


  
//放大缩小的时候会rerender
  render(){   
    console.log("pixel grid render")
   
    return (
      <div style={{ position:'relative', width: this.props.width, height:this.props.height, display:'inline-block',border:'1px solid'}}>
        <div ref={el => this.canvasWrapper = el} className="canvas-wrapper" style={{
          position: 'absolute',
          left: 0,
          top: 0,
        }}>
          <span className="dot-hover-box" style={{
            boxShadow: '0 0 1px black',
            width: this.state.zoomLevel + 'px',
            height: this.state.zoomLevel + 'px',
            position: 'absolute'
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
