import styles from './styles/play.module.css'
import Image from 'next/image';
import Draggable, { DraggableData }from 'react-draggable';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { ChessPiece } from './scripts/piece';
import { ChessPlayer } from './scripts/player';
import { posToNotation, getPieceName, readPieceFile, getPieceFile, findPiece, findKing, fillPseudoMoves, getPieces } from './scripts/utils';
import { lookForChecks } from './scripts/legalmoves';

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

async function setupBoard(setGamePieces: any, whitePlayer: ChessPlayer, blackPlayer: ChessPlayer) {
    for (let i = 0; i < BOARD_SIZE; i++) {
        // create black pieces
        const blackPiece = new ChessPiece(PIECE_TYPES[i], { x: i, y: 7 }, blackPlayer, await readPieceFile(getPieceFile(PIECE_TYPES[i])));
        blackPlayer.addPiece(blackPiece);

        const blackPawn = new ChessPiece('P', { x: i, y: 6 }, blackPlayer, await readPieceFile(getPieceFile('P')));
        blackPlayer.pieces.push(blackPawn);

        // create white pieces
        const whitePiece = new ChessPiece(PIECE_TYPES[i], { x: i, y: 0 }, whitePlayer, await readPieceFile(getPieceFile(PIECE_TYPES[i])));
        whitePlayer.addPiece(whitePiece);

        const whitePawn = new ChessPiece('P', { x: i, y: 1 }, whitePlayer, await readPieceFile(getPieceFile('P')));
        whitePlayer.addPiece(whitePawn);
    }

    const newGamePieces = [...blackPlayer.pieces, ...whitePlayer.pieces];

    setGamePieces(newGamePieces);
    fillPseudoMoves(newGamePieces);
}

export default function Play() {
    const [gamePieces, setGamePieces] = useState<ChessPiece[]>([]);
    const [positions, setPositions] = useState(Array(64).fill({ x: 0, y: 0 }));
    const [selectedPiece, setSelectedPiece] = useState<ChessPiece | null>(null);
    const [legalSquares, setLegalSquares] = useState<number[][]>([]);

    const [whitePlayer] = useState(new ChessPlayer(0));
    const [blackPlayer] = useState(new ChessPlayer(1));
    const [currentPlayer, setCurrentPlayer] = useState<ChessPlayer>(whitePlayer);

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
                    
                    // change div class for legal mvoes
                    const isLegalSquare = legalSquares.some(([x, y]) => x === j && y === 7 - i);
                    const squareClasses = `${styles[squareColor]} ${styles.square} ${isLegalSquare ? styles[`legalSquare${squareColor}`] : ''}`;
                    return (
                        <div key={`square-${j}-${i}`} className={squareClasses} style={{ position: 'relative' }}>
                            <div className={styles.not}>{posToNotation(j, 7 - i)}</div>
                            {piece && (
                                <Draggable position={positions[i * 8 + j]}
                                    onMouseDown={() => {
                                        setSelectedPiece(piece);
                                        if (piece && piece.player == currentPlayer) {
                                            const legalSquares = piece.legalSquares;
                                            setLegalSquares(legalSquares);
                                        }
                                    }}
                                    onStop={(e, data) => {
                                        setLegalSquares([]);
                                        movePiece(i, j, data, positions, setPositions, gamePieces, setGamePieces, currentPlayer, setCurrentPlayer, selectedPiece, whitePlayer, blackPlayer);
                                        setSelectedPiece(null);
                                    }}>
                                    <div key={piece ? piece.type + piece.position.x + piece.position.y : `empty${i}${j}`}
                                        className={piece ? (piece.player === whitePlayer ? styles.whitePiece : styles.blackPiece) : styles.piece}
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
                        
                    }}>RESET</button>
                </div>
            </div>
        </div>
    );
}

function movePiece(i: number, j: number, data: DraggableData | null, positions: any[], setPositions: React.Dispatch<SetStateAction<any[]>>, gamePieces: ChessPiece[],
    setGamePieces: React.Dispatch<SetStateAction<ChessPiece[]>>, currentPlayer: ChessPlayer, setCurrentPlayer: React.Dispatch<SetStateAction<ChessPlayer>>,
    selectedPiece: ChessPiece | null, whitePlayer: ChessPlayer, blackPlayer: ChessPlayer): void {

    if (!selectedPiece || selectedPiece.player !== currentPlayer) {
        return;
    }

    const initialX = j * CELL_SIZE;
    const initialY = i * CELL_SIZE;
    let xCalc;
    let yCalc;

    if (data) {
        xCalc = Math.round((data.x + initialX) / CELL_SIZE);
        yCalc = 7 - Math.round((data.y + initialY) / CELL_SIZE);
    } else {
        xCalc = i;
        yCalc = j;
    }

    if (!canMove(selectedPiece, xCalc, yCalc)) {
        return;
    }

    const targetPiece = findPiece(gamePieces, xCalc, yCalc);

    if (targetPiece && targetPiece.player !== currentPlayer) {
        gamePieces = removeGamePiece(gamePieces, targetPiece);
        setGamePieces([...gamePieces]); // update gamePieces state after removal
    }

    selectedPiece.move++;
    selectedPiece.position = { x: xCalc, y: yCalc };
    setPositions([...positions]);

    whitePlayer.clearPseudoSquares();
    blackPlayer.clearPseudoSquares();

    fillPseudoMoves(gamePieces);

    const nextPlayer = switchPlayer(currentPlayer, whitePlayer, blackPlayer);
    setCurrentPlayer(nextPlayer);

    const king = findKing(gamePieces, nextPlayer);
    nextPlayer.check = false;

    if (king) {
        lookForChecks(nextPlayer, nextPlayer === whitePlayer ? blackPlayer : whitePlayer, king);
    }
}

function canMove(piece: ChessPiece, moveX: number, moveY: number) {
    for (const [x, y] of piece.legalSquares) {
        if (x === moveX && y === moveY) {
            return true;
        }
    }
    return false;
}

function switchPlayer(currentPlayer: ChessPlayer, whitePlayer: ChessPlayer, blackPlayer: ChessPlayer): ChessPlayer {
    return currentPlayer === whitePlayer ? blackPlayer : whitePlayer;
}

function removeGamePiece(gamePieces: ChessPiece[], piece: ChessPiece): ChessPiece[] {
    return gamePieces.filter(p => p !== piece);
}