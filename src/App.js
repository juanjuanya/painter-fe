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
      // pixelData: null  //替换为pixelGrid的canvas画板了
      currentColor: 'red'
    }
    //和服务器建立连接，得早点传，让可读
    this.socket = io('ws://localhost:3005/')
}

  componentDidMount (){
    
  }

  handlePixelClick = (row, col) => {
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
        <h1>Pixel Painter</h1>
        <PixelGrid width={200} height={200} currentColor={this.state.currentColor} socket={this.socket}/>
        <span id="color-pick-placeholder"></span>
        <ColorSelect onChange={this.changeCurrentColor} color = {this.state.currentColor}/>
      </div>
    )
  }
}

export default App;
