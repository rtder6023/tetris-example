import React, { useState } from "react";

const MiniBoard = ({ nextTetromino }) => {
  if (!nextTetromino) return null;

  const shape = nextTetromino.shape;
  const size = shape.length;
  const color = nextTetromino.color;

  return (
    <div
      className="grid gap-0.5"
      style={{
        gridTemplateRows: `repeat(${size}, 20px)`,
        gridTemplateColumns: `repeat(${shape[0].length}, 20px)`,
      }}
    >
      {shape.flat().map((cell, idx) => (
        <div
          key={idx}
          className={`w-[20px] h-[20px] border border-gray-300 ${
            cell !== 0 ? color : "bg-white"
          }`}
        ></div>
      ))}
    </div>
  );
};

export default MiniBoard;
