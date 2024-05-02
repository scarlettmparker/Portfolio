import { ChessPlayer } from "./player";

export class ChessPiece {
    type: string;
    position: { x: number, y: number };
    colour: number;

    constructor(type: string, position: { x: number, y: number }, colour: number) {
        this.type = type;
        this.position = position;
        this.colour = colour;
    }

    canMove(player: number, currentX: number, currentY: number, moveX: number, moveY: number) {
        if (player !== this.colour) {
            console.log("Not your turn!");
            return false;
        }

        if (this.type == 'P') {
            console.log("Pawn");
        }
        if (this.type == 'R') {
            console.log("Rook");
        }
        if (this.type == 'N') {
            console.log("Knight");
        }
        if (this.type == 'B') {
            console.log("Bishop");
        }
        if (this.type == 'Q') {
            console.log("Queen");
        }
        if (this.type == 'K') {
            console.log("King");
        }        
        return true;
    }
}