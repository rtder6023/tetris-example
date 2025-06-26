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
  const [showRetryModal, setShowRetryModal] = useState(false);
  const [level, setLevel] = useState(0);
  const [linesClearedTotal, setLinesClearedTotal] = useState(0);
  const levelSpeeds = [
    800, // level 0
    716, // level 1
    633, // level 2
    550, // level 3
    466, // level 4
    383, // level 5
    300, // level 6
    216, // level 7
    133, // level 8
    100, // level 9
    83, // level 10+
  ];

  const getGhostPosition = (board, tetromino, pos) => {
    let ghostPos = { ...pos };
    while (canMoveTo(board, tetromino, { x: ghostPos.x, y: ghostPos.y + 1 })) {
      ghostPos.y += 1;
    }
    return ghostPos;
  };

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

  const resetGame = () => {
    setBoard(Array.from({ length: rows }, () => Array(cols).fill(0)));
    setTetromino(randomTetromino());
    setNextTetromino(randomTetromino());
    setHoldTetromino(null);
    setCanHold(true);
    setPos({ x: 3, y: 0 });
    setIsGameOver(false);
    setIsPaused(false);
    setScore(0);
    setLevel(0);
    setLinesClearedTotal(0);
    setIsStarted(true);
    setModalType(null);
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
    if (isGameOver) {
      setModalType("gameover");
    }
  }, [isGameOver]);

  useEffect(() => {
    if (!tetromino || isGameOver || isPaused || !isStarted) return;

    const speed = levelSpeeds[Math.min(level, 10)];

    const interval = setInterval(() => {
      const nextPos = { x: pos.x, y: pos.y + 1 };
      if (canMoveTo(board, tetromino, nextPos)) {
        setPos(nextPos);
      } else {
        let mergedBoard = mergeBlock(board, tetromino, pos);
        const { newBoard, clearedLines } = clearLines(mergedBoard);

        setScore((prev) => prev + calculateScore(clearedLines));
        setLinesClearedTotal((prev) => {
          const total = prev + clearedLines;
          const newLevel = Math.floor(total / 10) + 1;
          setLevel(Math.min(newLevel, 10));
          return total;
        });

        const newTetromino = nextTetromino || randomTetromino();
        const newNext = randomTetromino();
        const newPos = { x: 3, y: 0 };

        if (!canMoveTo(newBoard, newTetromino, newPos)) {
          setIsGameOver(true);
          setShowRetryModal(true);
        } else {
          setBoard(newBoard);
          setTetromino(newTetromino);
          setNextTetromino(newNext);
          setPos(newPos);
          setCanHold(true);
        }
      }
    }, speed);

    return () => clearInterval(interval);
  }, [board, pos, tetromino, isGameOver, isPaused, isStarted, level]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "p" || e.key === "P") {
        if (!isPaused) {
          setIsPaused(true);
          setModalType("pause");
        } else {
          setIsPaused(false);
          setModalType(null);
        }
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
        setLinesClearedTotal((prev) => {
          const total = prev + clearedLines;
          const newLevel = Math.floor(total / 10);
          setLevel(newLevel);
          return total;
        });
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

  const displayBoard = board.map((row) => [...row]);

  if (tetromino) {
    const ghostPos = getGhostPosition(board, tetromino, pos);

    tetromino.shape.forEach((row, dy) => {
      row.forEach((cell, dx) => {
        if (cell !== 0) {
          const gy = ghostPos.y + dy;
          const gx = ghostPos.x + dx;
          if (
            gy >= 0 &&
            gy < rows &&
            gx >= 0 &&
            gx < cols &&
            displayBoard[gy][gx] === 0
          ) {
            displayBoard[gy][gx] = `ghost-${tetromino.color}`;
          }
        }
      });
    });

    tetromino.shape.forEach((row, dy) => {
      row.forEach((cell, dx) => {
        if (cell !== 0) {
          const py = pos.y + dy;
          const px = pos.x + dx;
          if (py >= 0 && py < rows && px >= 0 && px < cols) {
            displayBoard[py][px] = tetromino.color;
          }
        }
      });
    });
  }

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
                  typeof cell === "string"
                    ? cell.startsWith("ghost-")
                      ? `${cell.replace("ghost-", "")} opacity-40`
                      : cell
                    : "bg-white"
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
        <div className="border border-black p-2 text-center">레벨: {level}</div>

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
        {modalType === "gameover" && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">게임 종료</h2>
            <p className="mb-4">
              다시 하시겠습니까?
              <br />
              점수는 {score}점입니다.
            </p>
            <button
              onClick={resetGame}
              className="bg-blue-500 text-white px-4 py-2 rounded w-full mb-2"
            >
              다시 시작
            </button>
            <button
              onClick={() => setModalType(null)}
              className="bg-gray-300 text-black px-4 py-2 rounded w-full"
            >
              닫기
            </button>
          </div>
        )}
        {modalType === "pause" && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">일시정지</h2>
            <button
              onClick={() => {
                setIsPaused(false);
                setModalType(null);
              }}
              className="bg-green-500 text-white px-4 py-2 rounded w-full mb-2"
            >
              계속 하기
            </button>
            <button
              onClick={() => {
                setIsPaused(false);
                setIsStarted(false);
                resetGame();
              }}
              className="bg-red-500 text-white px-4 py-2 rounded w-full"
            >
              그만 하기
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MainContent;
