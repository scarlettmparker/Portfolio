import { ChessPiece } from './piece';
import { ChessPlayer } from './player';
import { processMoves, generatePseudoMoves } from './legalmoves';

const helper: React.FC = () => {
    return null;
};
  
export default helper;

const MOVE_DIRECTORY = '/assets/chess/movesets/';
const moveMappings: { [key: string]: string } = {
    'P': MOVE_DIRECTORY + 'pawn.txt',
    'R': MOVE_DIRECTORY + 'rook.txt',
    'N': MOVE_DIRECTORY + 'knight.txt',
    'B': MOVE_DIRECTORY + 'bishop.txt',
    'Q': MOVE_DIRECTORY + 'queen.txt',
    'K': MOVE_DIRECTORY + 'king.txt'
};

export function posToNotation(x: number, y: number) {
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const numbers = ['1', '2', '3', '4', '5', '6', '7', '8'];

    return letters[x] + numbers[y];
}

export function getPieceName(piece: ChessPiece) {
    return piece.type + piece.player.colour;
}

export async function readPieceFile(file: string): Promise<string> {
    const response = await fetch(file);
    const data = await response.text();
    return data;
}

export function getPieceFile(pieceType: string) {
    return moveMappings[pieceType];
}

export function findPiece(gamePieces: ChessPiece[], x: number, y: number): ChessPiece | null {
    return gamePieces.find(piece => piece.position.x === x && piece.position.y === y) || null;
}

export function fillPseudoMoves(gamePieces: ChessPiece[]) {
    gamePieces.forEach(piece => {
        if (piece.baseSquares = []) {
            piece.baseSquares = processMoves(piece.moveFile);
        }
        piece.legalSquares = [];
        piece.raySquares = [];
        generatePseudoMoves(gamePieces, piece);
    });
}

export function findKing(gamePieces: ChessPiece[], player: ChessPlayer) {
    return gamePieces.find(piece => piece.type === 'K' && piece.player === player) || null;
}

export function exists(obj: any[], ...keys: number[]) {
    return keys.reduce((acc, key) => acc && acc[key], obj) !== undefined;
}