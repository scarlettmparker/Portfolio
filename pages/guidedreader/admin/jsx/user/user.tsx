import { useEffect, useState } from 'react';
import styles from '../../styles/user.module.css';
import returnAvatar from '../../../utils/avatarutils';
import Image from 'next/image';
import Sidebar from '../sidebar';
import { fetchNumUsers, fetchUserData, PAGE_LENGTH } from '../../utils/userutils';
import ChangeListButton from './listbutton';

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

const UserData = ({ users, userPermissions }: { users: any[], userPermissions: string[] }) => {
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const parentKey = 'user';

    return (
        <>
            {selectedUser === null ? (
                <UserList users={users} setSelectedUser={setSelectedUser} />
            ) : (
                <div className={styles.selectedUser}>
                    {/* modifying specific user stuff*/}
                    <span className={styles.selectedUsername}>{selectedUser.username}</span>
                    <button onClick={() => setSelectedUser(null)}>Back to list</button>
                    <Sidebar userPermissions={userPermissions} parentKey={parentKey}/>
                </div >
            )}
        </>
    )
}

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