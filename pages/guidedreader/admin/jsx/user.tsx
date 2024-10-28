import { useEffect, useState } from 'react';
import styles from '../styles/user.module.css';

const PAGE_LENGTH: number = 10;

const ChangeListButton = ({ direction, pageIndex, setPageIndex, numUsers }: { direction: string, pageIndex: number, setPageIndex: (value: number) => void, numUsers: number }) => {
    const handleClick = () => {
        // change page index based on direction
        if (direction === 'left') {
            setPageIndex(Math.max(0, pageIndex - PAGE_LENGTH));
        } else if (direction === 'right') {
            setPageIndex(Math.min(numUsers - PAGE_LENGTH, pageIndex + PAGE_LENGTH));
        }
    };

    // ensure the button is disabled if the user is at the beginning or end of the list
    const isDisabled = (direction === 'left' && pageIndex === 0) || (direction === 'right' && pageIndex >= numUsers - PAGE_LENGTH) || numUsers === 0;

    return (
        <button className={styles.changeListButton} onClick={handleClick} disabled={isDisabled}>
            {direction === 'left' ? '<' : '>'}
        </button>
    );
};

const fetchUsers = async (setNumUsers: (value: number) => void) => {
    try {
        // fetch number of users available
        const response = await fetch('/api/guidedreader/admin/user/getuserlength', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        const data = await response.json();
        setNumUsers(data.userCount);
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
};

// user component
const User = () => {
    const [pageIndex, setPageIndex] = useState(0);
    const [users, setUsers] = useState([]);
    const [numUsers, setNumUsers] = useState(0);

    useEffect(() => {
        // fetch users if the list is empty
        if (users.length === 0) {
            fetchUsers(setNumUsers);
        }
    }, [users]);

    return (
        <div className={styles.userWrapper}>
            <div className={styles.userHeader}>
                <input type="text" id="search" className={styles.userSearch} placeholder="Search for a user" />
                <button className={styles.userSearchButton}>Search</button>
            </div>
            <div className={styles.userResults}>
                <div className={styles.pageIndexWrapper}>
                    <ChangeListButton direction="left" pageIndex={pageIndex} setPageIndex={setPageIndex} numUsers={numUsers} />
                    <ChangeListButton direction="right" pageIndex={pageIndex} setPageIndex={setPageIndex} numUsers={numUsers} />
                    {pageIndex + "/" + numUsers}
                </div>
            </div>
        </div>
    )
}

export default User;