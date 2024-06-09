import { ChessPiece } from "./piece";
import { findPiece } from "../play";

// PREVENT PIECE JUMPING
function preventPieceJumping(gamePieces: ChessPiece[], pieceMap: string[][][], piece: ChessPiece, currentMove: number, currentX: number, currentY: number) {
    let boardSize = 8;
    const directions = [
        { dx: 1, dy: 0 },  // RIGHT
        { dx: -1, dy: 0 }, // LEFT
        { dx: 0, dy: 1 },  // DOWN
        { dx: 0, dy: -1 }, // UP
        { dx: 1, dy: 1 },  // DOWN-RIGHT
        { dx: -1, dy: -1 }, // UP-LEFT
        { dx: 1, dy: -1 }, // UP-RIGHT
        { dx: -1, dy: 1 }  // DOWN-LEFT
    ];

    // iterate over each direction
    directions.forEach(({ dx, dy }) => {
        let x = currentX;
        let y = currentY;
        let pieceFound = false;

        let directionX = 7;
        let directionY = 7;
        let enemyPieceCount = 0;
        while (true) {
            if (x < 0 || x >= boardSize || y < 0 || y >= boardSize) {
                break;
            }

            const foundPiece = findPiece(gamePieces, x, y);
            
            if (foundPiece && foundPiece.colour == piece.colour) {
                pieceMap[currentMove][directionY][directionX] = '.';
            }

            if (foundPiece && !(x == currentX && y == currentY)) {
                pieceFound = true;
            }

            if (foundPiece && foundPiece.colour != piece.colour && !pieceFound && enemyPieceCount == 0) {
                enemyPieceCount++;
            }

            if (!foundPiece && pieceMap[currentMove] && pieceMap[currentMove][directionY] && pieceMap[currentMove][directionY][directionX]) {
                pieceMap[currentMove][directionY][directionX] = pieceMap[currentMove][directionY][directionX].replace('r', '.');
                pieceMap[currentMove][directionY][directionX] = pieceMap[currentMove][directionY][directionX].replace('t', '.');
            }

            if (pieceFound && pieceMap[currentMove] && pieceMap[currentMove][directionY] && pieceMap[currentMove][directionY][directionX]) {
                // check if the next position does not have a piece, indicating a capture is not happening
                if (piece.type == "P" || enemyPieceCount > 0) {
                    pieceMap[currentMove][directionY][directionX] = pieceMap[currentMove][directionY][directionX].replace('m', '.');
                    pieceMap[currentMove][directionY][directionX] = pieceMap[currentMove][directionY][directionX].replace('w', '.');
                    pieceMap[currentMove][directionY][directionX] = pieceMap[currentMove][directionY][directionX].replace('b', '.');
                }
                enemyPieceCount++;
            }

            x += dx;
            y += dy;
            if (piece.colour == 0 || piece.type == "P") {
                directionX -= dx;
                directionY -= dy;
            } else if (piece.colour == 1){
                directionX += dx;
                directionY += dy;
            }
        }
    });

    return pieceMap;
}

// PROCESS PIECE MAP
export function processPieceMap(gamePieces: ChessPiece[], piece: ChessPiece, currentX: number, currentY: number) {
    let pieceMap = processMoves(piece.moves);
    let currentMove = Math.min(piece.currentMove, pieceMap.length - 1);
    pieceMap = preventPieceJumping(gamePieces, pieceMap, piece, currentMove, currentX, currentY);

    return pieceMap;
}

// LEGAL MOVE CHECK
export function canMove(gamePieces: ChessPiece[], player: number, piece: ChessPiece, currentX: number, currentY: number, moveX: number, moveY: number) {
    if (player !== piece.colour) return false;

    let pieceMap = processPieceMap(gamePieces, piece, currentX, currentY);

    // to handle multiple move changes (e.g. with pawns)
    let currentMove = Math.min(piece.currentMove, pieceMap.length - 1);
    const differenceY = currentY - moveY, differenceX = currentX - moveX;

    // get notations based on file input (used for editor)
    const legalNotations = player === 0 ? ["m", "w", "r", "j"] : ["m", "b", "t", "j"];
    const moveType = getSquareIndex(pieceMap, currentMove, differenceY, differenceX);
    const foundPiece = findPiece(gamePieces, moveX, moveY);

    return legalNotations.includes(moveType) && !((moveType === "r" || moveType === "t") && (!foundPiece || foundPiece.colour === player));
}

export function getLegalSquares(pieceMap: string[][][], piece: ChessPiece, legalNotations: string[], currentX: number, currentY: number) {
    let legalSquares: number[][] = [];
    let currentMove = Math.min(piece.currentMove, pieceMap.length - 1);
    for (let i = 0; i < pieceMap[currentMove].length; i++) {
        for (let j = 0; j < (pieceMap[currentMove][i] ? pieceMap[currentMove][i].length : 0); j++) {
            let availableX;
            let availableY;

            // pawns are weird and travel in different directions
            // should probably fix this hard coded-ness at some point
            if (piece.colour == 1 && piece.type != "P") {
                availableX = currentX + (i - 7);
                availableY = currentY + (j - 7);
            } else {
                availableX = currentX + (i - 7) * -1;
                availableY = currentY + (j - 7) * -1;
            }
            if (availableX >= 0 && availableX <= 7 && availableY >= 0 && availableY <= 7) {
                if (pieceMap[currentMove] && pieceMap[currentMove][j] && legalNotations.includes(pieceMap[currentMove][j][i])) {
                    legalSquares.push([availableX, availableY]);
                }
            }
        }
    }
    return legalSquares;
}

function processMoves(moves: string) {
    const lines = moves.split("\n").filter(line => !line.startsWith("#") && !line.match(/^\d/));
    const pieceMap: string[][][] = [];

    let currentMoveIndex = -1, rowIndex = 0;

    lines.forEach(line => {
        if (line[0].match(/^\d/)) {
            currentMoveIndex++;
            rowIndex = 0;
        } else {
            pieceMap[currentMoveIndex] = pieceMap[currentMoveIndex] || [];
            pieceMap[currentMoveIndex][rowIndex] = line.split('');
            rowIndex++;
        }
    });

    return pieceMap;
}

function getSquareIndex(pieceMap: string[][][], currentMove: number, y: number, x: number) {
    return pieceMap[currentMove]?.[y + 7]?.[x + 7] || "";
}