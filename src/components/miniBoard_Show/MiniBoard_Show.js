import React from "react";

const MiniBoard_Show = ({ tetromino }) => {
  if (!tetromino) return null;

  const shape = tetromino.shape;
  const color = tetromino.color;

  return (
    <div
      className="grid gap-0.5"
      style={{
        gridTemplateRows: `repeat(${shape.length}, 20px)`,
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

export default MiniBoard_Show;
