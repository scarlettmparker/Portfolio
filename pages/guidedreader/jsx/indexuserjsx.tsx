import styles from '../styles/indexuser.module.css';
import returnAvatar from '../utils/avatarutils';
import { BOT_LINK } from '../utils/helperutils';
import Image from 'next/image';
import Link from 'next/link';

const helper: React.FC = () => {
    return null;
};

export default helper;

// profile picture size
const SIZE = 50;

// user profile component
export const IndexUser = (userDetails: any) => {
    // get user details
    const user = userDetails.userDetails.user;
    const avatar = user.avatar;
    const userId = user.discordId;

    const avatarUrl = returnAvatar(avatar, userId);
    return (
        <>
            <div className={styles.profileWrapper}>
                <div className={styles.avatarWrapper}>
                    <Link href={`/guidedreader/profile/${userId}`}>
                        <Image src={avatarUrl} className={styles.avatar} alt="User Avatar" width={SIZE} height={SIZE} />
                    </Link>
                </div>
            </div>
        </>
    );
}

export const NotLoggedIn = () => {
    return (
        <div className={styles.profileWrapper}>
            <span className={styles.signIn} onClick={() => window.location.href = BOT_LINK!}>Sign In</span>
        </div>
    );
}