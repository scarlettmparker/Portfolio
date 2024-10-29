type BanUserData = {
    discordId: string;
    banned: boolean;
    reason?: string;
};

type RestrictedUserData = {
    discordId: string;
    restricted: boolean;
    reason?: string;
};

export type isBanned = {
    banned: boolean;
    reason?: string;
};

export type isRestricted = {
    restricted: boolean;
    reason?: string;
};

// either ban or unban user
async function handleBanUser(data: BanUserData): Promise<{ banned: boolean; reason?: string }> {
    return fetch('/api/guidedreader/admin/user/banuser', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                return Promise.reject(data.error);
            } else {
                return Promise.resolve({ banned: !data.banned, reason: data.banReason });
            }
        })
        .catch(error => {
            return Promise.reject('An error occurred: ' + error);
        });
}

// restrict or unrestrict user through api
export async function handleRestrictUser(data: RestrictedUserData): Promise<{ restricted: boolean; reason?: string }> {
    return fetch('/api/guidedreader/admin/user/restrictuser', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                console.error(data.error);
                return Promise.reject(data.error);
            } else {
                return { restricted: data.restricted, reason: data.restrictReason };
            }
        })
        .catch(error => {
            return Promise.reject('An error occurred: ' + error);
        });
}

// fetch the user's banned status
export const getIsBanned = ({ discordId }: { discordId: string }, setBanned: (value: isBanned) => void) => {
    fetch(`/api/guidedreader/admin/user/getuserbanned?discordId=${discordId}`)
        .then(res => res.json())
        .then(data => {
            setBanned({ banned: data.banned, reason: data.reason });
        });
}

// fetch the user's restricted status
export const getIsRestricted = ({ discordId }: { discordId: string }, setRestricted: (value: isRestricted) => void) => {
    fetch(`/api/guidedreader/admin/user/getuserrestricted?discordId=${discordId}`)
        .then(res => res.json())
        .then(data => {
            setRestricted({ restricted: data.restricted, reason: data.reason });
        });
}

export default handleBanUser;