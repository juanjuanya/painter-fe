import React, { Component } from "react";

var canvasStyle = {
  zoom: 15,
}

class PixelGrid extends Component {
  //不写也相当于这么写，构造函数会自动调上面的内容
  constructor(props) {
    super(props)
    this.canvas = null
    this.socket = this.props.socket
  }

  componentDidMount() {
    //这样就只运行一次了，canvas元素还是这个元素，没有变
    console.log('pixel grid did mount')
    this.canvas.style.imageRendering = 'pixelated'
    this.ctx = this.canvas.getContext('2d')

    //socket监听数据
    this.socket.on('initial-pixel-data', pixelData => {
      //行的数量代表高度，pixel是一行一行的，颜色组成
      this.canvas.height = pixelData.length
      this.canvas.width = pixelData[0].length
      pixelData.forEach((row, rowIdx) => {
        row.forEach((color,colIdx) => {
          this.draw(rowIdx, colIdx,color)
        })
      })
    })

    this.socket.on('update-dot', ({row,col,color}) => {
      this.draw(col, row,color)
    })

  }

  draw = (row,col,color) => {
    this.ctx.fillStyle = color
    this.ctx.fillRect(row,col,1,1)
  }


  handleDotClick = (e) => {
    //找到用户点击坐标发回去
    console.log(e.nativeEvent)

    var layerX = e.nativeEvent.layerX
    var layerY = e.nativeEvent.layerY

    var row = Math.floor(layerY / 15)
    var col = Math.floor(layerX / 15)
    console.log(col,row)

    this.socket.emit('draw-dot', {row,col,color:this.props.currentColor})
  }

  render(){   
    console.log("pixel grid render")
   
    return (
      <div>
        <canvas onClick={this.handleDotClick} 
                style={canvasStyle} 
                ref={el => this.canvas = el}>
        </canvas>
      </div>
    )
    
  } 
}


export default PixelGrid
