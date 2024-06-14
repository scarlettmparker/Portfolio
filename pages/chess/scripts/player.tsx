import { ChessPiece } from './piece';

const helper: React.FC = () => {
    return null;
};
  
export default helper;

export class ChessPlayer {
    turn: boolean = false;
    checked: boolean = false;

    colour: number;
    legalMoves: number;

    pieces: ChessPiece[] = [];
    pseudoSquares: number[][] = [];
    debugSquares: number[][] = [];

    constructor(colour: number) {
        this.colour = colour;
        this.legalMoves = 0;
    }

    addPiece(piece: ChessPiece) {
        this.pieces.push(piece);
        this.clearPseudoSquares();
    }

    addPseudoSquare(x: number, y: number) {
        this.pseudoSquares[x][y] = 1;
    }

    clearPseudoSquares() {
        this.pseudoSquares = Array.from({ length: 8 }, () => Array(8).fill(0));
        this.debugSquares = Array.from({ length: 8 }, () => Array(8).fill(0));
    }
}