"use client";
import React from "react";
import MiniBoard from "../miniBoard/MiniBoard";

const NextQueue = ({ queue }) => {
  return (
    <div className="p-2 rounded-lg  flex flex-col items-center gap-2">
      {queue.slice(0, 5).map((tetromino, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <MiniBoard nextTetromino={tetromino} />
          <p className="text-xs text-gray-500">NEXT {idx + 1}</p>
        </div>
      ))}
    </div>
  );
};

export default NextQueue;
