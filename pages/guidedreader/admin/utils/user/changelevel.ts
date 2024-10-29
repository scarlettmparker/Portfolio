import levels from '../../../data/roles.json';

const helper: React.FC = () => {
    return null;
};

export default helper;


// change the level of a user
export async function handleLevelChange(user: any, userlevels: string[], level: number, override: boolean): Promise<{ success: boolean; error?: string }> {
    // filter levels based on level roles.json
    const filteredLevel = userlevels.find((userLevelId: string) =>
        levels.some(role => role.id === userLevelId)
    );

    // change the user's level
    return fetch('/api/guidedreader/admin/user/changelevel', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ discordId: user.discordId, currentLevel: filteredLevel, level, override })
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                return Promise.reject(data.error);
            } else {
                return Promise.resolve(data);
            }
        })
        .catch(error => {
            return Promise.reject('An error occurred: ' + error);
        });
};