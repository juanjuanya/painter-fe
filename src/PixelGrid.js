import React, { Component } from "react";
import Dot from "./Dot";

function PixelGrid(props) {
  if(!props.pixels) {
    return null
  } else {
    return (
      <table style={{tableLayout: 'fixed'}}>
        <tbody>
          {
            props.pixels.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map((color,colIdx) => (
                <Dot key={colIdx} onClick={()=>props.onPixelClick(rowIdx, colIdx)} rowIdx={rowIdx} colIdx={colIdx} color={color}/>
                ))}
              </tr>
            ))
          }
        </tbody>
      </table>
    )
  }
}


export default PixelGrid
