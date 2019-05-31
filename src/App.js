import React, { Component } from "react"; //component额外写下
// import logo from './logo.svg'; //react自带
import './App.css';
import io from 'socket.io-client'
import PixelGrid from './PixelGrid'
import ColorSelect from './ColorSelect'
import OnlineCount from './OnlineCount'
import ChatRoom from './ChatRoom'
import { produce} from 'immer'   //改update二位数组的点比较难改


//加载完成后建立一个ajax请求，为什么在didmount里面：这个函数运行的时候dom已经渲染好了
//.2 如果在willMount 执行setstate里面是不会刷到屏幕上面的，直接运行render,那时候还没有把状态set同步上去
class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      // pixelData: null  //替换为pixelGrid的canvas画板了
      currentColor: '#ff0000'
    }
    //和服务器建立连接，得早点传，让可读
    this.socket = io('ws://localhost:3006/')  //this.socket = io() 可以不用传，会自动连接当前域名的当前端口
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
        <div className="pixel-grid">
          <PixelGrid onPickColor={this.changeCurrentColor} currentColor={this.state.currentColor} socket={this.socket} />
        </div>
        <div className="pick-color">
          <ColorSelect onChange={this.changeCurrentColor} color={this.state.currentColor} />
          <span id="color-pick-placeholder"></span>
        </div>
        <div className="chat">
          <OnlineCount socket={this.socket} />
          <ChatRoom socket={this.socket} />
        </div>
      </div>
    )
  }
}

export default App;
