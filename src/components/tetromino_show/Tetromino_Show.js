export const Tetromino_Show = {
  I: {
    shape: [
      [0, 1, 1, 1, 1],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
    color: "bg-cyan-400",
  },
  L: {
    shape: [
      [0, 0, 0, 0, 0],
      [0, 1, 0, 0, 0],
      [0, 1, 1, 1, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
    color: "bg-blue-400",
  },
  J: {
    shape: [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 1, 0],
      [0, 1, 1, 1, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
    color: "bg-orange-400",
  },
  T: {
    shape: [
      [0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 1, 1, 1, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
    color: "bg-purple-400",
  },
  O: {
    shape: [
      [0, 0, 0, 0, 0],
      [0, 0, 1, 1, 0],
      [0, 0, 1, 1, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
    color: "bg-yellow-400",
  },
  S: {
    shape: [
      [0, 0, 0, 0, 0],
      [0, 0, 1, 1, 0],
      [0, 1, 1, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
    color: "bg-green-400",
  },
  Z: {
    shape: [
      [0, 0, 0, 0, 0],
      [0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
    color: "bg-rose-400",
  },
};

let bag = [];
export const randomTetromino = () => {
  if (bag.length === 0) {
    const tetros = Object.keys(Tetromino);
    bag = tetros
      .map((t) => ({ t, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ t }) => t);
  }

  const next = bag.shift(); // 하나 꺼냄, pop 같은 거
  return Tetromino[next];
};
