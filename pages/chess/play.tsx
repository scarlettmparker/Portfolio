import styles from './styles/play.module.css'
import Image from 'next/image';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { SetStateAction, useEffect, useState } from 'react';
import { ChessPlayer } from './scripts/player';
import { ChessPiece } from './scripts/piece';
import { canMove, processPieceMap } from './scripts/legalmoves';

// CONSTANTS
const CELL_SIZE = 75;
const PIECE_TYPES = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
const BOARD_SIZE = 8;
const DIRECTORY = '/assets/chess/images/pieces/';

const iconMappings: { [key: string]: string } = {
    'P0': DIRECTORY + 'wp.png',
    'R0': DIRECTORY + 'wr.png',
    'N0': DIRECTORY + 'wn.png',
    'B0': DIRECTORY + 'wb.png',
    'Q0': DIRECTORY + 'wq.png',
    'K0': DIRECTORY + 'wk.png',
    'P1': DIRECTORY + 'bp.png',
    'R1': DIRECTORY + 'br.png',
    'N1': DIRECTORY + 'bn.png',
    'B1': DIRECTORY + 'bb.png',
    'Q1': DIRECTORY + 'bq.png',
    'K1': DIRECTORY + 'bk.png'
};

const MOVE_DIRECTORY = '/assets/chess/movesets/';
const moveMappings: { [key: string]: string } = {
    'P': MOVE_DIRECTORY + 'pawn.txt',
    'R': MOVE_DIRECTORY + 'rook.txt',
    'N': MOVE_DIRECTORY + 'knight.txt',
    'B': MOVE_DIRECTORY + 'bishop.txt',
    'Q': MOVE_DIRECTORY + 'queen.txt',
    'K': MOVE_DIRECTORY + 'king.txt'
};

let gameRunning = false;

// UTILITY FUNCTIONS
function getPieceName(piece: ChessPiece) {
    return piece.type + piece.colour;
}

export function posToNotation(x: number, y: number) {
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const numbers = ['1', '2', '3', '4', '5', '6', '7', '8'];

    return letters[x] + numbers[y];
}

export function findPiece(gamePieces: ChessPiece[], x: number, y: number): ChessPiece | null {
    return gamePieces.find(piece => piece.position.x === x && piece.position.y === y) || null;
}

export function getKing(gamePieces: ChessPiece[], colour: number): ChessPiece | null {
    return gamePieces.find(piece => piece.type === 'K' && piece.colour === colour) || null;
}

export function getPieces(gamePieces: ChessPiece[], colour: number): ChessPiece[] {
    return gamePieces.filter(piece => piece.colour === colour);
}

// BOARD SETUP
async function setupBoard(setGamePieces: any, whitePlayer: { pieces: ChessPiece[]; }, blackPlayer: { pieces: ChessPiece[]; }) {
    whitePlayer.pieces = [];
    blackPlayer.pieces = [];

    for (let i = 0; i < BOARD_SIZE; i++) {
        // create black pieces
        const blackPiece = new ChessPiece(PIECE_TYPES[i], { x: i, y: 7 }, 1, "");
        blackPiece.moves = await readPieceFile(getPieceFile(blackPiece));
        blackPlayer.pieces.push(blackPiece);

        const blackPawn = new ChessPiece('P', { x: i, y: 6 }, 1, "");
        blackPawn.moves = await readPieceFile(getPieceFile(blackPawn));
        blackPlayer.pieces.push(blackPawn);

        // create white pieces
        const whitePiece = new ChessPiece(PIECE_TYPES[i], { x: i, y: 0 }, 0, "");
        whitePiece.moves = await readPieceFile(getPieceFile(whitePiece));
        whitePlayer.pieces.push(whitePiece);

        const whitePawn = new ChessPiece('P', { x: i, y: 1 }, 0, "");
        whitePawn.moves = await readPieceFile(getPieceFile(whitePawn));
        whitePlayer.pieces.push(whitePawn);
    }

    const newGamePieces = [...blackPlayer.pieces, ...whitePlayer.pieces];
    setGamePieces(newGamePieces);

    newGamePieces.forEach(piece => {
        processPieceMap(newGamePieces, piece)
    });
}

async function readPieceFile(file: string): Promise<string> {
    const response = await fetch(file);
    const data = await response.text();
    return data;
}

function getPieceFile(piece: ChessPiece) {
    return moveMappings[piece.type];
}

// GET PIECE COORDINATES
function getPieceCoordinates(i: number, j: number, positions: any[], gamePieces: ChessPiece[]): ChessPiece | null {
    const cellSize = 75;
    const initialX = j * cellSize;
    const initialY = i * cellSize;

    const x = (positions[i * 8 + j].x + initialX) / 75;
    const y = 7 - (positions[i * 8 + j].y + initialY) / 75;

    return findPiece(gamePieces, x, y);
}

// MOVE PIECE
function movePiece(i: number, j: number, data: DraggableData, positions: any[], setPositions: React.Dispatch<SetStateAction<any[]>>,
    gamePieces: ChessPiece[], setGamePieces: React.Dispatch<SetStateAction<ChessPiece[]>>, currentPlayer: ChessPlayer,
    setCurrentPlayer: React.Dispatch<SetStateAction<ChessPlayer>>, selectedPiece: ChessPiece | null,
    whitePlayer: ChessPlayer, blackPlayer: ChessPlayer): void {

    if (!selectedPiece || selectedPiece.colour !== currentPlayer.colour) {
        return;
    }

    let opponentKing = getKing(gamePieces, currentPlayer.colour === 0 ? 1 : 0);
    let king = getKing(gamePieces, currentPlayer.colour);

    if (opponentKing && king) {
        opponentKing.attackers = [];
        opponentKing.attackingDirection = [];
    }

    const initialX = j * CELL_SIZE;
    const initialY = i * CELL_SIZE;
    const xCalc = Math.round((data.x + initialX) / CELL_SIZE);
    const yCalc = 7 - Math.round((data.y + initialY) / CELL_SIZE);

    if (!canMove(selectedPiece, xCalc, yCalc)) {
        return;
    }
    // handle captures
    const targetPiece = findPiece(gamePieces, xCalc, yCalc);
    if (targetPiece && targetPiece.colour !== currentPlayer.colour) {
        console.log("Captured " + targetPiece.type + " at " + xCalc + ", " + yCalc);
        gamePieces = removeGamePiece(gamePieces, targetPiece);
        setGamePieces([...gamePieces]); // update gamePieces state after removal
    }

    // move the piece
    selectedPiece.position = { x: xCalc, y: yCalc };
    selectedPiece.currentMove += 1;
    setPositions([...positions]);

    if (selectedPiece) {
        processPieceMap(gamePieces, selectedPiece);
        checkForCheck(gamePieces, currentPlayer, selectedPiece);
    }

    // switch the current player
    const nextPlayer = switchPlayer(currentPlayer, whitePlayer, blackPlayer);
    setCurrentPlayer(nextPlayer);

    if (gameRunning && currentPlayer.colour === whitePlayer.colour) {
        //makeRandomMove(gamePieces, blackPlayer, setCurrentPlayer, positions, setPositions, setGamePieces, whitePlayer, blackPlayer);
    }
}

function makeRandomMove(gamePieces: ChessPiece[], currentPlayer: ChessPlayer, setCurrentPlayer: React.Dispatch<SetStateAction<ChessPlayer>>,
    positions: any[], setPositions: React.Dispatch<SetStateAction<any[]>>, setGamePieces: React.Dispatch<SetStateAction<ChessPiece[]>>,
    whitePlayer: ChessPlayer, blackPlayer: ChessPlayer): void {

    const pieces = getPieces(gamePieces, currentPlayer.colour);
    pieces.forEach(piece => processPieceMap(gamePieces, piece));

    let randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    let randomMove = randomPiece.legalMoves[Math.floor(Math.random() * randomPiece.legalMoves.length)];

    while (!randomMove) {
        randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
        randomMove = randomPiece.legalMoves[Math.floor(Math.random() * randomPiece.legalMoves.length)];
    }

    while (!canMove(randomPiece, randomMove[0], randomMove[1])) {
        randomMove = randomPiece.legalMoves[Math.floor(Math.random() * randomPiece.legalMoves.length)];
    }

    if (randomMove) {
        const [x, y] = randomMove;
        const targetPiece = findPiece(gamePieces, x, y);
        if (targetPiece && targetPiece !== randomPiece) {
            console.log("Captured " + targetPiece.type + " at " + x + ", " + y);
            gamePieces = removeGamePiece(gamePieces, targetPiece);
            setGamePieces([...gamePieces]);
        }

        randomPiece.position = { x, y };
        randomPiece.currentMove += 1;

        setPositions([...positions]);

        processPieceMap(gamePieces, randomPiece);
        randomPiece.updatePieces.forEach(piece => processPieceMap(gamePieces, piece));
        checkForCheck(gamePieces, currentPlayer, randomPiece);

        // Switch the current player
        const nextPlayer = switchPlayer(currentPlayer, whitePlayer, blackPlayer);
        setCurrentPlayer(nextPlayer);
    }
}

function checkForCheck(gamePieces: ChessPiece[], currentPlayer: ChessPlayer, piece: ChessPiece) {
    let opponentColour = currentPlayer.colour === 0 ? 1 : 0;
    const opponentKing = getKing(gamePieces, opponentColour);
    let testMoves = piece.type == "P" ? piece.potentialAttacks : piece.legalMoves;
    let check = false;
    
    testMoves.forEach(([x, y]) => {
        if (opponentKing && opponentKing.position.x === x && opponentKing.position.y === y) {
            check = true;
        }
    });

    if (check) {
        console.log("Check!");
        let legalMoves = 0;
        getPieces(gamePieces, opponentColour).forEach(opponentPiece => {
            processPieceMap(gamePieces, opponentPiece);
            legalMoves += opponentPiece.legalMoves.length;
        });
        if (legalMoves == 0) {
            // TODO: checkmate screen
            console.log("Checkmate for " + (opponentColour === 0 ? "white" : "black") + " king");
            gameRunning = false;
        }
    }

    if (piece.colour == currentPlayer.colour) {
        piece.updatePieces.forEach(updatePiece => {
            processPieceMap(gamePieces, updatePiece);
        });
    }
}

function removeGamePiece(gamePieces: ChessPiece[], piece: ChessPiece): ChessPiece[] {
    return gamePieces.filter(p => p !== piece);
}

function switchPlayer(currentPlayer: ChessPlayer, whitePlayer: ChessPlayer, blackPlayer: ChessPlayer): ChessPlayer {
    return currentPlayer.colour === whitePlayer.colour ? blackPlayer : whitePlayer;
}

// PLAY COMPONENT
export default function Play() {
    const [gamePieces, setGamePieces] = useState<ChessPiece[]>([]);
    const [positions, setPositions] = useState(Array(64).fill({ x: 0, y: 0 }));
    const [legalSquares, setLegalSquares] = useState<number[][]>([]);
    const [selectedPiece, setSelectedPiece] = useState<ChessPiece | null>(null);
    const [whitePlayer] = useState(new ChessPlayer());
    const [blackPlayer] = useState(new ChessPlayer());
    const [currentPlayer, setCurrentPlayer] = useState<ChessPlayer>(whitePlayer);

    whitePlayer.colour = 0;
    blackPlayer.colour = 1;
    gameRunning = true;

    useEffect(() => {
        setupBoard(setGamePieces, whitePlayer, blackPlayer);
    }, [whitePlayer, blackPlayer]);

    const createBoard = () => (
        Array(8).fill(0).map((_, j) => (
            <div key={`row${j}`}>
                {Array(8).fill(0).map((_, i) => {
                    const isBlack = (i + j) % 2 === 0;
                    const squareColor = isBlack ? 'white' : 'black';
                    const piece = gamePieces.find(p => p.position.x === j && p.position.y === 7 - i);
                    const isLegalSquare = legalSquares.some(([x, y]) => x === j && y === 7 - i);

                    // change div class for legal mvoes
                    const squareClasses = `${styles[squareColor]} ${styles.square} ${isLegalSquare ? styles[`legalSquare${squareColor}`] : ''
                        }`;
                    return (
                        <div key={`square-${j}-${i}`} className={squareClasses} style={{ position: 'relative' }}>
                            <div className={styles.not}>{posToNotation(j, 7 - i)}</div>
                            {piece && (
                                <Draggable position={positions[i * 8 + j]}
                                    onMouseDown={() => {
                                        const piece = getPieceCoordinates(i, j, positions, gamePieces);
                                        setSelectedPiece(piece);
                                        if (piece && gameRunning) {
                                            if (piece.colour == currentPlayer.colour) {
                                                processPieceMap(gamePieces, piece);
                                            }
                                            const legalMoves = piece.legalMoves;
                                            setLegalSquares(legalMoves);
                                        }
                                    }}
                                    onStop={(e, data) => {
                                        setLegalSquares([]);
                                        movePiece(i, j, data, positions, setPositions, gamePieces, setGamePieces, currentPlayer, setCurrentPlayer, selectedPiece, whitePlayer, blackPlayer);                                    
                                        setSelectedPiece(null);
                                    }}>
                                    <div key={piece ? piece.type + piece.position.x + piece.position.y : `empty${i}${j}`}
                                        className={piece ? (piece.colour === 0 ? styles.whitePiece : styles.blackPiece) : styles.piece}
                                        style={{ position: 'absolute', top: 0 }}>
                                        <Image src={iconMappings[getPieceName(piece)]} alt="Piece" width={64} height={64} draggable="false" />
                                    </div>
                                </Draggable>
                            )}
                        </div>
                    );
                })}
            </div>
        ))
    );

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.experienceWrapper}>
                <div className={styles.gameWrapper}>
                    {createBoard()}
                </div>
                <div className={styles.buttonWrapper}>
                    <button className={styles.button} onClick={() => {
                        setCurrentPlayer(whitePlayer);
                        setupBoard(setGamePieces, whitePlayer, blackPlayer)
                    }}>RESET</button>
                </div>
            </div>
        </div>
    );
}