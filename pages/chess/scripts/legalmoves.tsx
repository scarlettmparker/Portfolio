import { ChessPiece } from "./piece";
import { ChessPlayer } from "./player";
import { findPiece, getKing, getPieces, posToNotation } from "../play";
/**
If it sees its own colour piece, remove the square (done) and add the piece to an array in the found pieces
generate check moves function
*/

const helper: React.FC = () => {
    return null;
};

export default helper;

// PREVENT PIECE JUMPING
function exists(obj: any[], ...keys: number[]) {
    return keys.reduce((acc, key) => acc && acc[key], obj) !== undefined;
}

export function generateLegalMoves(gamePieces: ChessPiece[], pieceMap: string[][][], piece: ChessPiece, isAttacker: boolean) {
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

    // fill up the moves from the piece map
    for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
            let mapX, mapY;
            // because pawns take differently to most pieces their piece map is different
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
                    if (piece.type != "P") {
                        visionMoves.push([x, y]);
                    }
                }
            }
        }
    }

    // used for the king to detect nearby pieces that may attack
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
            let foundPiece = findPiece(gamePieces, x, y);
            // if king sees a piece
            if (piece.type == "K" && foundPiece && foundPiece.colour != piece.colour && !seenPieces.includes(foundPiece) && piece !== foundPiece && !isAttacker) {
                seenPieces.push(foundPiece);
            }

            if (x < 0 || x >= boardSize || y < 0 || y >= boardSize) {
                break;
            }

            // if a piece is found, start to fill the potential attacks
            if (foundPiece && foundPiece.colour !== piece.colour) {
                enemiesFound++;
                pieceFound = true;
            }

            if (foundPiece && foundPiece !== piece && foundPiece.colour === piece.colour) {
                ownPieceFound = true;
                pieceFound = true;
            }

            if (piece.type === "P") {
                if (Math.abs(x - currentX) === 1 && y != currentY) {
                    // remove attacks if there is no piece to attack
                    if (!foundPiece || foundPiece.colour === piece.colour) {
                        removeSquare(boardMoves, x, y);
                    }
                } else if (x == currentX) {
                    removeSquare(potentialAttacks, x, y);
                    if (foundPiece && foundPiece !== piece && boardMoves.find(([vx, vy]) => vx === x && vy === y)) {
                        removeSquare(boardMoves, x, y);
                        removeSquare(boardMoves, x, y + 1);
                        removeSquare(boardMoves, x, y - 1); 
                    }
                }
            }

            if (pieceFound && piece.type != "P") {
                removeSquare(boardMoves, x, y)
                removeSquare(potentialAttacks, x, y);
            }

            if (!foundPiece && enemiesFound == 1 && !ownPieceFound && visionMoves.find(([vx, vy]) => vx === x && vy === y)) {
                potentialAttacks.push([x, y]);
            }

            if (foundPiece && !ownPieceFound && visionMoves.find(([vx, vy]) => vx === x && vy === y)) {
                if (enemiesFound == 1 && foundPiece.type == "K" && foundPiece.colour != piece.colour) {
                    foundPiece.addAttacker(piece);
                }
                if (enemiesFound <= 1) {
                    boardMoves.push([x, y]);
                }
                // if a piece is under attack add the attacking direction to the piece
                if (enemiesFound <= 2) {
                    potentialAttacks.push([x, y]);
                }
                if (enemiesFound >= 3) {
                    removeSquare(potentialAttacks, x, y);
                }
            }

            if (foundPiece && visionMoves.find(([vx, vy]) => vx === x && vy === y) && enemiesFound < 1) {
                foundPiece.addOverlapSquare(x, y);
                potentialAttacks.push([x, y]);
            };

            if (foundPiece && !ownPieceFound && potentialAttacks.find(([vx, vy]) => vx === x && vy === y)) {
                foundPiece.removeAllAttackingDirections(piece);
                foundPiece.addAttackingDirection(piece, dx, dy);
                foundPiece.addPotentialAttacker(piece);
            }

            // increment in every direction
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
    piece.legalMoves.forEach(([x, y]) => {
        let foundPiece = findPiece(gamePieces, x, y);
        if (foundPiece && foundPiece != piece && foundPiece.colour != piece.colour && foundPiece.type == "K") {
            if (!foundPiece.attackers.includes(piece)) {
                foundPiece.addAttacker(piece);
            }
        }
    });

    getPieces(gamePieces, piece.colour).forEach(gamePiece => {
        if (gamePiece.potentialAttacks.find(([x, y]) => x === piece.position.x && y === piece.position.y)) {
            if (!piece.updatePieces.includes(gamePiece)) {
                piece.updatePieces.push(gamePiece);
            }
        }
        if (piece.legalMoves.find(([x, y]) => x === gamePiece.position.x && y === gamePiece.position.y && gamePiece.colour === piece.colour)) {
            removeSquare(piece.legalMoves, gamePiece.position.x, gamePiece.position.y);
        }
    });

    piece.potentialAttacks = potentialAttacks;

    let opponentColour = piece.colour == 0 ? 1 : 0;
    if (piece.type == "K") {
        let opponentPieces = getPieces(gamePieces, opponentColour);
        opponentPieces.forEach(opponentPiece => {
            let testMoves = opponentPiece.type == "P" ? opponentPiece.potentialAttacks : opponentPiece.legalMoves;
            testMoves.forEach(([x, y]) => {
                removeSquare(piece.legalMoves, x, y);
            });
        });

        piece.attackers.forEach(attacker => {
            let attackingDirections = piece.getAttackingDirection(attacker);
            if (!attackingDirections) return;
            for (let i = 0; i < attackingDirections.length; i++) {
                let dx = attackingDirections[i][0];
                let dy = attackingDirections[i][1];
                let x = attacker.position.x;
                let y = attacker.position.y;
                let offsetX = 0;
                let offsetY = 0;
                let pieceFound = false;
                while (offsetX < 8 && offsetY < 8 && offsetX > -8 && offsetY > -8) {
                    let foundPiece = findPiece(gamePieces, x + offsetX, y + offsetY);
                    if (foundPiece && foundPiece !== piece && foundPiece.colour === piece.colour) {
                        pieceFound = true;
                    }
                    if (!pieceFound && piece.legalMoves.find(([vx, vy]) => vx === x + offsetX && vy === y + offsetY)) {
                        removeSquare(piece.legalMoves, x + offsetX, y + offsetY);
                    }   
                    offsetX += dx;
                    offsetY += dy;
                }
            };
        });
    }

    // if in check
    let king = getKing(gamePieces, piece.colour);
    if (king && king.attackers && king.attackers.length > 0) {
        king.attackers.forEach(attacker => {
            // check in directions that the king is attacked
            let attackingDirections = king.getAttackingDirection(attacker);
            if (attackingDirections.length == 0) {
                getPieces(gamePieces, piece.colour).forEach(piece => {
                    if (piece.type != "K") {
                        if (piece.legalMoves.find(([vx, vy]) => vx == attacker.position.x && vy == attacker.position.y)) {
                            piece.legalMoves = [];
                            piece.legalMoves.push([attacker.position.x, attacker.position.y]);
                        } else {
                            piece.legalMoves = [];
                        }
                    }
                });
            }
            
            getPieces(gamePieces, piece.colour).forEach(piece => {
                let newLegalSquares: number[][] = [];
                let offsetX = 0;
                let offsetY = 0;

                if (attacker.type == "P") {
                    if (piece.legalMoves.find(([vx, vy]) => vx == attacker.position.x && vy == attacker.position.y)) {
                        newLegalSquares.push([attacker.position.x, attacker.position.y]);
                    }
                    if (piece.type != "K") {
                        piece.legalMoves = newLegalSquares;
                    }
                }

                if (attackingDirections.length != 0) {
                    let dx = attackingDirections[0][0];
                    let dy = attackingDirections[0][1];

                    // don't overflow, saves a bit of time.
                    while (offsetX < 8 && offsetY < 8 && offsetX > -8 && offsetY > -8) {
                        if (piece.legalMoves.find(([vx, vy]) => vx == attacker.position.x + offsetX && vy == attacker.position.y + offsetY)) {
                            if (attacker.legalMoves.find(([vx, vy]) => vx == attacker.position.x + offsetX && vy == attacker.position.y + offsetY)) {
                                // pieces can go wherever the attacker can also go on the diagonal by which it's attacking
                                newLegalSquares.push([attacker.position.x + offsetX, attacker.position.y + offsetY]);
                            }
                        }
                        offsetX += dx;
                        offsetY += dy;
                    }
                    if (piece.legalMoves.find(([vx, vy]) => vx == attacker.position.x && vy == attacker.position.y)) {
                        newLegalSquares.push([attacker.position.x, attacker.position.y]);
                    }
                    // logic is reversed for king so don't change it
                    if (piece.type != "K") {
                        piece.legalMoves = newLegalSquares;
                    }
                }
            });
        });
    }

    piece.potentialAttackers.forEach(attacker => {
        if (attacker.overlapSquares.length == 0 && piece.potentialAttacks.find(([vx, vy]) => vx == attacker.position.x && vy == attacker.position.y)) {
            piece.legalMoves.push([attacker.position.x, attacker.position.y]);
        }
        attacker.overlapSquares = [];
    });
}

function removeSquare(boardMoves: number[][], x: number, y: number) {
    const indexToRemove = boardMoves.findIndex(([posX, posY]) => posX === x && posY === y);
    if (indexToRemove !== -1) {
        boardMoves.splice(indexToRemove, 1);
    }
}

// PROCESS PIECE MAP
export function processPieceMap(gamePieces: ChessPiece[], piece: ChessPiece) {
    if (piece.pieceMap.length === 0) {
        let pieceMap = processMoves(piece.moves);
        generateLegalMoves(gamePieces, pieceMap, piece, false);
    } else {
        generateLegalMoves(gamePieces, piece.pieceMap, piece, false);
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

export function processMoves(moves: string) {
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