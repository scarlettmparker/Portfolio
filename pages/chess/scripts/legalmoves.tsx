import { ChessPiece } from "./piece";
import { ChessPlayer } from "./player";
import { findPiece, getKing, getPieces } from "../play";
/**

*/

const helper: React.FC = () => {
    return null;
  };
  
export default helper;

// PREVENT PIECE JUMPING
function exists(obj: any[], ...keys: number[]) {
    return keys.reduce((acc, key) => acc && acc[key], obj) !== undefined;
}

export function generateLegalMoves(gamePieces: ChessPiece[], currentPlayer: ChessPlayer, pieceMap: string[][][], piece: ChessPiece, isAttacker: boolean) {
    let boardSize = 8;
    let boardMoves: number[][] = [];
    let potentialAttacks: number[][] = [];
    let visionMoves: number[][] = [];
    let currentMove = Math.min(piece.currentMove, pieceMap.length - 1);

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

    let currentX = piece.position.x;
    let currentY = piece.position.y;
    
    // iterate over each direction
    let legalNotations = piece.colour == 1 ? ["w", "m", "r", "c"] : ["b", "m", "t", "c"];

    let startX = Math.max(currentX - 7, 0);
    let endX = Math.min(currentX + 7, boardSize - 1);
    let startY = Math.max(currentY - 7, 0);
    let endY = Math.min(currentY + 7, boardSize - 1);

    for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
            let mapX, mapY;
            if (piece.type == "P" && piece.colour == 0) {
                mapX = x - currentX + 7;
                mapY = 7 - (y - currentY);
            } else {
                mapX = x - currentX + 7;
                mapY = y - currentY + 7;
            }
            if (exists(pieceMap, currentMove, mapY, mapX)) {
                if (legalNotations.includes(pieceMap[currentMove][mapY][mapX])) {
                    if (!isAttacker) {
                        boardMoves.push([x, y]);
                        potentialAttacks.push([x, y]);
                    }
                    visionMoves.push([x, y]);
                }
            }
        }
    }

    let seenPieces: ChessPiece[] = [];
    directions.forEach(({ dx, dy }) => {
        let x = currentX;
        let y = currentY;

        let directionX = 7;
        let directionY = 7;
        let pieceFound = false;
        let ownPieceFound = false;
        let enemiesFound = 0;

        while (true) {
            if (x < 0 || x >= boardSize || y < 0 || y >= boardSize) {
                break;
            }

            let foundPiece = findPiece(gamePieces, x, y);


            if (foundPiece && foundPiece.colour !== piece.colour) {
                enemiesFound++;
                pieceFound = true;
            }

            if (foundPiece && foundPiece !== piece && foundPiece.colour === piece.colour) {
                ownPieceFound = true;
                pieceFound = true;
            }

            if (piece.type == "K" && foundPiece && foundPiece.colour != piece.colour && !seenPieces.includes(foundPiece) && piece !== foundPiece && !isAttacker) {
                console.log("found a piece!");
                seenPieces.push(foundPiece);
            }

            if (piece.type === "P") {
                if (Math.abs(x - currentX) === 1 && y != currentY) {
                    if (!foundPiece || foundPiece.colour === piece.colour) {
                        removeSquare(boardMoves, x, y);
                    }
                } else if (x == currentX) {
                    if (foundPiece) {
                        removeSquare(boardMoves, x, y);
                    }
                }
            }

            if (pieceFound && piece.type != "P" ) {
                removeSquare(boardMoves, x, y)
            }

            if (foundPiece && piece.type != "P") {
                removeSquare(potentialAttacks, x, y);
            }
            
            if (foundPiece && !ownPieceFound && visionMoves.find(([vx, vy]) => vx === x && vy === y)) {
                if (enemiesFound <= 1 && piece.type != "P") {
                    boardMoves.push([x, y]);
                }
                if (enemiesFound <= 2) {
                    if (!(foundPiece.attackingDirection.find(([piece, [dx, dy]]) => dx === x - currentX && dy === y - currentY))) {
                        foundPiece.addAttackingDirection(piece, dx, dy);
                        foundPiece.addPotentialAttacker(piece);
                    }
                    if (enemiesFound == 1 && foundPiece.type == "K") {
                        foundPiece.addAttacker(piece);
                    }
                    potentialAttacks.push([x, y]);
                }
                if (enemiesFound >= 3) {
                    removeSquare(potentialAttacks, x, y);
                }
            }

            x += dx;
            y += dy;
            directionX += dx;
            directionY += dy;
        }
    });

    if (piece.type == "K") {
        piece.seenPieces = seenPieces;
    }
    
    piece.legalMoves = boardMoves;
    piece.potentialAttacks = potentialAttacks;

    let opponentColour = piece.colour === 0 ? 1 : 0;
    let opponentKing = getKing(gamePieces, opponentColour);
    if (opponentKing && opponentKing?.attackers && opponentKing.attackers.length > 0) {
        let legalMoves = 0;
        getPieces(gamePieces, opponentColour).forEach(opponentPiece => {
            generateLegalMoves(gamePieces, currentPlayer, processMoves(opponentPiece.moves), opponentPiece, false);
            legalMoves += opponentPiece.legalMoves.length;
        });
        if (legalMoves == 0) {
            console.log("Checkmate for " + (opponentColour === 0 ? "white" : "black") + " king");
        }
    }

    if (!isAttacker) {
        let king = getKing(gamePieces, piece.colour);
        if (king && king.attackers && king.attackers.length > 0) {
                king.attackers.forEach(attacker => {
                    let newLegalSquares: number[][] = [];
                    let offsetX = 0;
                    let offsetY = 0;
                    let attackingDirections = king.getAttackingDirection(attacker);
                    if (!attackingDirections[0]) {
                        return;
                    }
                    let dx = attackingDirections[0][0];
                    let dy = attackingDirections[0][1];
                    while (offsetX < 8 && offsetY < 8 && offsetX > -8 && offsetY > -8) {
                        if (piece.legalMoves.find(([vx, vy]) => vx == attacker.position.x + offsetX && vy == attacker.position.y + offsetY)) {
                            newLegalSquares.push([attacker.position.x + offsetX, attacker.position.y + offsetY]);
                        }
                        offsetX += dx;
                        offsetY += dy;
                    }
                    if (piece.type != "K") {
                        piece.legalMoves = newLegalSquares;
                    }
                });
        }

        if (piece.type == "K") {
            let opponentPieces = getPieces(gamePieces, opponentColour);
            opponentPieces.forEach(opponentPiece => {
                opponentPiece.legalMoves.forEach(([x, y]) => {
                    removeSquare(piece.legalMoves, x, y);
                });
            });
            seenPieces.forEach(seenPiece => {
                seenPiece.legalMoves.forEach(([x, y]) => {
                    removeSquare(piece.legalMoves, x, y);
                });
            });
        }

        if (piece.potentialAttackers.length == 0) return;
        if (piece.type == "K") return;

        let kingFound = false;
        let ownPieceFound = false;
        let newLegalSquares: number[][] = [];
        piece.potentialAttackers.forEach(attacker => {
            let offsetX = 0;
            let offsetY = 0;
            let pieceCount = 0;
            let attackingDirections = piece.getAttackingDirection(attacker);
            if (!attackingDirections[0]) {
                return;
            }

            let dx = attackingDirections[0][0];
            let dy = attackingDirections[0][1];

            while (offsetX < 8 && offsetY < 8 && offsetX > -8 && offsetY > -8) {
                if (piece.legalMoves.find(([vx, vy]) => vx == attacker.position.x + offsetX && vy == attacker.position.y + offsetY)) {
                    if (attacker.potentialAttacks.find(([vx, vy]) => vx == attacker.position.x + offsetX && vy == attacker.position.y + offsetY)){
                        newLegalSquares.push([attacker.position.x + offsetX, attacker.position.y + offsetY]);
                    }
                }
                let foundPiece = findPiece(gamePieces, attacker.position.x + offsetX, attacker.position.y + offsetY);
                if (foundPiece && foundPiece.colour == piece.colour) {
                    pieceCount++;
                }
                if (foundPiece && foundPiece == piece) {
                    ownPieceFound = true;
                }
                if (foundPiece && foundPiece.colour == piece.colour && foundPiece.type == "K" && pieceCount < 3 && ownPieceFound) {
                    kingFound = true;
                }
                offsetX += dx;
                offsetY += dy;
            }
            if (piece.legalMoves.find(([vx, vy]) => vx == attacker.position.x && vy == attacker.position.y)) {
                newLegalSquares.push([attacker.position.x, attacker.position.y]);
            }
        });
        
        if (kingFound) {
            piece.legalMoves = newLegalSquares;
        }
    }
}

function removeSquare(boardMoves: number[][], x: number, y: number) {
    const indexToRemove = boardMoves.findIndex(([posX, posY]) => posX === x && posY === y);
    if (indexToRemove !== -1) {
        boardMoves.splice(indexToRemove, 1);
    }
}

// PROCESS PIECE MAP
export function processPieceMap(gamePieces: ChessPiece[], player: ChessPlayer, piece: ChessPiece) {
    if (piece.pieceMap.length === 0) {
        let pieceMap = processMoves(piece.moves);
        generateLegalMoves(gamePieces, player, pieceMap, piece, false);
    } else {
        generateLegalMoves(gamePieces, player, piece.pieceMap, piece, false);
    }
}

// LEGAL MOVE CHECK
export function canMove(piece: ChessPiece, moveX: number, moveY: number) {
    for (const [x, y] of piece.legalMoves) {
        if (x === moveX && y === moveY) {
            return true;
        }
    }

    return false;
}

function processMoves(moves: string) {
    const lines = moves.split("\n").filter(line => !line.startsWith("#"));
    const pieceMap: string[][][] = [];

    let currentMoveIndex = 0, rowIndex = 0;
    lines.forEach(line => {
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