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

        let kingFound = false;

        while (true) {
            if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
                break;
            }

            let foundPiece = findPiece(gamePieces, x, y);

            if (foundPiece && foundPiece.player != piece.player && foundPiece.type != "K") {
                enemiesFound++;
            } else if (foundPiece && foundPiece.player != piece.player && foundPiece.type == "K") {
                kingFound = true;
            }

            if (foundPiece && foundPiece !== piece && foundPiece.player === piece.player) {
                teamPiecesFound++;
                if (piece.legalSquares.find(([px, py]) => px === x && py === y) && teamPiecesFound < 2) {
                    piece.pseudoSquares.push([x, y]);
                }
            }

            if (teamPiecesFound >= 1 && piece.type != "P") {
                removeSquare(piece.legalSquares, x, y);
                removeSquare(piece.pseudoSquares, x, y);
            }
 
            if (piece.type === "P") {
                if (Math.abs(x - currentX) === 1 && y != currentY) {
                    // remove attacks if there is no piece to attack
                    if (!foundPiece || foundPiece.player === piece.player) {
                        removeSquare(piece.legalSquares, x, y);
                    }
                } else if (x == currentX) {
                    if (foundPiece && foundPiece !== piece && pseudoSquares.find(([vx, vy]) => vx === x && vy === y)) {
                        removeSquare(piece.legalSquares, x, y);
                        if (piece.player.colour == 0) {
                            removeSquare(piece.legalSquares, x, y + 1);
                        } else {
                            removeSquare(piece.legalSquares, x, y - 1);
                        }
                    }
                }
                if (x == currentX) {
                    removeSquare(piece.pseudoSquares, x, y);
                    removeSquare(piece.pseudoSquares, x, y - 2);
                    removeSquare(piece.pseudoSquares, x, y - 1);
                    removeSquare(piece.pseudoSquares, x, y + 1);
                    removeSquare(piece.pseudoSquares, x, y + 2);
                }
            }

            if (enemiesFound > 0 && piece.type != "P") {
                removeSquare(piece.legalSquares, x, y);
                if (foundPiece && foundPiece.position.x == x && foundPiece.position.y == y
                        && teamPiecesFound == 0 && enemiesFound <= 1) {
                    if (pseudoSquares.find(([px, py]) => px === x && py === y)) {
                        if (!kingFound) {
                            piece.legalSquares.push([x, y]);
                        } else {
                            piece.raySquares.push([x, y]);
                        }
                    }
                }
                if (enemiesFound >= 2 || enemiesFound >= 1 && teamPiecesFound >= 1) {
                    removeSquare(piece.pseudoSquares, x, y);
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
        if (piece.player.pseudoSquares[x][y] == 0) {
            piece.player.pseudoSquares[x][y] = 1;
            piece.player.debugSquares[BOARD_SIZE - 1 - y][x] = 1;
        }
    });

    piece.pseudoSquares.forEach(([x, y]) => {
        let checkPiece = findPiece(gamePieces, x, y);
        if (checkPiece && checkPiece.player == piece.player && piece.type != "P") {
            piece.player.pseudoSquares[x][y] = 1;
            removeSquare(piece.legalSquares, x, y);
        }
    });
}

export function lookForChecks(player: ChessPlayer, opponent: ChessPlayer, king: ChessPiece) {
    if (opponent.pseudoSquares[king.position.x][king.position.y] == 1) {
        player.check = true;
        restrictSquares(player, opponent, king);
    }

    opponent.pieces.forEach(piece => {
        piece.raySquares.forEach(([x, y]) => {
            if (x === king.position.x && y === king.position.y) {
                preventDiscoveredAttack(player, king, piece);
            }
        });
    });

    king.pseudoSquares.forEach(([x, y]) => {
        if (opponent.pseudoSquares[x][y] == 1) {
            removeSquare(king.legalSquares, x, y);
        }
    });

    let legalMoves = 0;
    player.pieces.forEach(piece => {
        legalMoves += piece.legalSquares.length;
    });

    if (legalMoves == 0 && player.check) {
        player.checkmate = true;
        console.log("Player " + player.colour + " is in checkmate!");
    } else if (legalMoves == 0) {
        player.stalemate = true;
        console.log("Stalemate!");
    }
}

function preventDiscoveredAttack(player: ChessPlayer, king: ChessPiece, piece: ChessPiece) {
    const dx = Math.sign(king.position.x - piece.position.x);
    const dy = Math.sign(king.position.y - piece.position.y);

    player.pieces.forEach(p => {
        let x = king.position.x;
        let y = king.position.y;

        let pieceFound = false;
        const validSquares: number[][] = [];

        while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
            if (p.legalSquares.find(([px, py]) => px === x && py === y)) {
                validSquares.push([x, y]);
            }
            if (p !== king && p !== piece && p.position.x === x && p.position.y === y) {
                pieceFound = true;
            }
            
            x -= dx;
            y -= dy;
        }

        if (pieceFound) {
            p.legalSquares = validSquares;
        }
    });
}

function restrictSquares(player: ChessPlayer, opponent: ChessPlayer, king: ChessPiece) {
    const checkingPieces = findCheckingPiece(opponent, king);
    if (checkingPieces.length === 0) {
        return;
    }

    if (checkingPieces.length > 1) {
        player.pieces.forEach(piece => {
            if (piece.type != "K") {
                piece.legalSquares = [];
            }
        });
        return;
    }

    const checkingPiece = checkingPieces[0];
    const checkingSquares = generateLineSquares(checkingPiece, king);

    if (checkingSquares == -1) {
        player.pieces.forEach(piece => {
            if (piece.type != "K") {
                const validSquares: number[][] = [];
                if (piece.legalSquares.some(([x, y]) => x === checkingPiece.position.x && y === checkingPiece.position.y)) {
                    validSquares.push([checkingPiece.position.x, checkingPiece.position.y]);
                }
                piece.legalSquares = validSquares;
            }
        });
        return;
    }

    player.pieces.forEach(piece => {
        if (piece.type != "K") {
            const validSquares: number[][] = [];
            checkingSquares.forEach(([cx, cy]) => {
                if (piece.legalSquares.some(([x, y]) => x === cx && y === cy)) {
                    validSquares.push([cx, cy]);
                }
            });

            if (piece.legalSquares.some(([x, y]) => x === checkingPiece.position.x && y === checkingPiece.position.y)) {
                validSquares.push([checkingPiece.position.x, checkingPiece.position.y]);
            }

            piece.legalSquares = validSquares;
        }
    });
}

function findCheckingPiece(opponent: ChessPlayer, king: ChessPiece) {
    return opponent.pieces.filter(piece => {
        return piece.legalSquares.some(([x, y]) => x === king.position.x && y === king.position.y);
    });
}

function generateLineSquares(attacker: ChessPiece, king: ChessPiece) {
    const lineMoves = [];
    const dx = Math.sign(king.position.x - attacker.position.x);
    const dy = Math.sign(king.position.y - attacker.position.y);

    const testX = king.position.x - attacker.position.x;
    const testY = king.position.y - attacker.position.y;

    const isDirectionalMove = (testX === 0 || testY === 0 || Math.abs(testX) === Math.abs(testY));

    if (!isDirectionalMove) {
        return -1;
    }

    let x = attacker.position.x + dx;
    let y = attacker.position.y + dy;

    while (x !== king.position.x || y !== king.position.y) {
        lineMoves.push([x, y]);
        x += dx;
        y += dy;
    }

    lineMoves.push([king.position.x, king.position.y]);

    return lineMoves;
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