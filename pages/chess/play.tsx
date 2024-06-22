import io, { Socket } from 'socket.io-client';
import styles from './styles/play.module.css';
import Image from 'next/image';
import Draggable, { DraggableData } from 'react-draggable';
import { useRouter } from 'next/router';
import { ChessPiece } from './scripts/piece';
import { ChessPlayer } from './scripts/player';
import { SetStateAction, useEffect, useState } from 'react';
import { posToNotation, getPieceName, readPieceFile, getPieceFile,
    findPiece, findKing, findGame, findGameState, findCurrentPlayer, fillPseudoMoves } from './scripts/utils';
import { lookForChecks } from './scripts/legalmoves';
import { DefaultEventsMap } from '@socket.io/component-emitter';

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

let socket: Socket<DefaultEventsMap, DefaultEventsMap>;

async function setupBoard(setGamePieces: React.Dispatch<SetStateAction<ChessPiece[]>>, whitePlayer: ChessPlayer, blackPlayer: ChessPlayer) {
    for (let i = 0; i < BOARD_SIZE; i++) {
        const blackPiece = new ChessPiece(PIECE_TYPES[i], { x: i, y: 7 }, blackPlayer, null, await readPieceFile(getPieceFile(PIECE_TYPES[i])));
        blackPlayer.addPiece(blackPiece);

        const blackPawn = new ChessPiece('P', { x: i, y: 6 }, blackPlayer, null, await readPieceFile(getPieceFile('P')));
        blackPlayer.addPiece(blackPawn);

        const whitePiece = new ChessPiece(PIECE_TYPES[i], { x: i, y: 0 }, whitePlayer, null, await readPieceFile(getPieceFile(PIECE_TYPES[i])));
        whitePlayer.addPiece(whitePiece);

        const whitePawn = new ChessPiece('P', { x: i, y: 1 }, whitePlayer, null, await readPieceFile(getPieceFile('P')));
        whitePlayer.addPiece(whitePawn);
    }

    const newGamePieces = [...blackPlayer.pieces, ...whitePlayer.pieces];

    setGamePieces(newGamePieces);
    fillPseudoMoves(newGamePieces);
}

async function loadBoard(setGamePieces: React.Dispatch<SetStateAction<ChessPiece[]>>, setCurrentPlayer: React.Dispatch<SetStateAction<ChessPlayer>>, whitePlayer: ChessPlayer, blackPlayer: ChessPlayer, game: string) {
    let loadedGameState = await findGameState(game);

    if (loadedGameState) {
        // if game hasn't started yet, set up on client side
        if (loadedGameState.length == 0) {
            setupBoard(setGamePieces, whitePlayer, blackPlayer);
            return;
        }
        for (let i = 0; i < loadedGameState.length; i++) {
            // load each piece and store it on client side
            const piece = loadedGameState[i];
            const player = piece.player === 0 ? whitePlayer : blackPlayer;
            const newPiece = new ChessPiece(piece.type, piece.position, player, piece.move, await readPieceFile(getPieceFile(piece.type)));
            player.addPiece(newPiece);
        }
    }

    let currentPlayer = await findCurrentPlayer(game) === 0 ? whitePlayer : blackPlayer;
    const newGamePieces = [...blackPlayer.pieces, ...whitePlayer.pieces];

    setCurrentPlayer(currentPlayer);
    setGamePieces(newGamePieces);
    removeIllegalSquares(whitePlayer, blackPlayer, newGamePieces, currentPlayer, setCurrentPlayer, true);
}

const sendMove = (originX: number, originY: number, xCalc: number, yCalc: number, socket: Socket<DefaultEventsMap, DefaultEventsMap>,
        game: string, currentPlayer: number) => {
    const message = {
        originX,
        originY,
        x: xCalc,
        y: yCalc
    };

    // send move and switch the player
    socket.emit('sendMove', { game, message });

    let nextPlayer = currentPlayer === 0 ? 1 : 0;
    socket.emit('setCurrentPlayer', { game, nextPlayer });
};

export default function Play() {
    const [gamePieces, setGamePieces] = useState<ChessPiece[]>([]);
    const [positions, setPositions] = useState(Array(64).fill({ x: 0, y: 0 }));
    const [selectedPiece, setSelectedPiece] = useState<ChessPiece | null>(null);
    const [legalSquares, setLegalSquares] = useState<number[][]>([]);
    const [onlineGame, setOnlineGame] = useState(false);

    const [whitePlayer] = useState(new ChessPlayer(0));
    const [blackPlayer] = useState(new ChessPlayer(1));
    const [currentPlayer, setCurrentPlayer] = useState<ChessPlayer>(whitePlayer);
    const [onlinePlayer, setOnlinePlayer] = useState<ChessPlayer | null>(null);

    const router = useRouter();
    const { game } = router.query as { game: string };

    const setPlayerFromLocalStorage = (gameId: string | undefined) => {
        // find player from local storage and set it
        const localPlayer = localStorage.getItem(gameId + 'player');
        if (localPlayer === 'player0') {
            setOnlinePlayer(whitePlayer);
        } else if (localPlayer === 'player1') {
            setOnlinePlayer(blackPlayer);
        }
    };

    useEffect(() => {
        const joinGameAndListen = async () => {
            if (!socket) {
                await setSocket();
            }

            if (game && typeof game === 'string') {
                if (!(await findGame(game))) {
                    router.push('/chess/play');
                    return;
                }
            }

            if (socket) {
                let localPlayer = localStorage.getItem(game + 'player');

                // ensure they are actually on an online url
                if (!onlineGame && game && game[0]) {
                    socket.emit('joinGame', { game });

                    // set player if not already set
                    if (!localPlayer) {
                        socket.emit('setPlayer', { game });
                    }
                    loadBoard(setGamePieces, setCurrentPlayer, whitePlayer, blackPlayer, game);
                    setOnlineGame(true);
                }

                socket.off('receiveMove').on('receiveMove', (message) => {
                    serverMove(
                        message.originX,
                        message.originY,
                        message.x,
                        message.y,
                        positions,
                        setPositions,
                        gamePieces,
                        setGamePieces,
                        currentPlayer,
                        setCurrentPlayer,
                        whitePlayer,
                        blackPlayer,
                        game
                    );
                });

                if (!localPlayer) {
                    // set local storage player so they can rejoin
                    socket.on('startGame', (message) => {
                        localStorage.setItem(game + 'player', message);
                        setPlayerFromLocalStorage(game);
                    });
                } else {
                    setPlayerFromLocalStorage(game);
                }
            }
        };

        joinGameAndListen();
    }, [game, onlineGame, gamePieces, whitePlayer, blackPlayer, currentPlayer]);

    useEffect(() => {
        //setupBoard(setGamePieces, whitePlayer, blackPlayer);
    }, [whitePlayer, blackPlayer, onlineGame]);

    const createBoard = () => (
        Array(8).fill(0).map((_, j) => {
            const effectiveOnlinePlayerColour = onlinePlayer?.colour ?? 0;
            const row = effectiveOnlinePlayerColour === 1 && onlineGame ? 7 - j : j;
            return (
                <div key={`row${row}`}>
                    {Array(8).fill(0).map((_, i) => {
                        const column = effectiveOnlinePlayerColour === 1 && onlineGame ? 7 - i : i;
                        const isBlack = (column + row) % 2 === 0;
                        const squareColor = isBlack ? 'white' : 'black';
                        const piece = gamePieces.find(p => p.position.x === row && p.position.y === 7 - column);
                        
                        // change div class for legal moves
                        const isLegalSquare = legalSquares.some(([x, y]) => x === row && y === 7 - column);
                        const squareClasses = `${styles[squareColor]} ${styles.square} ${isLegalSquare ? styles[`legalSquare${squareColor}`] : ''}`;
                        return (
                            <div key={`square-${row}-${column}`} className={squareClasses} style={{ position: 'relative' }}>
                                <div className={styles.not}>{posToNotation(row, 7 - column)}</div>
                                {piece && (
                                    <Draggable position={positions[column * 8 + row]}
                                        onMouseDown={() => {
                                            // ensure players can only move their own pieces
                                            if (game && onlinePlayer && currentPlayer == onlinePlayer || !game) {
                                                setSelectedPiece(piece);
                                                
                                                    const legalSquares = piece.pseudoSquares;
                                                    setLegalSquares(legalSquares);
                                                
                                            }
                                        }}
                                        onStop={(e, data) => {
                                            if (game && onlinePlayer && currentPlayer == onlinePlayer || !game) {
                                                setLegalSquares([]);

                                                // board is flipped for black player in online games
                                                const adjustedColumn = effectiveOnlinePlayerColour === 1 && game ? 7 - column : column;
                                                const adjustedRow = effectiveOnlinePlayerColour === 1 && game ? 7 - row : row;

                                                movePiece(adjustedColumn, adjustedRow, data, positions, setPositions, gamePieces, setGamePieces, currentPlayer,
                                                    setCurrentPlayer, selectedPiece, whitePlayer, blackPlayer, game, effectiveOnlinePlayerColour);
                                                setSelectedPiece(null);
                                            }
                                        }}>
                                        <div key={piece ? piece.type + piece.position.x + piece.position.y : `empty${column}${row}`}
                                            className={piece ? (piece.player === whitePlayer ? styles.whitePiece : styles.blackPiece) : styles.piece}
                                            style={{ position: 'absolute', top: 0 }}>
                                            <Image src={iconMappings[getPieceName(piece)]} alt="Piece" width={64} height={64} draggable="false"
                                                style={{ transform: onlineGame && piece.player !== whitePlayer ? 'rotate(180deg)' : 'none' }} />
                                        </div>
                                    </Draggable>
                                )}
                            </div>
                        );
                    })}
                </div>
            );
        })
    );

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.experienceWrapper}>
                <div className={styles.gameWrapper}>
                    {createBoard()}
                </div>
            </div>
        </div>
    );
}

function canMove(piece: ChessPiece, moveX: number, moveY: number) {
    for (const [x, y] of piece.legalSquares) {
        if (x === moveX && y === moveY) {
            return true;
        }
    }
    return false;
}

async function setSocket() {
    await fetch('/api/chess/socket');
    socket = io();

    await new Promise(resolve => {
        socket.on('connect', () => {
            resolve(true); // resolve the promise when connected
        });
    });
}

function serverMove(originX: number, originY: number, xCalc: number, yCalc: number, positions: any[], setPositions: React.Dispatch<SetStateAction<any[]>>,
    gamePieces: ChessPiece[], setGamePieces: React.Dispatch<SetStateAction<ChessPiece[]>>, currentPlayer: ChessPlayer,
    setCurrentPlayer: React.Dispatch<SetStateAction<ChessPlayer>>, whitePlayer: ChessPlayer, blackPlayer: ChessPlayer, game: string | undefined) {

    const pieceToMove = findPiece(gamePieces, originX, originY);
    updateGameState(gamePieces, setGamePieces, currentPlayer, setCurrentPlayer, whitePlayer, blackPlayer, positions, setPositions, xCalc, yCalc, pieceToMove, game);
}

function movePiece(i: number, j: number, data: DraggableData | null, positions: any[], setPositions: React.Dispatch<SetStateAction<any[]>>, gamePieces: ChessPiece[],
    setGamePieces: React.Dispatch<SetStateAction<ChessPiece[]>>, currentPlayer: ChessPlayer, setCurrentPlayer: React.Dispatch<SetStateAction<ChessPlayer>>,
    pieceToMove: ChessPiece | null, whitePlayer: ChessPlayer, blackPlayer: ChessPlayer, game: string | undefined, onlinePlayerColour: number): void {

    if (!pieceToMove || pieceToMove.player !== currentPlayer) {
        return;
    }

    const initialX = j * CELL_SIZE;
    const initialY = i * CELL_SIZE;
    let xCalc;
    let yCalc;

    // if data is null, the move was made automatically (for bot stuff if i ever do that)
    if (data) {
        if (game && onlinePlayerColour == 0) {
            xCalc = Math.round((data.x + initialX) / CELL_SIZE);
            yCalc = 7 - Math.round((data.y + initialY) / CELL_SIZE);
        } else if (game && onlinePlayerColour == 1){
            xCalc = 7 - Math.round((data.x + initialX) / CELL_SIZE);
            yCalc = Math.round((data.y + initialY) / CELL_SIZE);
        } else {
            xCalc = Math.round((data.x + initialX) / CELL_SIZE);
            yCalc = 7 - Math.round((data.y + initialY) / CELL_SIZE);
        }
    } else {
        xCalc = i;
        yCalc = j;
    }

    // if the move is invalid, return
    if (!canMove(pieceToMove, xCalc, yCalc)) {
        return;
    }

    if (game) {
        sendMove(pieceToMove.position.x, pieceToMove.position.y, xCalc, yCalc, socket, game, currentPlayer.colour);
    }

    // move player data client side
    updateGameState(gamePieces, setGamePieces, currentPlayer, setCurrentPlayer,
        whitePlayer, blackPlayer, positions, setPositions, xCalc, yCalc, pieceToMove, game);
}

function updateGameState(gamePieces: ChessPiece[], setGamePieces: React.Dispatch<SetStateAction<ChessPiece[]>>, currentPlayer: ChessPlayer,
    setCurrentPlayer: React.Dispatch<SetStateAction<ChessPlayer>>, whitePlayer: ChessPlayer, blackPlayer: ChessPlayer, positions: any[],
    setPositions: React.Dispatch<SetStateAction<any[]>>, xCalc: number, yCalc: number, pieceToMove: ChessPiece | null, game: string | undefined) {

    // find piece to move
    const targetPiece = findPiece(gamePieces, xCalc, yCalc);
    if (targetPiece && targetPiece.player !== currentPlayer) {
        gamePieces = removeGamePiece(gamePieces, targetPiece);
        setGamePieces([...gamePieces]); // update gamePieces state after removal
    }

    // update piece position and move index
    if (pieceToMove) {
        pieceToMove.move++;
        pieceToMove.position = { x: xCalc, y: yCalc };
    }

    // update board positions and re-calculate legal squares
    setPositions([...positions]);
    removeIllegalSquares(whitePlayer, blackPlayer, gamePieces, currentPlayer, setCurrentPlayer);

    
    // not all piece data needs to be transfered
    if (game) {
        const simplifiedGamePieces = gamePieces.map(piece => ({
            type: piece.type,
            position: piece.position,
            player: piece.player.colour,
            move: piece.move
        }));
        socket.emit('setState', { game, message: JSON.parse(JSON.stringify(simplifiedGamePieces))});
    }
}

function removeIllegalSquares(whitePlayer: ChessPlayer, blackPlayer: ChessPlayer, gamePieces: ChessPiece[],
    currentPlayer: ChessPlayer, setCurrentPlayer: React.Dispatch<SetStateAction<ChessPlayer>>, initialLoad: boolean = false) {

    // clear pseudo legal moves
    whitePlayer.clearPseudoSquares();
    blackPlayer.clearPseudoSquares();
    fillPseudoMoves(gamePieces);

    // switch player and look for checks
    let nextPlayer = currentPlayer;
    if (!initialLoad) {
        nextPlayer = switchPlayer(currentPlayer, whitePlayer, blackPlayer);
        setCurrentPlayer(nextPlayer);
    }
    const king = findKing(gamePieces, nextPlayer);
    nextPlayer.check = false;

    if (king) {
        lookForChecks(nextPlayer, nextPlayer === whitePlayer ? blackPlayer : whitePlayer, king);
    }
}

function switchPlayer(currentPlayer: ChessPlayer, whitePlayer: ChessPlayer, blackPlayer: ChessPlayer): ChessPlayer {
    return currentPlayer === whitePlayer ? blackPlayer : whitePlayer;
}

function removeGamePiece(gamePieces: ChessPiece[], piece: ChessPiece): ChessPiece[] {
    return gamePieces.filter(p => p !== piece);
}