export class ChessPiece {
    type: string;
    position: { x: number, y: number };
    currentMove: number;
    colour: number;
    moves: string;

    pieceMap: string[][][] = [];

    legalMoves: number[][] = [];
    visionMoves: number[][] = [];
    potentialAttacks: number[][] = [];

    attackingDirection: [ChessPiece, [number, number]][] = [];

    potentialAttackers: ChessPiece[] = [];
    potentialAttackingPieces: ChessPiece[] = [];
    attackers: ChessPiece[] = [];
    seenPieces: ChessPiece[] = [];

    constructor(type: string, position: { x: number, y: number }, colour: number, moves: string) {
        this.type = type;
        this.position = position;
        this.colour = colour;
        this.moves = moves;
        this.currentMove = 1;
        this.potentialAttackers = [];
        this.attackers = [];
    }

    addAttacker(attacker: ChessPiece) {
        this.attackers.push(attacker);
    }

    addPotentialAttacker(attacker: ChessPiece) {
        this.potentialAttackers.push(attacker);
    }

    removeAttacker(attacker: ChessPiece) {
        const indexToRemove = this.attackers.findIndex((piece) => piece === attacker);
        if (indexToRemove !== -1) {
            this.attackers.splice(indexToRemove, 1);
        }
    }

    removePotentialAttacker(attacker: ChessPiece) {
        const indexToRemove = this.potentialAttackers.findIndex((piece) => piece === attacker);
        if (indexToRemove !== -1) {
            this.potentialAttackers.splice(indexToRemove, 1);
        }
    }

    addAttackingDirection(chessPiece: ChessPiece, x: number, y: number) {
        this.attackingDirection.push([chessPiece, [x, y]]);
    }

    removeAttackingDirection(chessPiece: ChessPiece, x: number, y: number) {
        const indexToRemove = this.attackingDirection.findIndex(([piece, [posX, posY]]) => piece === chessPiece && posX === x && posY === y);
        if (indexToRemove !== -1) {
            this.attackingDirection.splice(indexToRemove, 1);
        }
    }

    getAttackingDirection(chessPiece: ChessPiece): [number, number][] {
        const filteredDirections = this.attackingDirection.filter(([piece, ]) => piece === chessPiece);
        const attackingPositions: [number, number][] = filteredDirections.map(([, [x, y]]) => [x, y] as [number, number]);
    
        return attackingPositions;
    }
}