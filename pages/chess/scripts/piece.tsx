export class ChessPiece {
    type: string;
    position: { x: number, y: number };
    currentMove: number;
    colour: number;
    moves: string;

    constructor(type: string, position: { x: number, y: number }, colour: number, moves: string) {
        this.type = type;
        this.position = position;
        this.colour = colour;
        this.moves = moves;
        this.currentMove = 1;
    }
}