import styles from './styles/play.module.css'
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { SetStateAction, useState } from 'react';

function createBoard() {
    const [positions, setPositions] = useState(Array(64).fill({x: 0, y: 0}));

    const pieces = [
        "R", "N", "B", "Q", "K", "B", "N", "R", "P", "P", "P", "P", "P", "P", "P", "P",
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
        "p", "p", "p", "p", "p", "p", "p", "p", "r", "n", "b", "q", "k", "b", "n", "r"
    ];

    return Array(8).fill(0).map((_, j) => (
        <div key={`row${j}`}>
            {Array(8).fill(0).map((_, i) => {
                const isBlack = (i + j) % 2 === 0;
                const squareColor = isBlack ? 'white' : 'black';
                const piece = pieces[i * 8 + j];

                return (
                    <div className={`${styles[squareColor]} ${styles.square}`} key={`col${i}`}>
                        <Draggable position={positions[i * 8 + j]} onStop={(e, data) =>
                            calculatePosition(i, j, e, data, positions, setPositions)}>
                            <div className={styles.piece}>{piece}</div>
                        </Draggable>
                    </div>
                );
            })}
        </div>
    ));
}

function calculatePosition(i: number, j: number, e: DraggableEvent, data: DraggableData, positions: any[], setPositions: { (value: SetStateAction<any[]>): void; (arg0: any[]): void; }) {
    const cellSize = 75;
    const initialX = j * cellSize;
    const initialY = (8 - i) * cellSize;

    const xCalc = Math.round((data.x - (cellSize / 2) + initialX) / cellSize) * cellSize;
    const yCalc = Math.round((initialY + (cellSize / 2) - data.y - 1) / cellSize) * cellSize;

    positions[i * 8 + j] = {
        x: xCalc - initialX,
        y: initialY - yCalc
    };
    setPositions([...positions]);

    console.log(posToNotation(xCalc/75, yCalc/75));
}

function posToNotation(x, y) {
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const numbers = ['8', '7', '6', '5', '4', '3', '2', '1'];

    return letters[x] + numbers[y];
}

function resetBoard() {
    // TODO: Implement reset board functionality
}

export default function Play() {
    return (
        <div className={styles.pageWrapper}>
            <div className={styles.experienceWrapper}>
                <div className={styles.gameWrapper}>
                    {createBoard()}
                </div>
                <div className={styles.buttonWrapper}>
                    <button className={styles.button}>RESET</button>
                </div>
            </div>
        </div>
    );
}