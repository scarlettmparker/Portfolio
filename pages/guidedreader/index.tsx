import './styles/global.css';
import Head from 'next/head';
import styles from './styles/index.module.css';
import { useEffect, useState, useRef } from 'react';
import { parseCookies } from 'nookies';
import { TextObject } from './types/types'
import { renderAnnotatedText } from './utils/renderutils';
import { handleAnnotationClick } from './utils/annotationutils';
import { handleTextSelection } from './utils/charutils';
import { fetchData } from './utils/textutils';
import { getUserDetails, findLevelSeparators, clearCookies } from './utils/helperutils';
import { IndexUser, NotLoggedIn } from './jsx/indexuser';
import { TextModule } from './jsx/textjsx';
import { AnnotationModal, CreatingAnnotationModal, CreateAnnotationButton } from './jsx/annotationjsx';

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
			setCurrentTextID(data[0]?.text[0].id || 0);
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
					<AnnotationModal setCurrentAnnotation={setCurrentAnnotation} currentAnnotation={currentAnnotation}
						currentLanguage={currentLanguage} currentText={textData[currentText]} userDetails={userDetails} />
				)}
				{selectedText && !creatingAnnotation && (
					<CreateAnnotationButton buttonPosition={{
						x: buttonPosition.x,
						y: buttonPosition.y
					}} isLoggedIn={isLoggedIn}
						setCreatingAnnotation={setCreatingAnnotation} />
				)}
				{creatingAnnotation && (
					<CreatingAnnotationModal setSelectedText={setSelectedText} selectedText={selectedText}
						setCreatingAnnotation={setCreatingAnnotation} currentTextID={currentTextID} userDetails={userDetails} charIndex={charIndex} />
				)}
				<div className={styles.mainWrapper}>
					<div className={styles.sideWrapper}>
						<div className={styles.sideTitleWrapper}>
							<span className={styles.sideTitle}>Texts (κείμενα)</span>
						</div>
						<div className={styles.textList} ref={textListRef}>
							<div className={styles.textItemWrapper}>
								{textData.length !== 0 ? textData.map(({ title, level, id }, index) => (
									<>
										{levelSeparators.some(separator => separator.index === index) ?
											<div key={"levelSeparator" + index} data-index={index} className={`${styles.levelSeparator} levelSeparator`}>
												{levelSeparators.find(separator => separator.index === index)?.level}
											</div>
											: null}
										<div key={"textModule" + index} onClick={() => {
											let textIndex = textData[index].id - 1;
											setCurrentLanguage(0);
											setCurrentAnnotation('');
											setCurrentText(textIndex);
											setCurrentTextID(textData[textIndex].text[0].id);
										}}>
											{TextModule(title, level, currentText === index)}
										</div>
									</>
								)) : <span className={styles.loadingText}>Loading...</span>}
							</div>
						</div>
					</div>
					<div className={styles.textWrapper}>
						<div className={styles.navWrapper}>
							<div className={styles.navItemWrapper}>
								<span className={`${styles.navItem} ${currentLevel === 'Α1' || currentLevel === 'Α1 (8-12)' ? styles.activeNavItemA1 : ''}`}>A1</span>
								<span className={`${styles.navItem} ${currentLevel === 'Α2' ? styles.activeNavItemA2 : ''}`}>A2</span>
								<span className={`${styles.navItem} ${currentLevel === 'Β1' ? styles.activeNavItemB1 : ''}`}>B1</span>
								<span className={`${styles.navItem} ${currentLevel === 'Β2' ? styles.activeNavItemB2 : ''} ${styles.navItemB2}`}>B2</span>
								<span className={`${styles.navItem} ${currentLevel === 'Γ1' ? styles.activeNavItemC1 : ''}`}>C1</span>
								<span className={`${styles.navItem} ${currentLevel === 'Γ2' ? styles.activeNavItemC2 : ''}`}>C2</span>
							</div>
						</div>
						<div className={styles.toolbarWrapper}>
							<div className={styles.languageChangeWrapper}>
								<select className={styles.languageChangeBox} onChange={(e) => {
									const selectedIndex = parseInt(e.target.value, 10);
									setCurrentLanguage(selectedIndex);
									setCurrentAnnotation('');
									setCurrentTextID(textData[currentText].text[selectedIndex].id);
								}}>
									{textData[currentText] && textData[currentText].text.map((text, index) => (
										<option key={"languageChange" + index} value={index}>
											{text.language}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className={styles.textContentWrapper} ref={textContentRef}>
							<div className={styles.textContent}>
								{currentText < textData.length && textData[currentText].text.length > 0 ? (
									<div key={"textContent0"} className={styles.textContentItem}>
										<div dangerouslySetInnerHTML={{
											__html: renderAnnotatedText(textData[currentText].text[currentLanguage].text,
												textData[currentText].text[currentLanguage].annotations)
										}} />
									</div>
								) : null}
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

export default Home;
