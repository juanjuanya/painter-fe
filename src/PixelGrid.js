import React, { Component } from "react";
import Dot from "./Dot";

class PixelGrid extends Component {
  //不写也相当于这么写，构造函数会自动调上面的内容
  // constructor(props) {
  //   super(props)
  // }

  handleDotClick = (row,col) => {
    this.props.onPixelClick(row,col)//继续往外面传给App
  }

  render(){   
    console.log("pixel grid render")
    if(!this.props.pixels) {
      return null
    } else {
      return (
        <table style={{tableLayout: 'fixed'}}>
          <tbody>
            {
              this.props.pixels.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {row.map((color,colIdx) => (
                  <Dot key={colIdx} onClick={this.handleDotClick} row={rowIdx} col={colIdx} color={color}/>
                  ))}
                </tr>
              ))
            }
          </tbody>
        </table>
      )
    }
  } 
}


export default PixelGrid
