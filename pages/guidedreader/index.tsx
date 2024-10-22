import './styles/global.css';
import Head from 'next/head';
import styles from './styles/index.module.css';
import themestyles from './styles/theme.module.css';
import themejson from './data/theme.json';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { TextObject, Theme } from './types/types'
import { useRouter } from 'next/router';
import { renderAnnotatedText } from './utils/renderutils';
import { handleAnnotationClick, hideAnnotationAnimation } from './utils/annotationutils';
import { handleTextSelection } from './utils/charutils';
import { fetchData, fetchCurrentTextData } from './utils/textutils';
import { getUserDetails, findLevelSeparators } from './utils/helperutils';
import { IndexUser, NotLoggedIn } from './jsx/indexuserjsx';
import { LevelNavigation, TextList, TextModule } from './jsx/textjsx';
import { AnnotationModal, CreatingAnnotationModal, CreateAnnotationButton, CorrectingAnnotationModal } from './jsx/annotationjsx';
import { Toolbar } from './jsx/toolbarjsx';
import { GetServerSideProps } from 'next';
import { parse } from 'cookie';
import { ErrorBox } from './jsx/errorjsx';

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

    // return the user details
    return {
        props: {
            user: user || null,
        },
    };
};

// home page component
function Home({ user }: any) {
    // react states yahoooo
    const [textData, setTextData] = useState<TextObject[]>([]);
    const [currentText, setCurrentText] = useState<number>(textData[0]?.id || 0);
    const [currentTextID, setCurrentTextID] = useState<number>(0);
    const [hasURLData, setHasURLData] = useState<boolean>(false);

    const [levelSeparators, setLevelSeparators] = useState<{ index: number, level: string }[]>([]);
    const [currentLevel, setCurrentLevel] = useState<string>('');
    const [currentAnnotation, setCurrentAnnotation] = useState<string>('');
    const [currentLanguage, setCurrentLanguage] = useState<number>(0);
    const [creatingAnnotation, setCreatingAnnotation] = useState<boolean>(false);

    // error states
    const [errorBox, setErrorBox] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    // for correcting annotation nonsense
    const [correctingAnnotation, setCorrectingAnnotation] = useState<boolean>(false);
    const [correctingAnnotationData, setCorrectingAnnotationData] = useState<any>(null);

    const [themeName, setThemeName] = useState<string>('default');
    const [currentThemeData, setCurrentThemeData] = useState<Theme | null>(null);

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userDetails, setUserDetails] = useState<any>(null);
    const [selectedText, setSelectedText] = useState('')
    const [charIndex, setCharIndex] = useState(-1);
    const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });

    const textListRef = useRef<HTMLDivElement>(null);
    const textContentRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        // clean up for wiktionary stuff
        const handleBeforeUnload = () => {
            localStorage.removeItem('lastSelectedText');
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    useEffect(() => {
        if (user) {
            setUserDetails(user);
            setIsLoggedIn(true);
        }
    }, []);

    useEffect(() => {
        setCurrentThemeData(themejson.find(t => t.name === themeName) || null);
    }, [themeName]);

    const handleTextSelectionRef = () => handleTextSelection({ textContentRef, selectedText, setSelectedText, setButtonPosition, creatingAnnotation, setCharIndex });

    useEffect(() => {
        const fetchDataAsync = async () => {
            const data = await fetchData();
            // set the text data and level separators
            setTextData(data);
            setCurrentText(data[0]?.id - 1 || 0);
            setLevelSeparators(findLevelSeparators(data));
        };
        fetchDataAsync();
    }, []);

    // click event listeners for opening annnotations
    useEffect(() => {
        const currentRef = textContentRef.current;
        const handleClick = (event: Event) => handleAnnotationClick(event, currentAnnotation, setCurrentAnnotation);
        currentRef?.addEventListener('click', handleClick);
        return () => {
            currentRef?.removeEventListener('click', handleClick);
        };
    }, [currentAnnotation, textContentRef]);

    // click event listeners for creating annotations
    useEffect(() => {
        document.addEventListener('mouseup', handleTextSelectionRef);
        // cleanup listener to avoid adding multiple listeners
        return () => {
            document.removeEventListener('mouseup', handleTextSelectionRef);
        };
    }, [creatingAnnotation, selectedText]);

    useEffect(() => {
        // get the text id from the query parameter
        const params = new URLSearchParams(window.location.search);
        const textID = params.get('textId');

        if (textID && !isNaN(Number(textID))) {
            const foundTextIndex = textData.findIndex(text => text.id === Number(textID));
            if (foundTextIndex !== -1) {
                setCurrentText(foundTextIndex);
                setHasURLData(true);
            } else {
                setCurrentText(0); // fallback to default if not found
            }
        } else {
            setCurrentText(0); // fallback to default if no query parameter
        }
    }, [textData]);

    useEffect(() => {
        // fetch the text data if it doesn't exist
        fetchCurrentTextData(textData, currentText, setTextData, setCurrentTextID);
        if (textData[currentText]) {
            router.replace(
                {
                    query: { textId: textData[currentText].id },
                },
                undefined,
                { shallow: true }
            );
        }
    }, [currentText, textData]);

    const scrollToLevel = (level: string) => {
        const levelElement = textListRef.current?.querySelector(`[data-level="${level}"]`);
        if (levelElement) {
            levelElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <>
            <Head>
                <title>Guided Reader</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            {errorBox && (
                <ErrorBox error={errorMessage} setError={setErrorBox} />
            )}
            {currentAnnotation && (
                <>
                    {creatingAnnotation && hideAnnotationAnimation(setSelectedText, "createAnnotationModal", setCreatingAnnotation)}
                    {correctingAnnotation && hideAnnotationAnimation(setSelectedText, "createAnnotationModal", setCorrectingAnnotation)}
                    <AnnotationModal setCurrentAnnotation={setCurrentAnnotation} currentAnnotation={currentAnnotation} currentLanguage={currentLanguage} currentText={textData[currentText]}
                        userDetails={userDetails} setCorrectingAnnotation={setCorrectingAnnotation} setCorrectingAnnotationData={setCorrectingAnnotationData} />
                </>
            )}
            {selectedText && !creatingAnnotation && !correctingAnnotation && (
                <CreateAnnotationButton buttonPosition={{
                    x: buttonPosition.x,
                    y: buttonPosition.y
                }} isLoggedIn={isLoggedIn}
                    setCreatingAnnotation={setCreatingAnnotation}
                    setCurrentAnnotation={setCurrentAnnotation} />
            )}
            {creatingAnnotation && (
                <CreatingAnnotationModal setSelectedText={setSelectedText} setError={setErrorBox} setErrorMessage={setErrorMessage} selectedText={selectedText}
                    setCreatingAnnotation={setCreatingAnnotation} currentTextID={currentTextID} userDetails={userDetails} charIndex={charIndex} />
            )}
            {correctingAnnotation && (
                <CorrectingAnnotationModal setCreatingAnnotation={setCorrectingAnnotation} setError={setErrorBox} setErrorMessage={setErrorMessage}
                    userDetails={userDetails} currentTextID={currentTextID} correctingAnnotationData={correctingAnnotationData} />
            )}
            {isLoggedIn ? (
                <IndexUser userDetails={userDetails} />
            ) : (
                <NotLoggedIn />
            )}
            <div className={styles.mainWrapper} id="mainWrapper">
                <TextList textData={textData} levelSeparators={levelSeparators} setCurrentText={setCurrentText} setCurrentAnnotation={setCurrentAnnotation}
                    setCurrentLanguage={setCurrentLanguage} currentText={currentText} textListRef={textListRef} setCurrentLevel={setCurrentLevel} hasURLData={hasURLData} />
                {currentThemeData && currentThemeData.has_images && (
                    <div className={`${themestyles.themeNavWrapper}`}>
                        <Image draggable={false} src={currentThemeData.image_path + currentThemeData.images.find((image: { id: number; name: string; }) => image.id === 0)?.name
                            + ".png" || '/default-image.png'} alt="theme image" width={766} height={66} />
                    </div>
                )}
                <div className={styles.textWrapper}>
                <LevelNavigation currentLevel={currentLevel} currentTheme={currentThemeData} scrollToLevel={scrollToLevel} />
                    <Toolbar textData={textData} setCurrentAnnotation={setCurrentAnnotation} setCurrentLanguage={setCurrentLanguage} currentText={currentText} setCurrentTextID={setCurrentTextID} />
                    <TextModule currentText={currentText} textContentRef={textContentRef} textData={textData} renderAnnotatedText={renderAnnotatedText} currentLanguage={currentLanguage} />
                </div>
            </div>
        </>
    );
}

export default Home;
