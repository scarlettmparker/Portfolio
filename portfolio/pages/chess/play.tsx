import styles from './styles/play.module.css'
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { SetStateAction, useEffect, useState } from 'react';
import { ChessPlayer } from './scripts/player';
import { ChessPiece } from './scripts/piece';

export default function Play() {
    const [gamePieces, setGamePieces] = useState<ChessPiece[]>([]);
    const [whitePlayer, setWhitePlayer] = useState(new ChessPlayer());
    const [blackPlayer, setBlackPlayer] = useState(new ChessPlayer());
    
    const CELL_SIZE = 75;
    const PIECE_TYPES = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
    const BOARD_SIZE = 8;

    var currentPlayer = whitePlayer;
    var selectedPiece: ChessPiece;

    function createBoard() {
        const [positions, setPositions] = useState(Array(64).fill({ x: 0, y: 0 }));
        return Array(8).fill(0).map((_, j) => (
            <div key={`row${j}`}>
                {Array(8).fill(0).map((_, i) => {
                    const isBlack = (i + j) % 2 === 0;
                    const squareColor = isBlack ? 'white' : 'black';
                    const piece = gamePieces.find(p => p.position.x === j && p.position.y === 7 - i);

                    return (
                        <div className={`${styles[squareColor]} ${styles.square}`} style={{ position: 'relative' }}>
                            <div className={styles.not}>{posToNotation(j, 7 - i)}</div>
                            {piece && (
                                <Draggable position={positions[i * 8 + j]}
                                    onMouseDown={() => getPieceCoordinates(i, j, positions)}
                                    onStop={(e, data) => {
                                        movePiece(i, j, e, data, positions, setPositions);
                                    }}>
                                    <div key={piece ? piece.type + piece.position.x + piece.position.y : `empty${i}${j}`}
                                        className={piece ? (piece.colour === 0 ? styles.whitePiece : styles.blackPiece) : styles.piece}
                                        style={{ position: 'absolute', top: 0 }}>
                                        {piece ? piece.type : ''}
                                    </div>
                                </Draggable>
                            )}
                        </div>
                    );
                })}
            </div>
        ));
    }

    function setupBoard(whitePlayer: { pieces: ChessPiece[]; }, blackPlayer: { pieces: ChessPiece[]; }) {
        whitePlayer.pieces = [];
        blackPlayer.pieces = [];

        for (let i = 0; i < BOARD_SIZE; i++) {
            blackPlayer.pieces.push(new ChessPiece(PIECE_TYPES[i], { x: i, y: 7 }, 1));
            blackPlayer.pieces.push(new ChessPiece('P', { x: i, y: 6 }, 1));
            whitePlayer.pieces.push(new ChessPiece(PIECE_TYPES[i], { x: i, y: 0 }, 0));
            whitePlayer.pieces.push(new ChessPiece('P', { x: i, y: 1 }, 0));
        }
    
        const newGamePieces = [...blackPlayer.pieces, ...whitePlayer.pieces];
        setGamePieces(newGamePieces);
    }

    function movePiece(i: number, j: number, e: DraggableEvent, data: DraggableData, positions: any[], setPositions: { (value: SetStateAction<any[]>): void; (arg0: any[]): void; }) {
        const initialX = j * CELL_SIZE;
        const initialY = i * CELL_SIZE;
    
        const xCalc = Math.round((data.x + initialX) / CELL_SIZE);
        const yCalc = 7 - Math.round((data.y + initialY) / CELL_SIZE);

        if (selectedPiece.canMove(selectedPiece.position.x, selectedPiece.position.y, xCalc, yCalc) && isPiece(xCalc, yCalc, selectedPiece.colour)) {
            const removeIndex = gamePieces.findIndex(piece => piece.position.x === xCalc && piece.position.y === yCalc)
            if (removeIndex !== -1) {
                console.log(gamePieces[removeIndex]);
                gamePieces.splice(removeIndex, 1);
                setGamePieces([...gamePieces]);
            }
            selectedPiece.position = { x: xCalc, y: yCalc };
            setPositions([...positions]);
        } else {
            console.log("Can't move to this position!")
        }
    }

    function getPieceCoordinates(i: number, j: number, positions: any[]) {
        const cellSize = 75;
        const initialX = j * cellSize;
        const initialY = i * cellSize;

        const x = (positions[i * 8 + j].x + initialX) / 75;
        const y = 7 - (positions[i * 8 + j].y + initialY) / 75;

        selectedPiece = findPiece(x, y) as ChessPiece;
        console.log(selectedPiece);
    }

    function findPiece(x: number, y: number) {
        return gamePieces.find(piece => piece.position.x === x && piece.position.y === y);
    }

    function isPiece(x: number, y: number, colour: number) {
        const piece = gamePieces.find(piece => piece.position.x === x && piece.position.y === y);
        if(piece) {
            if(piece.colour === colour) {
                return false;
            }
        }
        return true;
    }

    function posToNotation(x: number, y: number) {
        const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const numbers = ['1', '2', '3', '4', '5', '6', '7', '8'];

        return letters[x] + numbers[y];
    }

    function resetBoard() {
        setupBoard(whitePlayer, blackPlayer);
    }

    useEffect(() => {
        setupBoard(whitePlayer, blackPlayer);
    }, [whitePlayer, blackPlayer]);

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.experienceWrapper}>
                <div className={styles.gameWrapper}>
                    {createBoard()}
                </div>
                <div className={styles.buttonWrapper}>
                    <button className={styles.button} onClick={resetBoard}>RESET</button>
                </div>
            </div>
        </div>
    );
}