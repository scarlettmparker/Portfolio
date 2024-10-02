import styles from '../styles/profile.module.css';
import Image from 'next/image';
import { getRoleByLevel } from '../../utils/helperutils';

// profile picture size
const SIZE = 200;

export const ProfileModule = ({ username, discordId, avatar, nickname, level }: {username: string, discordId: string, avatar: string, nickname: string, level: string}) => {
    const levelName = getRoleByLevel(level)?.name;
    const levelColor = getRoleByLevel(level)?.hex;
    const levelShortName = getRoleByLevel(level)?.shortname;

    return (
        <div className={styles.profileWrapper}>
            <div className={styles.avatarWrapper}>
                <Image src={`https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png?size=1024`} className={styles.avatar}
                alt="User Avatar" width={SIZE} height={SIZE}/>
            </div>
            <div className={styles.profileDetails}>
                <div className={styles.bigNameWrapper}>
                    <span className={styles.nickname}>{nickname}</span>
                    <span className={styles.level} style={{ color: levelColor }}>{levelShortName}</span>
                </div>
                <div className={styles.userLevelWrapper}>
                    <span className={styles.username}>{username}</span> -
                    <span className={styles.levelName} style={{ color: levelColor }}>{levelName}</span>
                </div>
                <div className={styles.annotationsWrapper}>
                    
                </div>
            </div>
        </div>
    )
}