import React, { useState} from 'react'
import './App.css'

function useOnlineCount(socket) {
  //通过socket来更新hooks的state
  var [count, setCount] = useState(0)
  socket.on('online-count', setCount)  //数据变化，直接调用setCount
  return count
}

function OnlineCount({socket}) {
  var count = useOnlineCount(socket)
  return <div className="online-count">在线人数：{count}</div>
}


export default OnlineCount