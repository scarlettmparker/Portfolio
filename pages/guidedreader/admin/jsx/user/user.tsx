import { useEffect, useState } from 'react';
import styles from '../../styles/user.module.css';
import returnAvatar from '../../../utils/avatarutils';
import Image from 'next/image';
import Sidebar from '../sidebar';
import levels from '../../../data/roles.json';
import ChangeListButton from './listbutton';
import { fetchNumUsers, fetchUserData } from '../../utils/user/userutils';
import handleBanUser, { getIsBanned, getIsRestricted, handleRestrictUser, isBanned, isRestricted } from '../../utils/user/banuser';
import handleLevelChange from '../../utils/user/changelevel';

const SIZE = 50;

// user component
const User = ({ userPermissions }: { userPermissions: string[] }) => {
    const [pageIndex, setPageIndex] = useState(0);
    const [users, setUsers] = useState<any[]>([]);
    const [numUsers, setNumUsers] = useState(0);

    useEffect(() => {
        // fetch users if the list is empty
        if (users.length === 0) {
            fetchNumUsers(setNumUsers);
            fetchUserData(pageIndex, setUsers);
        }
    }, [pageIndex]);

    return (
        <div className={styles.userWrapper}>
            <div className={styles.userHeader}>
                <input type="text" id="search" className={styles.userSearch} placeholder="Search for a user" />
                <button className={styles.userSearchButton}>Search</button>
            </div>
            <div className={styles.userResults}>
                <div className={styles.pageIndexWrapper}>
                    <UserData users={users} userPermissions={userPermissions} />
                    <ChangeListButton direction="left" pageIndex={pageIndex} setPageIndex={setPageIndex} numUsers={numUsers} />
                    <ChangeListButton direction="right" pageIndex={pageIndex} setPageIndex={setPageIndex} numUsers={numUsers} />
                    {pageIndex + "/" + numUsers}
                </div>
            </div>
        </div>
    )
}

// display the user data and actions
const UserData = ({ users, userPermissions }: { users: any[], userPermissions: string[] }) => {
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [currentPermission, setCurrentPermission] = useState<string>('');

    // banned/restricted status
    const [banned, setBanned] = useState<isBanned>({ banned: false });
    const [restricted, setRestricted] = useState<isRestricted>({ restricted: false });
    const [changeLevel, setChangeLevel] = useState<boolean>(false);

    // parent key for permissions
    const parentKey = 'user';

    useEffect(() => {
        switch (currentPermission) {
            case 'user.banUser':
                handleBanUser({
                    discordId: selectedUser.discordId,
                    banned: banned.banned,
                    // reason
                }).then((data) => {
                    setBanned({ banned: data.banned, reason: data.reason });
                }).catch(error => {
                    console.error(error);
                });
                break;
            case 'user.restrictUser':
                handleRestrictUser({
                    discordId: selectedUser.discordId,
                    restricted: restricted.restricted,
                    // reason
                }).then((data) => {
                    setRestricted({ restricted: !data.restricted, reason: data.reason });
                }).catch(error => {
                    console.error(error);
                });
                break;
            case 'user.changeLevel':
                setChangeLevel(!changeLevel);
                break;
            case 'user.viewUserAnnotation.editUserAnnotation':
                break;
            case 'user.viewUserAnnotation.deleteUserAnnotation':
                break;
            case 'user.viewUserTexts':
                break;
            default: return;
        }
        setCurrentPermission('');
    }, [currentPermission]);

    useEffect(() => {
        // fetch banned status if a user is selected
        if (selectedUser !== null) {
            getIsBanned({ discordId: selectedUser.discordId }, setBanned);
            getIsRestricted({ discordId: selectedUser.discordId }, setRestricted);
        }
    }, [selectedUser])

    return (
        <>
            {selectedUser === null ? (
                <UserList users={users} setSelectedUser={setSelectedUser} />
            ) : (
                <div className={styles.selectedUser}>
                    {/* modifying specific user stuff*/}
                    {banned.banned && (
                        <div>
                            User is BANNED
                            REASON: {banned.reason}
                        </div>
                    )}
                    {restricted.restricted && (
                        <div>
                            User is RESTRICTED
                            REASON: {restricted.reason}
                        </div>
                    )}
                    {changeLevel && (
                        <ChangeLevel selectedUser={selectedUser} />
                    )}
                    <span className={styles.selectedUsername}>{selectedUser.username}</span>
                    <button onClick={() => setSelectedUser(null)}>Back to list</button>
                    <Sidebar userPermissions={userPermissions} parentKey={parentKey} setCurrentPermission={setCurrentPermission} />
                </div >
            )}
        </>
    );
}

// change level component
const ChangeLevel = ({ selectedUser }: { selectedUser: any }) => {
    // ensure that the bypass levels are sanitized properly
    const sanitizedLevels = selectedUser.levels.map((level: string) => level.replace('L-BYPASS-', ''));
    const currentLevelIndex = levels.findIndex(level => level.id === sanitizedLevels[0]);

    const [levelIndex, setLevelIndex] = useState(currentLevelIndex);
    const [override, setOverride] = useState(true);

    // handle changing the user's role
    const handleNextLevel = () => {
        setLevelIndex((prevIndex) => (prevIndex + 1) % levels.length);
    };

    const handlePrevLevel = () => {
        setLevelIndex((prevIndex) => (prevIndex - 1 + levels.length) % levels.length);
    };

    // this will force a role on someone and for it to stay
    const handleOverrideChange = () => {
        setOverride(!override);
    };

    return (
        <div>
            <button onClick={handlePrevLevel}>Previous Level</button>
            <span>{levels[levelIndex].shortname + " - " + levels[levelIndex].name}</span>
            <button onClick={handleNextLevel}>Next Level</button>
            <label>
                <input type="checkbox" checked={override} onChange={handleOverrideChange} />
                Override
            </label>
            <button onClick={() => handleLevelChange(selectedUser, sanitizedLevels, (levels[levelIndex].id as unknown as number), override)}>Change Level</button>
        </div>
    );
};

// user list component
const UserList = ({ users, setSelectedUser }: { users: any[], setSelectedUser: (value: any) => void }) => {
    return (
        <div className={styles.userList}>
            {users.map(user => (
                <div key={user.discordId} className={styles.userItem}>
                    <Image src={returnAvatar(user.avatar, user.discordId)} alt={`${user.username}'s avatar`}
                        className={styles.userAvatar} width={SIZE} height={SIZE} draggable={false} />
                    <div className={styles.userInfo}>
                        <span className={styles.username} onClick={() => setSelectedUser(user)}>{user.username}</span>
                        <span className={styles.nickname}>Nickname: {user.nickname}</span>
                        <span className={styles.date}>Account Created: {new Date(user.accountCreationDate * 1000).toLocaleDateString()}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default User;