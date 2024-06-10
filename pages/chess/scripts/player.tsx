import { ChessPiece } from './piece';

export class ChessPlayer {
    turn: boolean = false;
    checked: boolean = false;
    colour: number = 0;
    legalMoves: number = 1;

    pieces: ChessPiece[] = [];
    legalSquares: number[][] = [];

    addLegalSquares(x: number, y: number) {
        this.legalSquares.push([x, y]);
    }
}