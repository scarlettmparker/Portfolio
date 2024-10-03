import styles from '../styles/profile.module.css';
import Image from 'next/image';
import { getRoleByLevel } from '../../utils/helperutils';

const helper: React.FC = () => {
    return null;
};

export default helper;

// profile picture size
const SIZE = 200;

export const ProfileModule = ({ username, discordId, avatar, nickname, level, numAnnotations, votes}:
    {username: string, discordId: string, avatar: string, nickname: string, level: string, numAnnotations: number, votes: number}) => {

    // get level styling from json
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
                    <span className={styles.annotationCount}><b>{numAnnotations}</b> {numAnnotations === 1 ? 'Annotation' : 'Annotations'}</span>
                    <span className={styles.voteCount}><b>{votes ?? 0 }</b> {votes === 1 ? 'Rating' : 'Ratings'}</span>
                </div>
            </div>
        </div>
    )
}