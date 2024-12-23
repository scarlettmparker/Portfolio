import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { ProfileModule } from './jsx/profilejsx';
import styles from './styles/profile.module.css';

const ProfilePage = () => {
    // get user id from query
    const router = useRouter();
    const { userId } = router.query;

    // react states for user details
    const [userDetails, setUserDetails] = useState<any>(null);
    const [username, setUsername] = useState<string>('');
    const [avatar, setAvatar] = useState<string>('');
    const [nickname, setNickname] = useState<string>('');
    const [level, setLevel] = useState<string>('');
    const [numAnnotations, setNumAnnotations] = useState<number>(0);
    const [votes, setVotes] = useState<number>(0);

    if (router.isFallback) {
        return <div>Loading...</div>;
    }

    useEffect(() => {
        if (!userId) return;

        const fetchUserData = async () => {
            const userData = await getUserById(userId as string);
            // if the user doesn't exist
            if (!userData) {
                router.push('/guidedreader');
            } else {
                setUserDetails(userData);
            }
        };
        fetchUserData();
    }, [userId]);

    useEffect(() => {
        if (!userDetails) return;

        // set user details from request
        setUsername(userDetails.username);
        setAvatar(userDetails.avatar);
        setNickname(userDetails.nickname);

        // set user level & ensure bypass takes effect
        const userLevel = userDetails.levels[0];
        setLevel(userLevel.startsWith("L-BYPASS-") ? userLevel.replace("L-BYPASS-", "") : userLevel);

        setNumAnnotations(userDetails.numAnnotations);
        setVotes(userDetails.totalVotes);
    }, [userDetails]);

    return (
        <div className={styles.pageWrapper}>
            <ProfileModule username={username} discordId={userId as string} avatar={avatar}
            nickname={nickname} level={level} numAnnotations={numAnnotations} votes={votes} />
        </div>
    );
};

// get user data by discord id
async function getUserById(userId: string) {
    const response = await fetch(`/api/guidedreader/getuserbydiscordid?userId=${userId}`);
    const userData = await response.json();
    return userData.user;
}

export default ProfilePage;