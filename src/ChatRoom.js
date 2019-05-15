import React, {useRef } from 'react'  //函数组件里面用ref需要用这个hook useref


export default function ChatRoom({socket}) {
  var msgsRef = useRef()
  var inputRef = useRef()
  socket.on('chat-msg', msg => {
    msgsRef.current.innerHTML += msg + '<br>'
  })

  function sendMsg() {
    var msg = inputRef.current.value
    socket.emit('chat-msg', msg)
  }
  return (
    <div>
      <div ref={msgsRef}>

      </div>
      <input type="text" ref={inputRef}/> <button onClick={sendMsg}>发送</button>
    </div>
  )
}