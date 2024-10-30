import { PAGE_LENGTH } from "../utils/user/userutils";
import styles from "../styles/admin.module.css";

const ChangeListButton = ({ direction, pageIndex, setPageIndex, numUsers }: { direction: string, pageIndex: number, setPageIndex: (value: number) => void, numUsers: number }) => {
    const handleClick = () => {
        // change page index based on direction
        if (direction === 'left') {
            if (pageIndex + PAGE_LENGTH >= numUsers) {
                setPageIndex(numUsers - PAGE_LENGTH - (numUsers % PAGE_LENGTH));
            } else {
                setPageIndex(Math.max(0, pageIndex - PAGE_LENGTH));
            }
        } else if (direction === 'right') {
            setPageIndex(Math.min(numUsers - PAGE_LENGTH, pageIndex + PAGE_LENGTH));
        }
    };

    // ensure the button is disabled if the user is at the beginning or end of the list
    const isDisabled = (direction === 'left' && pageIndex === 0)
        || (direction === 'right' && pageIndex >= numUsers - PAGE_LENGTH) || numUsers === 0;

    return (
        <button className={styles.changeListButton} onClick={handleClick} disabled={isDisabled}>
            {direction === 'left' ? '<' : '>'}
        </button>
    );
};

export default ChangeListButton;