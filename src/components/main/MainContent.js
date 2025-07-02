"use client";
import React, { useState, useEffect, useRef, useContext } from "react";
import MiniBoard from "../miniBoard/MiniBoard";
import { randomTetromino } from "@/components/tetromino/Tetromino";
import { Tetromino_Show, Tetromino } from "@/components/tetromino/Tetromino";
import Modal from "../modal/Modal";
import NextQueue from "../nextqueue/NextQueue";
import { axios } from "@/libs/axios/axios";
import { UserContext } from "@/states/UserContext";

const MainContent = () => {
  const rows = 20;
  const cols = 10;

  const { user, setUser } = useContext(UserContext);

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
  const [showGhost, setShowGhost] = useState(true); // 기본 켜진 상태로 설정
  const upPressedRef = useRef(false);
  const [inputId, setInputId] = useState("");
  const [inputPW, setInputPW] = useState("");
  const [inputName, setInputName] = useState("");

  const [nextQueue, setNextQueue] = useState(
    Array.from({ length: 5 }, () => randomTetromino())
  );

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

  const findTetrominoNameByColor = (color) => {
    return Object.entries(Tetromino).find(
      ([_, val]) => val.color === color
    )?.[0];
  };

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
    const initialQueue = Array.from({ length: 5 }, () => randomTetromino());
    setTetromino(initialQueue[0]);
    setNextQueue(initialQueue.slice(1).concat(randomTetromino()));
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

          if (newX < 0 || newX >= board[0].length || newY >= board.length) {
            return false;
          }
          if (newY >= 0 && board[newY][newX] !== 0) {
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

      const next = nextQueue[0];
      const newQueue = nextQueue.slice(1).concat(randomTetromino());

      setTetromino(next);
      setNextQueue(newQueue);
      setPos({ x: 3, y: 0 });
    }

    setCanHold(false);
  };

  useEffect(() => {
    if (isGameOver) {
      setModalType("gameover");
    }
  }, [isGameOver]);

  const intervalRef = useRef(null); // 이건 컴포넌트 최상단 useState 들 옆에 추가

  useEffect(() => {
    if (!tetromino || isGameOver || isPaused || !isStarted) return;

    const tick = () => {
      setPos((prevPos) => {
        const nextPos = { x: prevPos.x, y: prevPos.y + 1 };

        if (canMoveTo(board, tetromino, nextPos)) {
          return nextPos;
        } else {
          const mergedBoard = mergeBlock(board, tetromino, prevPos);
          const { newBoard, clearedLines } = clearLines(mergedBoard);

          setScore((prev) => prev + calculateScore(clearedLines));
          setLinesClearedTotal((prev) => {
            const total = prev + clearedLines;
            setLevel(Math.min(Math.floor(total / 10), 10));
            return total;
          });

          const newTetromino = nextQueue[0];
          const newQueue = nextQueue.slice(1).concat(randomTetromino());

          setTetromino(newTetromino);
          setNextQueue(newQueue);

          const newNext = randomTetromino();
          const newStartPos = { x: 3, y: 0 };

          if (!canMoveTo(newBoard, newTetromino, newStartPos)) {
            setIsGameOver(true);
            setShowRetryModal(true);
            return prevPos;
          } else {
            setBoard(newBoard);
            setTetromino(newTetromino);
            setNextTetromino(newNext);
            setCanHold(true);
            return newStartPos;
          }
        }
      });
    };

    const speed = levelSpeeds[Math.min(level, 10)];
    intervalRef.current = setInterval(tick, speed);

    return () => clearInterval(intervalRef.current);
  }, [isStarted, isPaused, isGameOver, level, tetromino]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "p" || e.key === "P") {
        if (isStarted && !isGameOver) {
          if (!isPaused) {
            setIsPaused(true);
            setModalType("pause");
          } else {
            setIsPaused(false);
            setModalType(null);
          }
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
        if (canMoveTo(board, tetromino, nextPos)) {
          setPos(nextPos);
          setScore((prev) => prev + 1);
        }
      } else if (e.key === "ArrowUp") {
        if (!upPressedRef.current) {
          upPressedRef.current = true;
          const result = RotateWithKick(tetromino, board, pos);
          if (result) {
            setTetromino({ ...tetromino, shape: result.shape });
            setPos(result.newPos);
          }
        }
      } else if (e.key === " ") {
        let dropY = pos.y;
        while (canMoveTo(board, tetromino, { x: pos.x, y: dropY + 1 })) {
          dropY++;
        }

        const dropDistance = dropY - pos.y;
        setScore((prev) => prev + dropDistance * 2); // 하드 드롭 점수

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

        const newTetromino = nextQueue[0];
        const newQueue = nextQueue.slice(1).concat(randomTetromino());
        const newPos = { x: 3, y: 0 };

        if (!canMoveTo(newBoard, newTetromino, newPos)) {
          setIsGameOver(true);
        } else {
          setBoard(newBoard);
          setTetromino(newTetromino);
          setNextQueue(newQueue);
          setPos(newPos);
          setCanHold(true);
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === "ArrowUp") {
        upPressedRef.current = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
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

    if (showGhost) {
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
    }

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

  const handleLogin = async () => {
    const { data, status } = await axios("/common/login", "POST", {
      username: inputId,
      pw: inputPW,
    });

    if (status === 200) {
      setModalType(null);

      // axios -> 내 로그인된 정보를 반환받을거임(username, maxScore)
      setUser(true);
    } else {
      alert("아이디나 비밀번호를 확인해 주세요.");
    }
  };

  const handleSignUp = async () => {
    const { data, status } = await axios("/common/user", "POST", {
      username: inputId,
      pw: inputPW,
      name: inputName,
    });

    if (status === 200) {
      setModalType(null);
    } else {
      alert(data);
    }
  };

  return (
    <div className="flex h-screen p-2 gap-4 bg-gray-100 font-sans text-gray-800">
      {/* 왼쪽 사이드 */}
      <div className="flex flex-col w-[200px] gap-3 text-center">
        <div className="bg-white p-3 rounded-lg shadow border  font-bold text-lg">
          {user ? user.username : "GUEST"}
        </div>

        {user && (
          <div className="bg-white p-2 rounded-lg shadow border text-sm">
            최고 점수: {user.highScore}
          </div>
        )}

        <div className="space-y-2 mt-auto">
          {user ? (
            <>
              <button
                className="w-full py-1 bg-red-500 text-white rounded shadow hover:bg-red-600"
                onClick={() => {
                  if (isStarted) {
                    const confirmLogout = window.confirm(
                      "게임을 저장하고 로그아웃 하시겠습니까?"
                    );
                    if (!confirmLogout) return;

                    resetGame();
                  }
                  setUser(null);
                }}
              >
                로그아웃
              </button>

              <button
                className="w-full py-1 bg-gray-500 text-white rounded shadow hover:bg-gray-600"
                onClick={() => setModalType("settings")}
              >
                설정
              </button>
            </>
          ) : (
            <>
              <button
                className="w-full py-1 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
                onClick={() => setModalType("login")}
              >
                로그인
              </button>
              <button
                className="w-full py-1 bg-green-500 text-white rounded shadow hover:bg-green-600"
                onClick={() => setModalType("signup")}
              >
                회원가입
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex justify-center items-center">
        <div
          className="flex items-center justify-center h-screen gap-10 relative"
          onClick={() => {
            if (!user) {
              alert("로그인 후 게임을 시작할 수 있습니다.");
              return;
            }
            if (!isStarted) setIsStarted(true);
          }}
        >
          <div
            className="grid border-2 border-gray-700 bg-gray-100 rounded-lg shadow-lg"
            style={{
              gridTemplateRows: `repeat(${rows}, 40px)`,
              gridTemplateColumns: `repeat(${cols}, 40px)`,
            }}
          >
            {displayBoard.flat().map((cell, idx) => (
              <div
                key={idx}
                className={`w-[40px] h-[40px] border border-gray-300 ${
                  typeof cell === "string"
                    ? cell.startsWith("ghost-")
                      ? `${cell.replace("ghost-", "")} opacity-30`
                      : `${cell} shadow-md`
                    : "bg-white"
                }`}
              />
            ))}
          </div>

          {!isStarted && (
            <div className="absolute text-4xl font-bold text-blue-600 bg-white bg-opacity-50 px-8 py-4 rounded-xl shadow-lg">
              클릭해서 시작
            </div>
          )}
        </div>
      </div>
      {user ? (
        <>
          <div className="flex flex-col w-[200px] gap-2">
            <div className="bg-white p-2 rounded-lg shadow border text-sm  flex justify-center items-center text-center">
              점수: {score}
              <br /> 레벨: {level}
            </div>
            <div className="p-2 rounded-lg shadow bg-white border flex flex-col justify-center items-center">
              <NextQueue queue={isStarted ? nextQueue : []} />
              <p className="text-xs mt-1 font-semibold text-gray-500">NEXT</p>
            </div>

            <div className="p-2 rounded-lg shadow bg-white border flex flex-col justify-center items-center">
              <MiniBoard nextTetromino={holdTetromino} />
              <p className="text-xs mt-1 font-semibold text-gray-500">HOLD</p>
            </div>
          </div>
        </>
      ) : (
        <></>
      )}
      <Modal isOpen={modalType !== null} onClose={() => setModalType(null)}>
        {modalType === "login" && (
          <div>
            <h2 className="text-xl font-bold mb-4">로그인</h2>
            <input
              type="text"
              placeholder="아이디"
              className="border w-full mb-2 p-1 outline-0"
              onChange={(e) => {
                setInputId(e.target.value);
              }}
            />
            <input
              type="password"
              placeholder="비밀번호"
              className="border w-full mb-4 p-1 outline-0"
              onChange={(e) => {
                setInputPW(e.target.value);
              }}
            />
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded w-full"
              onClick={handleLogin}
            >
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
              onChange={(e) => {
                setInputId(e.target.value);
              }}
            />
            <input
              type=""
              placeholder="이름"
              className="border w-full mb-2 p-1 outline-0"
              onChange={(e) => {
                setInputName(e.target.value);
              }}
            />
            <input
              type="password"
              placeholder="비밀번호"
              className="border w-full mb-4 p-1 outline-0"
              onChange={(e) => {
                setInputPW(e.target.value);
              }}
            />
            <button
              className="bg-green-500 text-white px-4 py-2 rounded w-full"
              onClick={handleSignUp}
            >
              회원가입
            </button>
          </div>
        )}
        {modalType === "gameover" && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">게임 종료</h2>
            <p className="mb-4">
              레벨은 {level}단계입니다.
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
        {modalType === "settings" && user && (
          <div>
            <h2 className="text-xl font-bold mb-4">프로필 설정</h2>
            <input
              type="text"
              defaultValue={user.username}
              placeholder="유저 이름"
              className="border w-full mb-2 p-1"
            />
            <input
              type="text"
              defaultValue={user.bio}
              placeholder="소개글"
              className="border w-full mb-2 p-1"
            />
            <input
              type="text"
              defaultValue={user.profile}
              placeholder="프로필 이미지 URL"
              className="border w-full mb-4 p-1"
            />

            <label className="flex items-center mb-4 select-none">
              <input
                type="checkbox"
                checked={showGhost}
                onChange={(e) => setShowGhost(e.target.checked)}
                className="mr-2"
              />
              고스트 블럭 표시하기
            </label>

            <button
              onClick={() => {
                setUser((prev) => ({
                  ...prev,
                  username: "새 이름",
                  bio: "새 소개글",
                  profile: "새 URL",
                }));
                setModalType(null);
              }}
              className="bg-green-500 text-white px-4 py-2 rounded w-full"
            >
              저장
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MainContent;
