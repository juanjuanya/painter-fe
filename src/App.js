import React, { Component} from 'react'; //component额外写下
// import logo from './logo.svg'; //react自带
import './App.css';
import io from 'socket.io-client'
import PixelGrid from './PixelGrid'
import ColorSelect from './ColorSelect'
import { produce} from 'immer'   //改update二位数组的点比较难改



//加载完成后建立一个ajax请求，为什么在didmount里面：这个函数运行的时候dom已经渲染好了
//.2 如果在willMount 执行setstate里面是不会刷到屏幕上面的，直接运行render,那时候还没有把状态set同步上去
class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      pixelData: null
  }
}

  componentDidMount (){
    //和服务器建立连接
    this.socket = io('ws://localhost:3005/')
    this.socket.on('pixel-data',(data) =>{//监听事件
      console.log(data)
      this.setState({
        currentColor: 'red',
        pixelData: data
      })
    })
    this.socket.on('update-dot', info => {//变了的用新的，不变的用原来的
      console.log(info)
      this.setState(produce(this.state, state => {//当前的state换掉
        state.pixelData[info.row][info.col] = info.color
      }))
      // this.setState({
      //   pixelData: this.state.pixelData.map((row,rowIdx) => {
      //     if(rowIdx === info.row) {
      //       return row.map((color,colIdx) => {
      //         if(colIdx === info.col) {
      //           return info.color
      //         } else {
      //           return color
      //         }
      //       })
      //     }else {
      //       return row
      //     }
      //   })
      // })
    })
  }

  handlePixelClick = (row, col) => {
    this.socket.emit('draw-dot', {
      row,
      col,
      color: this.state.currentColor,
    })
  }

  changeCurrentColor = (color) => {
    console.log(color)
    this.setState({
      currentColor:color
    })
  }
  render() {
    return (
      <div>
        <PixelGrid onPixelClick={this.handlePixelClick} pixels={this.state.pixelData}/>
        <ColorSelect onChange={this.changeCurrentColor} color = {this.state.currentColor}/>
      </div>
    )
  }
}

export default App;
