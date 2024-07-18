// FIND ONLINE PLAYERS REQUEST
const baseUrl = 'http://localhost:3000';

export async function findOnlinePlayer(gameId: string, player: string) {
    const response = await fetch(`${baseUrl}/api/chess/findplayer`, {
        method: 'POST',
        body: JSON.stringify({ id: gameId, player: player })
    });
    const jsonResponse = await response.json();
    return jsonResponse.player;
}

export async function setPlayer(gameId: string, player: string, modifier: boolean) {
    const response = await fetch(`${baseUrl}/api/chess/setplayer`, {
        method: 'POST',
        body: JSON.stringify({ id: gameId, player: player, modifier: modifier })
    });
    return response.ok;
}

export async function setCurrentPlayer(gameId: string, nextPlayer: number) {
    const response = await fetch(`${baseUrl}/api/chess/setcurrentplayer`, {
        method: 'POST',
        body: JSON.stringify({ id: gameId, player: nextPlayer})
    });
    return response.ok;
}

export async function setState(gameId: string, state: JSON) {
    const response = await fetch(`${baseUrl}/api/chess/setstate`, {
        method: 'POST',
        body: JSON.stringify({ id: gameId, state: state })
    });
    return response.ok;
}