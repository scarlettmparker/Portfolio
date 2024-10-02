import styles from '../styles/indexuser.module.css';
import { getRoleByLevel, BOT_LINK } from '../utils/helperutils';
import Image from 'next/image';
import Link from 'next/link';

const helper: React.FC = () => {
    return null;
};

export default helper;

// profile picture size
const SIZE = 60;

// level display component
export const LevelDisplay = ({ level }: { level: string }) => {
    const role = getRoleByLevel(level);
    const color = role ? role.hex : '#000';

    return (
        <div className={styles.levelDisplay}>
            <span className={styles.levelDisplayTitle}>Level: </span>
            <span className={styles.levelDisplayText} style={{ color: color }}><b>{role?.shortname}</b></span>
        </div>
    );
};

// user profile component
export const IndexUser = (userDetails: any) => {
    // get user details
    const user = userDetails.userDetails.user;
    const avatar = user.avatar;
    const userId = user.discordId;
    const level = user.levels[0];

    const avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png`;
    return (
        <>
            <div className={styles.profileWrapper}>
                <div className={styles.avatarWrapper}>
                    <Link href={`/guidedreader/profile/${userId}`}>
                        <Image src={avatarUrl} className={styles.avatar} alt="User Avatar" width={SIZE} height={SIZE} />
                    </Link>
                </div>
                <LevelDisplay level={level} />
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