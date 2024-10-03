import './styles/global.css';
import Head from 'next/head';
import styles from './styles/index.module.css';
import { useEffect, useState, useRef } from 'react';
import { parseCookies } from 'nookies';
import { TextObject } from './types/types'
import { renderAnnotatedText } from './utils/renderutils';
import { handleAnnotationClick, hideAnnotationAnimation } from './utils/annotationutils';
import { handleTextSelection } from './utils/charutils';
import { fetchData, fetchCurrentTextData } from './utils/textutils';
import { getUserDetails, findLevelSeparators, clearCookies } from './utils/helperutils';
import { IndexUser, NotLoggedIn } from './jsx/indexuserjsx';
import { LevelNavigation, TextList, TextModule } from './jsx/textjsx';
import { AnnotationModal, CreatingAnnotationModal, CreateAnnotationButton, CorrectingAnnotationModal } from './jsx/annotationjsx';
import { Toolbar } from './jsx/toolbarjsx';

// home page component
function Home() {
	// react states yahoooo
	const [textData, setTextData] = useState<TextObject[]>([]);
	const [currentText, setCurrentText] = useState<number>(textData[0]?.id || 0);
	const [currentTextID, setCurrentTextID] = useState<number>(0);

	const [levelSeparators, setLevelSeparators] = useState<{ index: number, level: string }[]>([]);
	const [currentLevel, setCurrentLevel] = useState<string>('');
	const [currentAnnotation, setCurrentAnnotation] = useState<string>('');
	const [currentLanguage, setCurrentLanguage] = useState<number>(0);
	const [creatingAnnotation, setCreatingAnnotation] = useState<boolean>(false);

	// for correcting annotation nonsense
	const [correctingAnnotation, setCorrectingAnnotation] = useState<boolean>(false);
	const [currentStart, setCurrentStart] = useState<number>(0);
	const [currentEnd, setCurrentEnd] = useState<number>(0);

	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [userDetails, setUserDetails] = useState<any>(null);
	const [selectedText, setSelectedText] = useState('')
	const [charIndex, setCharIndex] = useState(-1);

	const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });

	const textListRef = useRef<HTMLDivElement>(null);
	const textContentRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const cookies = parseCookies();
		const userToken = cookies.token;

		// get the user details if the token exists
		if (userToken) {
			getUserDetails(userToken).then(response => response.json()).then(data => {
				// if the user doesn't exist, clear the cookies
				if (!data.user) {
					clearCookies();
				} else {
					setUserDetails(data);
					setIsLoggedIn(true);
				}
			});
		}
	}, []);

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

	useEffect(() => {
		// create an observer to track the level separators
		const observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
					setCurrentLevel(textData[index].level);
				}
			});
		}, { threshold: 0.5 });

		// observe the level separators
		const elements = textListRef.current?.querySelectorAll('.levelSeparator');
		elements?.forEach(el => observer.observe(el));

		return () => {
			elements?.forEach(el => observer.unobserve(el));
		};
	}, [textData]);

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
		// fetch the text data if it doesn't exist
		fetchCurrentTextData(textData, currentText, setTextData, setCurrentTextID);
	}, [currentText, textData]);

	return (
		<>
			<Head>
				<title>Guided Reader</title>
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<div className={styles.pageWrapper}>
				{isLoggedIn ? (
					<IndexUser userDetails={userDetails} />
				) : (
					<NotLoggedIn />
				)}
				{currentAnnotation && (
					<>
						{creatingAnnotation && hideAnnotationAnimation(setSelectedText, "createAnnotationModal", setCreatingAnnotation)}
						{correctingAnnotation && hideAnnotationAnimation(setSelectedText, "createAnnotationModal", setCorrectingAnnotation)}
						<AnnotationModal setCurrentAnnotation={setCurrentAnnotation} currentAnnotation={currentAnnotation} currentLanguage={currentLanguage} currentText={textData[currentText]}
							userDetails={userDetails} setCorrectingAnnotation={setCorrectingAnnotation} setCurrentStart={setCurrentStart} setCurrentEnd={setCurrentEnd} />
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
					<CreatingAnnotationModal setSelectedText={setSelectedText} selectedText={selectedText}
						setCreatingAnnotation={setCreatingAnnotation} currentTextID={currentTextID} userDetails={userDetails} charIndex={charIndex} />
				)}
				{correctingAnnotation && (
					<CorrectingAnnotationModal setCreatingAnnotation={setCorrectingAnnotation} userDetails={userDetails}
						currentTextID={currentTextID} start={currentStart} end={currentEnd} />
				)}
				<div className={styles.mainWrapper}>
					<TextList textData={textData} levelSeparators={levelSeparators} setCurrentText={setCurrentText} setCurrentAnnotation={setCurrentAnnotation}
						setCurrentLanguage={setCurrentLanguage} currentText={currentText} textListRef={textListRef} />
					<div className={styles.textWrapper}>
						<LevelNavigation currentLevel={currentLevel} />
						<Toolbar textData={textData} setCurrentAnnotation={setCurrentAnnotation} setCurrentLanguage={setCurrentLanguage} currentText={currentText} setCurrentTextID={setCurrentTextID}/>
						<TextModule currentText={currentText} textContentRef={textContentRef} textData={textData} renderAnnotatedText={renderAnnotatedText} currentLanguage={currentLanguage}/>
					</div>
				</div>
			</div>
		</>
	);
}

export default Home;
