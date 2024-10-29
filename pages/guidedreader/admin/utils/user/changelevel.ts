import levels from '../../../data/roles.json';

// change the level of a user
async function handleLevelChange(user: any, userlevels: string[], level: number, override: boolean) {
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

export default handleLevelChange;