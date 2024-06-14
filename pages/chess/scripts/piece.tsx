import { ChessPlayer } from "./player";

const helper: React.FC = () => {
    return null;
};
  
export default helper;

export class ChessPiece {
    player: ChessPlayer;

    move: number = 1;
    position: { x: number, y: number };

    moveFile: string;
    type: string;

    baseSquares: string[][][] = [];

    pseudoSquares: number[][] = [];
    legalSquares: number[][] = [];

    constructor(type: string, position: { x: number, y: number }, player: ChessPlayer, moveFile: string) {
        this.type = type;
        this.position = position;
        this.player = player;
        this.moveFile = moveFile;
    }
}