import { ChessPiece } from "./piece";
import { ChessPlayer } from "./player";
import { findPiece, getKing, getPieces, posToNotation } from "../play";
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


/**
TODO:
Generate legal moves when a piece is unblocked
*/
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
                    visionMoves.push([x, y]);
                }
            }
        }
    }

    // used for the king to detect nearby pieces that may attack
    let seenPieces: ChessPiece[] = [];
    let updatePieces: ChessPiece[] = [];

    directions.forEach(({ dx, dy }) => {
        let x = currentX;
        let y = currentY;
        let directionX = 7;
        let directionY = 7;

        let pieceFound = false;
        let ownPieceFound = false;
        let checkPieceFound = false;

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

            if (foundPiece && foundPiece !== piece && foundPiece.colour === piece.colour && !isAttacker && !checkPieceFound && !updatePieces.includes(foundPiece)) {
                updatePieces.push(foundPiece);
                checkPieceFound = true;
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
                    if (foundPiece) {
                        removeSquare(boardMoves, x, y);
                    }
                }
            }

            if (pieceFound && piece.type != "P") {
                removeSquare(boardMoves, x, y)
            }

            if (pieceFound && piece.type != "P") {
                removeSquare(potentialAttacks, x, y);
            }

            if (!foundPiece && enemiesFound == 1 && piece.type != "P" && !ownPieceFound) {
                potentialAttacks.push([x, y]);
            }
            
            if (foundPiece && !ownPieceFound && visionMoves.find(([vx, vy]) => vx === x && vy === y)) {
                if (enemiesFound <= 1) {
                    boardMoves.push([x, y]);
                }
                // if a piece is under attack add the attacking direction to the piece
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

            if (foundPiece && visionMoves.find(([vx, vy]) => vx === x && vy === y) && piece.type != "P" && enemiesFound < 1) {
                potentialAttacks.push([x, y]);
            };

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

    piece.updatePieces = updatePieces;
    piece.legalMoves = boardMoves;
    piece.potentialAttacks = potentialAttacks;

    let opponentColour = piece.colour === 0 ? 1 : 0;
    let opponentKing = getKing(gamePieces, opponentColour);

    // if opponent king has attackers its in check
    if (opponentKing && opponentKing?.attackers && opponentKing.attackers.length > 0) {
        let legalMoves = 0;
        getPieces(gamePieces, opponentColour).forEach(opponentPiece => {
            generateLegalMoves(gamePieces, currentPlayer, processMoves(opponentPiece.moves), opponentPiece, false);
            legalMoves += opponentPiece.legalMoves.length;
        });
        // if no avaiable moves for the opponent, do checkmate stuff
        if (legalMoves == 0) {
            // TODO: checkmate screen
            console.log("Checkmate for " + (opponentColour === 0 ? "white" : "black") + " king");
        }
    }

    if (!isAttacker) {
        let king = getKing(gamePieces, piece.colour);
        // if in check
        if (king && king.attackers && king.attackers.length > 0) {
            king.attackers.forEach(attacker => {
                let newLegalSquares: number[][] = [];
                let offsetX = 0;
                let offsetY = 0;

                // check in directions that the king is attacked
                let attackingDirections = king.getAttackingDirection(attacker);
                if (!attackingDirections[0]) {
                    return;
                }
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
            });
        }

        if (piece.type == "K") {
            let opponentPieces = getPieces(gamePieces, opponentColour);
            opponentPieces.forEach(opponentPiece => {
                // so king doesn't run into potential pawn attacks
                if (opponentPiece.type == "P") {
                    opponentPiece.potentialAttacks.forEach(([x, y]) => {
                        removeSquare(piece.legalMoves, x, y);
                    });
                } else {
                    // so king doesn't run into other pieces
                    opponentPiece.legalMoves.forEach(([x, y]) => {
                        removeSquare(piece.legalMoves, x, y);
                    });
                }
            });

            // if currently in check
            if (king && king.attackers && king.attackers.length > 0) {
                king.attackers.forEach(attacker => {
                    attacker.potentialAttacks.forEach(([x, y]) => {
                        piece.legalMoves.forEach(([vx, vy]) => {
                            if (vx == x && vy == y) {
                                // king can't continue on same line by which it's being attacked
                                removeSquare(piece.legalMoves, x, y);
                            }
                        });
                    });
                });
            }

            // can't run into any detected pieces either
            seenPieces.forEach(seenPiece => {
                if (seenPiece.type != "P") {
                    seenPiece.legalMoves.forEach(([x, y]) => {
                        removeSquare(piece.legalMoves, x, y);
                    });
                }
            });
        }

        if (piece.potentialAttackers.length == 0) return;
        if (piece.type == "K") return;

        let kingFound = false;
        let ownPieceFound = false;

        piece.potentialAttackers.forEach(attacker => {
            let newLegalSquares: number[][] = [];
            let offsetX = 0;
            let offsetY = 0;
            let pieceCount = 0;
            // get the direction in which the piece is attacking
            let attackingDirections = piece.getAttackingDirection(attacker);
            if (!attackingDirections[0]) {
                return;
            }

            let dx = attackingDirections[0][0];
            let dy = attackingDirections[0][1];

            // this is basically just a reverse of the king code
            while (offsetX < 8 && offsetY < 8 && offsetX > -8 && offsetY > -8) {
                if (attacker.potentialAttacks.find(([vx, vy]) => vx == attacker.position.x + offsetX && vy == attacker.position.y + offsetY)){
                    newLegalSquares.push([attacker.position.x + offsetX, attacker.position.y + offsetY]);
                }
                let foundPiece = findPiece(gamePieces, attacker.position.x + offsetX, attacker.position.y + offsetY);
                if (foundPiece && foundPiece.colour == piece.colour) {
                    pieceCount++;
                }
                if (foundPiece && foundPiece == piece) {
                    ownPieceFound = true;
                }
                // i'm not sure if the piece count is necessary anymore but we're keeping it
                if (foundPiece && foundPiece.colour == piece.colour && foundPiece.type == "K" && pieceCount < 3 && ownPieceFound) {
                    kingFound = true;
                }
                offsetX += dx;
                offsetY += dy;
            }
                   
            // if the king is behind the piece, remove all moves that aren't matched with the attacking direction
            if (kingFound) {
                let newLegalMoves: number[][] = [];
                if (piece.potentialAttackers.length == 1) {
                    newLegalMoves.push([attacker.position.x, attacker.position.y]);
                }
                piece.legalMoves.forEach(([x, y]) => {
                    if (newLegalSquares.find(([vx, vy]) => vx == x && vy == y)) {
                        newLegalMoves.push([x, y]);
                    }
                });
                // update legal moves
                piece.legalMoves = newLegalMoves;
            }
        });
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