const helper: React.FC = () => {
    return null;
  };
  
export default helper;

export class ChessPiece {
    type: string;
    position: { x: number, y: number };
    currentMove: number;
    colour: number;
    moves: string;

    overlapSquares: number[][] = [];
    legalMoves: number[][] = [];
    visionMoves: number[][] = [];
    potentialAttacks: number[][] = [];

    pieceMap: string[][][] = [];
    attackingDirection: [ChessPiece, [number, number]][] = [];

    potentialAttackers: ChessPiece[] = [];
    attackers: ChessPiece[] = [];
    seenPieces: ChessPiece[] = [];
    updatePieces: ChessPiece[] = [];

    constructor(type: string, position: { x: number, y: number }, colour: number, moves: string) {
        this.type = type;
        this.position = position;
        this.colour = colour;
        this.moves = moves;
        this.currentMove = 1;
        this.potentialAttackers = [];
        this.attackers = [];
    }

    addOverlapSquare(x: number, y: number) {
        this.overlapSquares.push([x, y]);
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

    removeAllAttackingDirections(chessPiece: ChessPiece) {
        this.attackingDirection = this.attackingDirection.filter(([piece, ]) => piece !== chessPiece);
    }

    getAttackingDirection(chessPiece: ChessPiece): [number, number][] {
        const filteredDirections = this.attackingDirection.filter(([piece, ]) => piece === chessPiece);
        const attackingPositions: [number, number][] = filteredDirections.map(([, [x, y]]) => [x, y] as [number, number]);
    
        return attackingPositions;
    }

    getAllAttackingDirections(): [number, number][] {
        const attackingPositions: [number, number][] = this.attackingDirection.map(([, [x, y]]) => [x, y] as [number, number]);
        return attackingPositions;
    }
}