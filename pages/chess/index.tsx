import { NextRouter, useRouter } from 'next/router';
import { findGame } from './scripts/utils';

async function createInstance(multiplayer: boolean, router: NextRouter | string[]) {
    if (!multiplayer) {
        router.push('/chess/play');
    } else {
        let randomString = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        let attempts = 0;
        let gameExists = true;

        while (gameExists && attempts < 5) {
            for (let i = 0; i < 6; i++) {
                randomString += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            if (await findGame(randomString) == false) {
                gameExists = false;
                break;
            }
            randomString = '';
            attempts++;
        }

        if (gameExists) {
            console.log('Failed to create a unique game instance. Please try again.');
            return;
        }

        const response = await fetch('../api/chess/addgame', {
            method: 'POST',
            body: JSON.stringify({ id: randomString })
        });

        if (!response.ok) {
            throw new Error(response.statusText);
        }

        router.push(`/chess/play?game=${randomString}`);
        return await response.json();
    }
}

export default function Chess(){
    const router = useRouter();
    return(
        <>
            <button onClick={() => createInstance(false, router)}>Singleplayer Instance</button>
            <button onClick={() => createInstance(true, router)}>Multiplayer Instance</button>
        </>
    );
}