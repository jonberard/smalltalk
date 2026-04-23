const VERSION = 5;
const SIZE = VERSION * 4 + 17;
const DATA_CODEWORDS = 108;
const ERROR_CORRECTION_CODEWORDS = 26;
const BYTE_CAPACITY = 106;
const ALIGNMENT_POSITIONS = [6, 30];
const FORMAT_MASK = 0x5412;
const FORMAT_GENERATOR = 0x537;

const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

let tablesReady = false;

function ensureTables() {
  if (tablesReady) return;

  let value = 1;
  for (let index = 0; index < 255; index += 1) {
    EXP_TABLE[index] = value;
    LOG_TABLE[value] = index;
    value <<= 1;
    if (value & 0x100) {
      value ^= 0x11d;
    }
  }

  for (let index = 255; index < 512; index += 1) {
    EXP_TABLE[index] = EXP_TABLE[index - 255];
  }

  tablesReady = true;
}

function multiplyGF(left: number, right: number) {
  if (left === 0 || right === 0) return 0;
  ensureTables();
  return EXP_TABLE[LOG_TABLE[left] + LOG_TABLE[right]];
}

function bitLength(value: number) {
  let count = 0;
  let current = value;
  while (current > 0) {
    count += 1;
    current >>>= 1;
  }
  return count;
}

function buildGeneratorPolynomial(degree: number) {
  let polynomial = [1];

  for (let exponent = 0; exponent < degree; exponent += 1) {
    const next = new Array(polynomial.length + 1).fill(0);

    for (let index = 0; index < polynomial.length; index += 1) {
      next[index] ^= multiplyGF(polynomial[index], EXP_TABLE[exponent]);
      next[index + 1] ^= polynomial[index];
    }

    polynomial = next;
  }

  return polynomial;
}

function createErrorCorrection(data: number[]) {
  const generator = buildGeneratorPolynomial(ERROR_CORRECTION_CODEWORDS);
  const message = new Uint8Array(data.length + ERROR_CORRECTION_CODEWORDS);
  message.set(data);

  for (let index = 0; index < data.length; index += 1) {
    const factor = message[index];
    if (factor === 0) continue;

    for (let generatorIndex = 0; generatorIndex < generator.length; generatorIndex += 1) {
      message[index + generatorIndex] ^= multiplyGF(generator[generatorIndex], factor);
    }
  }

  return Array.from(message.slice(data.length));
}

function pushBits(buffer: number[], value: number, length: number) {
  for (let bit = length - 1; bit >= 0; bit -= 1) {
    buffer.push((value >>> bit) & 1);
  }
}

function encodeData(text: string) {
  const bytes = Array.from(new TextEncoder().encode(text));

  if (bytes.length > BYTE_CAPACITY) {
    throw new Error("QR payload is too long for the current generator.");
  }

  const bits: number[] = [];
  pushBits(bits, 0b0100, 4);
  pushBits(bits, bytes.length, 8);

  for (const byte of bytes) {
    pushBits(bits, byte, 8);
  }

  const capacityBits = DATA_CODEWORDS * 8;
  const terminatorLength = Math.min(4, capacityBits - bits.length);
  pushBits(bits, 0, terminatorLength);

  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const dataCodewords: number[] = [];
  for (let index = 0; index < bits.length; index += 8) {
    let value = 0;
    for (let offset = 0; offset < 8; offset += 1) {
      value = (value << 1) | bits[index + offset];
    }
    dataCodewords.push(value);
  }

  const padBytes = [0xec, 0x11];
  while (dataCodewords.length < DATA_CODEWORDS) {
    dataCodewords.push(padBytes[dataCodewords.length % 2]);
  }

  return [...dataCodewords, ...createErrorCorrection(dataCodewords)];
}

function createMatrix<T>(value: T) {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => value));
}

function setModule(
  matrix: boolean[][],
  reserved: boolean[][],
  row: number,
  col: number,
  dark: boolean,
  reserve = true,
) {
  if (row < 0 || row >= SIZE || col < 0 || col >= SIZE) return;
  matrix[row][col] = dark;
  if (reserve) reserved[row][col] = true;
}

function placeFinder(matrix: boolean[][], reserved: boolean[][], top: number, left: number) {
  for (let rowOffset = -1; rowOffset <= 7; rowOffset += 1) {
    for (let colOffset = -1; colOffset <= 7; colOffset += 1) {
      const row = top + rowOffset;
      const col = left + colOffset;
      if (row < 0 || row >= SIZE || col < 0 || col >= SIZE) continue;

      const isSeparator =
        rowOffset === -1 || rowOffset === 7 || colOffset === -1 || colOffset === 7;
      const isOuterRing =
        rowOffset === 0 || rowOffset === 6 || colOffset === 0 || colOffset === 6;
      const isInnerSquare =
        rowOffset >= 2 && rowOffset <= 4 && colOffset >= 2 && colOffset <= 4;

      setModule(matrix, reserved, row, col, !isSeparator && (isOuterRing || isInnerSquare));
    }
  }
}

function placeAlignment(matrix: boolean[][], reserved: boolean[][], centerRow: number, centerCol: number) {
  for (let rowOffset = -2; rowOffset <= 2; rowOffset += 1) {
    for (let colOffset = -2; colOffset <= 2; colOffset += 1) {
      const ring = Math.max(Math.abs(rowOffset), Math.abs(colOffset));
      setModule(
        matrix,
        reserved,
        centerRow + rowOffset,
        centerCol + colOffset,
        ring !== 1,
      );
    }
  }
}

function reserveFormatAreas(matrix: boolean[][], reserved: boolean[][]) {
  for (let index = 0; index < 9; index += 1) {
    if (index !== 6) {
      setModule(matrix, reserved, 8, index, false);
      setModule(matrix, reserved, index, 8, false);
    }
  }

  for (let index = 0; index < 8; index += 1) {
    setModule(matrix, reserved, 8, SIZE - 1 - index, false);
    setModule(matrix, reserved, SIZE - 1 - index, 8, false);
  }
}

function placeFunctionPatterns(matrix: boolean[][], reserved: boolean[][]) {
  placeFinder(matrix, reserved, 0, 0);
  placeFinder(matrix, reserved, 0, SIZE - 7);
  placeFinder(matrix, reserved, SIZE - 7, 0);

  for (let index = 8; index < SIZE - 8; index += 1) {
    const dark = index % 2 === 0;
    setModule(matrix, reserved, 6, index, dark);
    setModule(matrix, reserved, index, 6, dark);
  }

  for (const row of ALIGNMENT_POSITIONS) {
    for (const col of ALIGNMENT_POSITIONS) {
      if (
        (row === 6 && col === 6) ||
        (row === 6 && col === SIZE - 7) ||
        (row === SIZE - 7 && col === 6)
      ) {
        continue;
      }
      placeAlignment(matrix, reserved, row, col);
    }
  }

  reserveFormatAreas(matrix, reserved);
  setModule(matrix, reserved, SIZE - 8, 8, true);
}

function getMaskBit(mask: number, row: number, col: number) {
  switch (mask) {
    case 0:
      return (row + col) % 2 === 0;
    case 1:
      return row % 2 === 0;
    case 2:
      return col % 3 === 0;
    case 3:
      return (row + col) % 3 === 0;
    case 4:
      return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
    case 5:
      return ((row * col) % 2) + ((row * col) % 3) === 0;
    case 6:
      return ((((row * col) % 2) + ((row * col) % 3)) % 2) === 0;
    case 7:
      return ((((row + col) % 2) + ((row * col) % 3)) % 2) === 0;
    default:
      return false;
  }
}

function placeDataBits(codewords: number[], matrix: boolean[][], reserved: boolean[][], mask: number) {
  const bits: number[] = [];

  for (const codeword of codewords) {
    pushBits(bits, codeword, 8);
  }

  let bitIndex = 0;
  let upwards = true;

  for (let rightCol = SIZE - 1; rightCol >= 1; rightCol -= 2) {
    if (rightCol === 6) {
      rightCol -= 1;
    }

    for (let step = 0; step < SIZE; step += 1) {
      const row = upwards ? SIZE - 1 - step : step;

      for (let colOffset = 0; colOffset < 2; colOffset += 1) {
        const col = rightCol - colOffset;
        if (reserved[row][col]) continue;

        const bit = bitIndex < bits.length ? bits[bitIndex] : 0;
        bitIndex += 1;
        matrix[row][col] = getMaskBit(mask, row, col) ? bit === 0 : bit === 1;
      }
    }

    upwards = !upwards;
  }
}

function countPenaltyRule1(matrix: boolean[][]) {
  let penalty = 0;

  for (let row = 0; row < SIZE; row += 1) {
    let runColor = matrix[row][0];
    let runLength = 1;

    for (let col = 1; col < SIZE; col += 1) {
      if (matrix[row][col] === runColor) {
        runLength += 1;
      } else {
        if (runLength >= 5) penalty += runLength - 2;
        runColor = matrix[row][col];
        runLength = 1;
      }
    }

    if (runLength >= 5) penalty += runLength - 2;
  }

  for (let col = 0; col < SIZE; col += 1) {
    let runColor = matrix[0][col];
    let runLength = 1;

    for (let row = 1; row < SIZE; row += 1) {
      if (matrix[row][col] === runColor) {
        runLength += 1;
      } else {
        if (runLength >= 5) penalty += runLength - 2;
        runColor = matrix[row][col];
        runLength = 1;
      }
    }

    if (runLength >= 5) penalty += runLength - 2;
  }

  return penalty;
}

function countPenaltyRule2(matrix: boolean[][]) {
  let penalty = 0;

  for (let row = 0; row < SIZE - 1; row += 1) {
    for (let col = 0; col < SIZE - 1; col += 1) {
      const color = matrix[row][col];
      if (
        matrix[row][col + 1] === color &&
        matrix[row + 1][col] === color &&
        matrix[row + 1][col + 1] === color
      ) {
        penalty += 3;
      }
    }
  }

  return penalty;
}

function matchesPattern(values: number[], start: number, pattern: number[]) {
  for (let index = 0; index < pattern.length; index += 1) {
    if (values[start + index] !== pattern[index]) return false;
  }
  return true;
}

function countPenaltyRule3(matrix: boolean[][]) {
  let penalty = 0;
  const patternA = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const patternB = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];

  for (let row = 0; row < SIZE; row += 1) {
    const values = matrix[row].map((cell) => (cell ? 1 : 0));
    for (let start = 0; start <= SIZE - 11; start += 1) {
      if (matchesPattern(values, start, patternA) || matchesPattern(values, start, patternB)) {
        penalty += 40;
      }
    }
  }

  for (let col = 0; col < SIZE; col += 1) {
    const values = Array.from({ length: SIZE }, (_, row) => (matrix[row][col] ? 1 : 0));
    for (let start = 0; start <= SIZE - 11; start += 1) {
      if (matchesPattern(values, start, patternA) || matchesPattern(values, start, patternB)) {
        penalty += 40;
      }
    }
  }

  return penalty;
}

function countPenaltyRule4(matrix: boolean[][]) {
  let darkCount = 0;

  for (const row of matrix) {
    for (const cell of row) {
      if (cell) darkCount += 1;
    }
  }

  const total = SIZE * SIZE;
  const percent = (darkCount * 100) / total;
  const lower = Math.abs(Math.floor(percent / 5) * 5 - 50) / 5;
  const upper = Math.abs(Math.ceil(percent / 5) * 5 - 50) / 5;

  return Math.min(lower, upper) * 10;
}

function getPenaltyScore(matrix: boolean[][]) {
  return (
    countPenaltyRule1(matrix) +
    countPenaltyRule2(matrix) +
    countPenaltyRule3(matrix) +
    countPenaltyRule4(matrix)
  );
}

function getFormatBits(mask: number) {
  const formatData = (0b01 << 3) | mask;
  let remainder = formatData << 10;

  while (bitLength(remainder) >= bitLength(FORMAT_GENERATOR)) {
    remainder ^= FORMAT_GENERATOR << (bitLength(remainder) - bitLength(FORMAT_GENERATOR));
  }

  return ((formatData << 10) | remainder) ^ FORMAT_MASK;
}

function writeFormatBits(matrix: boolean[][], reserved: boolean[][], mask: number) {
  const formatBits = getFormatBits(mask);

  const getBit = (index: number) => ((formatBits >>> index) & 1) === 1;

  for (let index = 0; index <= 5; index += 1) {
    setModule(matrix, reserved, 8, index, getBit(index));
  }
  setModule(matrix, reserved, 8, 7, getBit(6));
  setModule(matrix, reserved, 8, 8, getBit(7));
  setModule(matrix, reserved, 7, 8, getBit(8));

  for (let index = 9; index < 15; index += 1) {
    setModule(matrix, reserved, 14 - index, 8, getBit(index));
  }

  for (let index = 0; index < 8; index += 1) {
    setModule(matrix, reserved, 8, SIZE - 1 - index, getBit(index));
  }

  for (let index = 8; index < 15; index += 1) {
    setModule(matrix, reserved, SIZE - 15 + index, 8, getBit(index));
  }

  setModule(matrix, reserved, SIZE - 8, 8, true);
}

export function generateQrMatrix(text: string) {
  const codewords = encodeData(text);

  let bestMatrix: boolean[][] | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let mask = 0; mask < 8; mask += 1) {
    const matrix = createMatrix(false);
    const reserved = createMatrix(false);

    placeFunctionPatterns(matrix, reserved);
    placeDataBits(codewords, matrix, reserved, mask);
    writeFormatBits(matrix, reserved, mask);

    const score = getPenaltyScore(matrix);
    if (score < bestScore) {
      bestScore = score;
      bestMatrix = matrix;
    }
  }

  if (!bestMatrix) {
    throw new Error("Could not generate QR matrix.");
  }

  return bestMatrix;
}

export function buildQrSvg(
  text: string,
  {
    foreground = "#1A1D20",
    background = "#FFFFFF",
    quietZone = 4,
  }: {
    foreground?: string;
    background?: string;
    quietZone?: number;
  } = {},
) {
  const matrix = generateQrMatrix(text);
  const dimension = SIZE + quietZone * 2;
  const commands: string[] = [];

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (!matrix[row][col]) continue;
      commands.push(`M${col + quietZone},${row + quietZone}h1v1h-1z`);
    }
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dimension} ${dimension}" width="100%" height="100%" shape-rendering="crispEdges">`,
    `<rect width="${dimension}" height="${dimension}" fill="${background}"/>`,
    `<path d="${commands.join("")}" fill="${foreground}"/>`,
    "</svg>",
  ].join("");
}
