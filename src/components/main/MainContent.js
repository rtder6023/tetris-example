"use client";

import React, { useState, useEffect } from "react";
import MiniBoard from "../miniBoard/MiniBoard";
import { randomTetromino } from "@/components/tetromino/Tetromino";
import Modal from "../modal/Modal";

const MainContent = () => {
  const rows = 20;
  const cols = 10;

  const [board, setBoard] = useState(
    Array.from({ length: rows }, () => Array(cols).fill(0))
  );
  const [tetromino, setTetromino] = useState(null);
  const [nextTetromino, setNextTetromino] = useState(null);
  const [holdTetromino, setHoldTetromino] = useState(null);
  const [canHold, setCanHold] = useState(true);
  const [pos, setPos] = useState({ x: 3, y: 0 });
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [modalType, setModalType] = useState(null);

  const rotate = (matrix) => {
    const N = matrix.length;
    const result = Array.from({ length: N }, () => Array(N).fill(0));
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        result[x][N - 1 - y] = matrix[y][x];
      }
    }
    return result;
  };

  const Kick = () => [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: -1, y: -1 },
    { x: 1, y: -1 },
  ];

  const RotateWithKick = (tetromino, board, pos) => {
    const rotatedShape = rotate(tetromino.shape);
    const kicks = Kick();

    for (let offset of kicks) {
      const testPos = {
        x: pos.x + offset.x,
        y: pos.y + offset.y,
      };

      if (canMoveTo(board, tetromino, testPos, rotatedShape)) {
        return { shape: rotatedShape, newPos: testPos };
      }
    }

    return null;
  };

  const clearLines = (board) => {
    const newBoard = board.filter((row) => row.some((cell) => cell === 0));
    const clearedLines = board.length - newBoard.length;
    for (let i = 0; i < clearedLines; i++) {
      newBoard.unshift(Array(board[0].length).fill(0));
    }
    return { newBoard, clearedLines };
  };

  const calculateScore = (linesCleared) => {
    switch (linesCleared) {
      case 1:
        return 100;
      case 2:
        return 300;
      case 3:
        return 500;
      case 4:
        return 800;
      default:
        return 0;
    }
  };

  const canMoveTo = (board, tetromino, pos, shape = null) => {
    const currentShape = shape || tetromino.shape;

    for (let y = 0; y < currentShape.length; y++) {
      for (let x = 0; x < currentShape[y].length; x++) {
        if (currentShape[y][x] !== 0) {
          const newY = pos.y + y;
          const newX = pos.x + x;

          if (
            newY < 0 ||
            newY >= board.length ||
            newX < 0 ||
            newX >= board[0].length ||
            board[newY][newX] !== 0
          ) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const mergeBlock = (board, tetromino, pos) => {
    const newBoard = board.map((row) => [...row]);
    const shape = tetromino.shape;

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] !== 0) {
          const newY = pos.y + y;
          const newX = pos.x + x;
          if (
            newY >= 0 &&
            newY < board.length &&
            newX >= 0 &&
            newX < board[0].length
          ) {
            newBoard[newY][newX] = tetromino.color;
          }
        }
      }
    }

    return newBoard;
  };

  const handleHold = () => {
    if (!canHold || !tetromino) return;

    if (holdTetromino) {
      const temp = holdTetromino;
      setHoldTetromino(tetromino);
      setTetromino(temp);
      setPos({ x: 3, y: 0 });
    } else {
      setHoldTetromino(tetromino);
      const next = nextTetromino || randomTetromino();
      setTetromino(next);
      setNextTetromino(randomTetromino());
      setPos({ x: 3, y: 0 });
    }

    setCanHold(false);
  };

  useEffect(() => {
    if (!tetromino || isGameOver || isPaused || !isStarted) return;

    const interval = setInterval(() => {
      const nextPos = { x: pos.x, y: pos.y + 1 };

      if (canMoveTo(board, tetromino, nextPos)) {
        setPos(nextPos);
      } else {
        let mergedBoard = mergeBlock(board, tetromino, pos);
        const { newBoard, clearedLines } = clearLines(mergedBoard);
        setScore((prev) => prev + calculateScore(clearedLines));

        const newTetromino = nextTetromino || randomTetromino();
        const newNext = randomTetromino();
        const newPos = { x: 3, y: 0 };

        if (!canMoveTo(newBoard, newTetromino, newPos)) {
          setIsGameOver(true);
        } else {
          setBoard(newBoard);
          setTetromino(newTetromino);
          setNextTetromino(newNext);
          setPos(newPos);
          setCanHold(true);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [board, pos, tetromino, isGameOver, isPaused, isStarted]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "p" || e.key === "P") {
        setIsPaused((prev) => !prev);
        return;
      }

      if (!tetromino || isGameOver || isPaused || !isStarted) return;

      if (e.key === "Shift") {
        handleHold();
      } else if (e.key === "ArrowLeft") {
        const nextPos = { x: pos.x - 1, y: pos.y };
        if (canMoveTo(board, tetromino, nextPos)) setPos(nextPos);
      } else if (e.key === "ArrowRight") {
        const nextPos = { x: pos.x + 1, y: pos.y };
        if (canMoveTo(board, tetromino, nextPos)) setPos(nextPos);
      } else if (e.key === "ArrowDown") {
        const nextPos = { x: pos.x, y: pos.y + 1 };
        if (canMoveTo(board, tetromino, nextPos)) setPos(nextPos);
      } else if (e.key === "ArrowUp") {
        const result = RotateWithKick(tetromino, board, pos);
        if (result) {
          setTetromino({ ...tetromino, shape: result.shape });
          setPos(result.newPos);
        }
      } else if (e.key === " ") {
        let dropY = pos.y;
        while (canMoveTo(board, tetromino, { x: pos.x, y: dropY + 1 })) {
          dropY++;
        }

        const finalPos = { x: pos.x, y: dropY };
        let mergedBoard = mergeBlock(board, tetromino, finalPos);
        const { newBoard, clearedLines } = clearLines(mergedBoard);
        setScore((prev) => prev + calculateScore(clearedLines));

        const newTetromino = nextTetromino || randomTetromino();
        const newNext = randomTetromino();
        const newPos = { x: 3, y: 0 };

        if (!canMoveTo(newBoard, newTetromino, newPos)) {
          setIsGameOver(true);
        } else {
          setBoard(newBoard);
          setTetromino(newTetromino);
          setNextTetromino(newNext);
          setPos(newPos);
          setCanHold(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [board, pos, tetromino, isGameOver, isPaused, isStarted, canHold]);

  useEffect(() => {
    if (isStarted && !tetromino) {
      setTetromino(randomTetromino());
      setNextTetromino(randomTetromino());
    }
  }, [isStarted, tetromino]);

  const displayBoard = board.map((row, y) =>
    row.map((cell, x) => {
      const shape = tetromino?.shape;
      const blockY = y - pos.y;
      const blockX = x - pos.x;

      if (
        tetromino &&
        blockY >= 0 &&
        blockY < shape.length &&
        blockX >= 0 &&
        blockX < shape[0].length &&
        shape[blockY][blockX] !== 0
      ) {
        return tetromino.color;
      }

      return cell;
    })
  );

  return (
    <div className="flex h-screen p-2 gap-2 text-sm">
      <div className="flex flex-col w-[200px] gap-2">
        <div className="border border-black p-2 text-center">이름</div>
        <div className="border border-black p-2 text-center">개인 최고기록</div>
        <div className="border border-black p-2 flex-1 text-center">
          Ranking
        </div>
        <div
          className="border border-black p-2 text-center cursor-pointer underline text-1xl"
          onClick={() => setModalType("login")}
        >
          로그인
          <br />
          <span
            onClick={(e) => {
              e.stopPropagation();
              setModalType("signup");
            }}
          >
            회원가입
          </span>
        </div>
      </div>

      <div className="flex-1 flex justify-center items-center">
        <div
          className="flex items-center justify-center h-screen gap-10 relative"
          onClick={() => {
            if (!isStarted) setIsStarted(true);
          }}
        >
          <div
            className="grid border border-black"
            style={{
              gridTemplateRows: `repeat(${rows}, 40px)`,
              gridTemplateColumns: `repeat(${cols}, 40px)`,
            }}
          >
            {displayBoard.flat().map((cell, idx) => (
              <div
                key={idx}
                className={`border border-gray-400 w-[40px] h-[40px] ${
                  typeof cell === "string" ? cell : "bg-white"
                }`}
              ></div>
            ))}
          </div>

          {!isStarted && (
            <div className="absolute text-4xl font-bold text-blue-600 bg-white bg-opacity-50 px-8 py-4 rounded-xl shadow-lg">
              클릭해서 시작
            </div>
          )}
          {isGameOver && (
            <div className="absolute text-4xl font-bold text-red-600">
              게임 종료
            </div>
          )}
          {isPaused && !isGameOver && (
            <div className="absolute text-4xl font-bold text-yellow-600">
              일시정지
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col w-[200px] gap-2">
        <div className="border border-black p-2 text-center">점수: {score}</div>

        <div className="border border-black p-2 flex justify-center items-center">
          <MiniBoard nextTetromino={nextTetromino} />
        </div>
        <div className="text-center text-xs">NEXT</div>

        <div className="border border-black p-2 flex justify-center items-center">
          <MiniBoard nextTetromino={holdTetromino} />
        </div>
        <div className="text-center text-xs">HOLD</div>
      </div>
      <Modal isOpen={modalType !== null} onClose={() => setModalType(null)}>
        {modalType === "login" && (
          <div>
            <h2 className="text-xl font-bold mb-4">로그인</h2>
            <input
              type="text"
              placeholder="아이디"
              className="border w-full mb-2 p-1 outline-0"
            />
            <input
              type="password"
              placeholder="비밀번호"
              className="border w-full mb-4 p-1 outline-0"
            />
            <button className="bg-blue-500 text-white px-4 py-2 rounded w-full">
              로그인
            </button>
          </div>
        )}
        {modalType === "signup" && (
          <div>
            <h2 className="text-xl font-bold mb-4">회원가입</h2>
            <input
              type="text"
              placeholder="아이디"
              className="border w-full mb-2 p-1 outline-0"
            />
            <input
              type=""
              placeholder="이름"
              className="border w-full mb-2 p-1 outline-0"
            />
            <input
              type="password"
              placeholder="비밀번호"
              className="border w-full mb-4 p-1 outline-0"
            />
            <button className="bg-green-500 text-white px-4 py-2 rounded w-full">
              회원가입
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MainContent;
