import { ChessPiece } from './piece';

export class ChessPlayer {
    turn: boolean = false;
    checked: boolean = false;
    colour: number = 0;

    pieces: ChessPiece[] = [];
}