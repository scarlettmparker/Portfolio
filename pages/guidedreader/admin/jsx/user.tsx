import { useEffect, useState } from 'react';
import styles from '../styles/user.module.css';

const PAGE_LENGTH: number = 10;

const ChangeListButton = ({ direction, pageIndex, setPageIndex }: { direction: string, pageIndex: number, setPageIndex: (value: number) => void }) => {
    const handleClick = () => {
        // change the page index
        if (direction === 'left') {
            setPageIndex(Math.max(0, pageIndex - PAGE_LENGTH));
        } else if (direction === 'right') {
            setPageIndex(pageIndex + PAGE_LENGTH);
        }
    };

    return (
        <button className={styles.changeListButton} onClick={handleClick}>
            {direction === 'left' ? '<' : '>'}
        </button>
    );
};

// user component
const User = () => {
    const [pageIndex, setPageIndex] = useState(0);
    const [users, setUsers] = useState([]);
    const [numUsers, setNumUsers] = useState(0);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // get number of users available to search through
                const response = await fetch('/api/guidedreader/admin/user/getuserlength', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                const data = await response.json();
                setNumUsers(data);
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        if (users.length === 0) {
            fetchUsers();
        }
    }, [users]);

    return (
        <div className={styles.userWrapper}>
            <div className={styles.userHeader}>
                <input type="text" id="search" className={styles.userSearch} placeholder="Search for a user" />
                <button className={styles.userSearchButton}>Search</button>
            </div>
            {/* user results as list */}
            <div className={styles.userResults}>
                <div className={styles.pageIndexWrapper}>
                    <ChangeListButton direction="left" pageIndex={pageIndex} setPageIndex={setPageIndex} />
                    <ChangeListButton direction="right" pageIndex={pageIndex} setPageIndex={setPageIndex} />
                    {pageIndex}
                </div>
            </div>
        </div>
    )
}

export default User;