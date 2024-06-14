import { ChessPiece } from "./piece";
import { ChessPlayer } from "./player";
import { exists, findPiece, posToNotation } from "./utils";

const helper: React.FC = () => {
    return null;
};

export default helper;

const BOARD_SIZE = 8;
const DIRECTIONS = [
    { dx: 1, dy: 0 },  // RIGHT
    { dx: -1, dy: 0 }, // LEFT
    { dx: 0, dy: 1 },  // DOWN
    { dx: 0, dy: -1 }, // UP
    { dx: 1, dy: 1 },  // DOWN-RIGHT
    { dx: -1, dy: -1 }, // UP-LEFT
    { dx: 1, dy: -1 }, // UP-RIGHT
    { dx: -1, dy: 1 }  // DOWN-LEFT
];

export function generatePseudoMoves(gamePieces: ChessPiece[], piece: ChessPiece) {
    let currentX = piece.position.x;
    let currentY = piece.position.y;

    let legalNotations = ["m", "c"];
    let pseudoSquares = [];

    let move = Math.min(piece.move, piece.baseSquares.length - 1);

    let startX = Math.max(currentX - 7, 0);
    let endX = Math.min(currentX + 7, BOARD_SIZE - 1);
    let startY = Math.max(currentY - 7, 0);
    let endY = Math.min(currentY + 7, BOARD_SIZE - 1);

    for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
            let mapX, mapY;

            // because pawns take differently to most pieces their piece map is different
            if (piece.type == "P" && piece.player.colour == 0) {
                mapX = x - currentX + 7;
                mapY = 7 - (y - currentY);
            } else {
                mapX = x - currentX + 7;
                mapY = y - currentY + 7;
            }
            if (exists(piece.baseSquares, move, mapY, mapX)) {
                if (legalNotations.includes(piece.baseSquares[move][mapY][mapX])) {
                    pseudoSquares.push([x, y]);
                }
            }
        }
    }

    piece.legalSquares = [...pseudoSquares];
    piece.pseudoSquares = [...pseudoSquares];

    DIRECTIONS.forEach(({ dx, dy }) => {
        let x = currentX;
        let y = currentY;

        let directionX = 7;
        let directionY = 7;

        let enemiesFound = 0;
        let teamPiecesFound = 0;

        while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
            let foundPiece = findPiece(gamePieces, x, y);

            if (foundPiece && foundPiece.player != piece.player && foundPiece.type != "K") {
                enemiesFound++;
            }

            if (foundPiece && foundPiece !== piece && foundPiece.player === piece.player) {
                teamPiecesFound++;
            }

            if (teamPiecesFound > 0 && piece.type != "P") {
                removeSquare(piece.legalSquares, x, y);
            }

            if (piece.type === "P") {
                if (Math.abs(x - currentX) === 1 && y != currentY) {
                    // remove attacks if there is no piece to attack
                    piece.player.pseudoSquares[x][y] = 1;
                    if (!foundPiece || foundPiece.player === piece.player) {
                        removeSquare(piece.legalSquares, x, y);
                    }
                } else if (x == currentX) {
                    removeSquare(piece.pseudoSquares, x, y);
                    if (foundPiece && foundPiece !== piece && pseudoSquares.find(([vx, vy]) => vx === x && vy === y)) {
                        removeSquare(piece.legalSquares, x, y);
                        removeSquare(piece.legalSquares, x, y + 1);
                        removeSquare(piece.legalSquares, x, y - 1);
                    }
                }
            }

            if (enemiesFound > 0 && piece.type != "P") {
                removeSquare(piece.legalSquares, x, y);
                if (foundPiece && foundPiece.position.x == x && foundPiece.position.y == y
                        && teamPiecesFound == 0 && enemiesFound < 2) {
                    if (pseudoSquares.find(([px, py]) => px === x && py === y)) {
                        piece.legalSquares.push([x, y]);
                    }
                }
            }
    
            // increment in every direction
            x += dx;
            y += dy;

            directionX += dx;
            directionY += dy;
        }
    });

    
    let checkSquares = piece.type == "P" ? piece.pseudoSquares : piece.legalSquares;
    checkSquares.forEach(([x, y]) => {
        if (findPiece(gamePieces, x, y)) {
            removeSquare(piece.legalSquares, x, y);
        }
        if (piece.player.pseudoSquares[x][y] == 0) {
            piece.player.pseudoSquares[x][y] = 1;
            piece.player.debugSquares[BOARD_SIZE - 1 - y][x] = 1;
        }
    });
}

export function lookForChecks(player: ChessPlayer, opponent: ChessPlayer, king: ChessPiece) {
    if (opponent.pseudoSquares[king.position.x][king.position.y] == 1) {
        console.log("Check!");
        player.checked = true;
    }

    king.pseudoSquares.forEach(([x, y]) => {
        console.log("Checking king " + player.colour + " square at " + posToNotation(x, y) + " for check");
        if (opponent.pseudoSquares[x][y] == 1) {
            console.log("Removing squre at " + posToNotation(x, y) + " because of check");
            removeSquare(king.legalSquares, x, y);
        }
    });
}

function removeSquare(boardMoves: number[][], x: number, y: number) {
    const indexToRemove = boardMoves.findIndex(([posX, posY]) => posX === x && posY === y);
    if (indexToRemove !== -1) {
        boardMoves.splice(indexToRemove, 1);
    }
}

// LEGAL MOVE CHECK
export function canMove(piece: ChessPiece, moveX: number, moveY: number) {
    for (const [x, y] of piece.legalSquares) {
        if (x === moveX && y === moveY) {
            return true;
        }
    }
    return false;
}

// PROCESS MOVES
export function processMoves(moves: string) {
    const lines = moves.split("\n").filter(line => !line.startsWith("#"));
    const pieceMap: string[][][] = [];

    // create a map of the piece moves
    let currentMoveIndex = 0, rowIndex = 0;
    lines.forEach(line => {
        // if the line starts with a number, it's a new move
        if (line[0].match(/^\d/)) {
            currentMoveIndex++;
            pieceMap[currentMoveIndex] = pieceMap[currentMoveIndex] || [];
            rowIndex = 0;
        } else {
            pieceMap[currentMoveIndex] = pieceMap[currentMoveIndex] || [];
            pieceMap[currentMoveIndex][rowIndex] = line.split('');
            rowIndex++;
        }
    });

    return pieceMap;
}