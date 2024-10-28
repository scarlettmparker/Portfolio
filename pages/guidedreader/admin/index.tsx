import '../styles/global.css';
import styles from './styles/admin.module.css';
import Head from 'next/head';
import { parse } from 'cookie';
import { useRouter } from 'next/router';
import { useEffect, useState } from "react";
import { GetServerSideProps} from 'next';
import { getSuperUser, getUserDetails } from "../utils/helperutils";
import { IndexUser, NotLoggedIn } from "../jsx/indexuserjsx";
import AdminPanel from './jsx/adminpanel';


// get server side props for user details
export const getServerSideProps: GetServerSideProps = async (context) => {
    // get the user token from the cookies
    const { req } = context;
    const cookies = parse(req.headers.cookie || '');
    const userToken = cookies.token;

    let user = null;

    if (userToken) {
        // get the user details
        const response = await getUserDetails(userToken, req);
        if (response.ok) {
            user = await response.json();
        }
    }

    if (user) {
        // check if user is a super user (admin)
        const response = await getSuperUser(userToken, req, user.discordId);
        if (response.ok) {
            user.SuperUser = true;
        }
    }

    // return the user details
    return {
        props: {
            user: user || null,
        },
    };
};

function Home({ user }: any) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userDetails, setUserDetails] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        if (user) {
            setUserDetails(user);
            setIsLoggedIn(true);
            // boot the user out if they are not a super user
            if (!user.SuperUser) {
                router.push('/guidedreader');
            }
        }
    }, [user, router]);

    if (!isLoggedIn || !user.SuperUser) {
        return null;
    }

    return (
        <div>
            <Head>
                <title>Admin Panel</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            {isLoggedIn ? (
                <div className={styles.pageWrapper}>
                    <IndexUser userDetails={userDetails} />
                    <AdminPanel userDetails={userDetails} />
                </div>
            ) : (
                <NotLoggedIn />
            )}
            
        </div>
    );
}

export default Home;