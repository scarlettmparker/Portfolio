import Head from 'next/head';
import styles from './styles/index.module.css';
import roles from '../data/roles.json';
import { useEffect, useState, useRef } from 'react';
import { parseCookies } from 'nookies';
import './styles/global.css';

// annotation interface for text data
interface Annotation {
	start: number;
	end: number;
	description: string;
}

// text itself
interface Text {
	text: string;
	language: String;
	annotations: Annotation[];
}

// text object containing multiple texts
interface TextObject {
	title: string;
	level: string;
	text: Text[];
}

// role object
interface Role {
	name: string;
	id: number;
	hex: string;
};
// fetch text titles from the api
async function fetchTextTitles() {
	const response = await fetch('./api/guidedreader/fetchtitles', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
	});
	const data = await response.json();
	return data;
}

// fetch text data from the api using each title
async function fetchTextData(texts: Text[]) {
	const response = await fetch('./api/guidedreader/fetchdata', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(texts)
	});
	const data = await response.json();
	return data;
}

// add texts to the database
async function addTextsToDB(texts: TextObject[]) {
	// type check the texts
	if (!Array.isArray(texts)) {
		throw new Error("Expected texts to be an array");
	}

	const responses = [];

	// go through each text and add it to the database
	for (const textObject of texts) {
		const response = await fetch('./api/guidedreader/addtext', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				title: textObject.title,
				level: textObject.level,
				text: textObject.text,
				language: 'GR',
			}),
		});
		responses.push(await response.json());
	}

	return responses;
}

// get text data from the database
async function getTextDataFromDB() {
	const response = await fetch('./api/guidedreader/fetchdbdata');
	return response.json();
}

// create text modules from titles
function textModule(title: string, level: string, currentText: boolean) {
	return (
		<div className={`${styles.textItem} ${currentText ? styles.selectedTextItem : ''}`}>
			<span className={styles.textTitle}>{title}</span>
		</div>
	);
}

// section off text data by level
function findLevelSeparators(textData: TextObject[]) {
	const levelSeparators: { index: number, level: string }[] = [];
	let currentLevel = textData[0].level;
	levelSeparators.push({ index: 0, level: currentLevel });

	// find all level separators
	for (let i = 1; i < textData.length; i++) {
		if (textData[i].level !== currentLevel) {
			// add the level separator if it isn't equal to the previous one
			currentLevel = textData[i].level;
			levelSeparators.push({ index: i, level: currentLevel });
		}
	}

	return levelSeparators;
}

// do the annotation animation for the modal
function hideAnnotationAnimation(setCurrentAnnotation: (value: string) => void) {
	let annotationModal = document.getElementById('annotationModal');
	annotationModal?.classList.add(styles.annotationModalHidden);

	// wait for the modal to be hidden before setting resetting the annotation
	setTimeout(() => {
		setCurrentAnnotation('');
	}, 500);
}

// show the annotation animation for the modal
function showAnnotationAnimation(description: string, setCurrentAnnotation: (value: string) => void) {
	let annotationModal = document.getElementById('annotationModal');
	annotationModal?.classList.remove(styles.annotationModalHidden);
	setCurrentAnnotation(description);
}

// display the annotation text in the modal, and display the modal
function displayAnnotatedText(description: string, currentAnnotation: string, setCurrentAnnotation: (value: string) => void) {
	if (currentAnnotation == description) {
		hideAnnotationAnimation(setCurrentAnnotation);
		return;
	}
	showAnnotationAnimation(description, setCurrentAnnotation);
}

// deal with annotation clicks since injecting html is awkward
const handleAnnotationClick = (event: Event, currentAnnotation: string, setCurrentAnnotation: (value: string) => void) => {
	const target = event.target as HTMLElement;
	if (target.classList.contains(styles.annotatedText)) {
		// get the description from the attribute
		const description = target.getAttribute('data-description');
		if (description) {
			displayAnnotatedText(decodeURIComponent(description), currentAnnotation, setCurrentAnnotation);
		}
	}
};

// annotated text rendering
const renderAnnotatedText = (text: string, annotations: Annotation[]) => {
	let annotatedText = "";
	let lastIndex = 0;

	// iterate through the annotations and create a span from it
	annotations.forEach(({ description, start, end }) => {
		annotatedText += text.slice(lastIndex, start);
		// encode and used as an attribute, set class and data-description for click events
		annotatedText += `<span class="${styles.annotatedText}" data-description="${encodeURIComponent(description)}">${text.slice(start, end)}</span>`;
		lastIndex = end;
	});

	annotatedText += text.slice(lastIndex);
	return annotatedText;
};

// get database data for the default texts
const fetchData = async () => {
	let data = await getTextDataFromDB();
	// if the database is empty, fetch the text data from the api
	if (data.length == 0) {
		let fetchedTexts = await fetchTextTitles();
		fetchedTexts = await fetchTextData(fetchedTexts);

		// add the fetched texts to the database
		const responses = await addTextsToDB(fetchedTexts.results);
		const allSuccess = responses.every(response => response.message === 'Text object created/updated successfully');

		if (!allSuccess) {
			console.error("Some texts could not be added to the database", responses);
		}
	}
	return data;
};

// get user details using auth token
async function getUserDetails(auth: string) {
	return fetch('./api/guidedreader/auth/getuser', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': auth,
		},
	});
}

const getRoleByLevel = (level: string) => {
	return roles.find(role => role.id === level);
};

// level display component
const LevelDisplay = ({ level }: { level: string }) => {
	const role = getRoleByLevel(level);
	const color = role ? role.hex : '#000';

	return (
		<div className={styles.levelDisplay}>
			<span className={styles.levelDisplayTitle}>Level: </span>
			<span className={styles.levelDisplayText} style={{ color: color }}>{role?.name}</span>
		</div>
	);
};

// home page component
function Home() {
	// react states yahoooo
	const [textData, setTextData] = useState<TextObject[]>([]);
	const [currentText, setCurrentText] = useState<number>(0);
	const [levelSeparators, setLevelSeparators] = useState<{ index: number, level: string }[]>([]);
	const [currentLevel, setCurrentLevel] = useState<string>('');
	const [currentAnnotation, setCurrentAnnotation] = useState<string>('');
	const [currentLanguage, setCurrentLanguage] = useState<number>(0);
	const [userDetails, setUserDetails] = useState<any>(null);

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
				}
			});
		}
	}, []);

	useEffect(() => {
		const fetchDataAsync = async () => {
			const data = await fetchData();
			// set the text data and level separators
			setTextData(data);
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

	// click event listeners for annnotations
	useEffect(() => {
		const currentRef = textContentRef.current;
		const handleClick = (event: Event) => handleAnnotationClick(event, currentAnnotation, setCurrentAnnotation);
		currentRef?.addEventListener('click', handleClick);
		return () => {
			currentRef?.removeEventListener('click', handleClick);
		};
	}, [currentAnnotation, textContentRef]);

	// helper function to clear cookies
	const clearCookies = () => {
		const userCookies = ['token'];
		userCookies.forEach(cookieName => {
			document.cookie = `${cookieName}=;expires=${new Date().toUTCString()};path=/`;
		});
	};

	return (
		<>
			<Head>
				<title>Guided Reader</title>
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<div className={styles.pageWrapper}>
				{userDetails && (
					<p>Good Morning, {userDetails.user.username} <LevelDisplay level={userDetails.user.levels[0]} /></p>
				)}
				{currentAnnotation && (
					<div id="annotationModal" className={styles.annotationModal}>
						<span className={styles.annotationModalTitle}><strong>Annotation</strong></span>
						<span className={styles.annotationModalClose} onClick={() => {
							hideAnnotationAnimation(setCurrentAnnotation);
						}}>X</span>
						<span className={styles.annotationModalText} dangerouslySetInnerHTML={{ __html: currentAnnotation }}></span>
					</div>
				)}
				<div className={styles.mainWrapper}>
					<div className={styles.sideWrapper}>
						<div className={styles.sideTitleWrapper}>
							<span className={styles.sideTitle}>Texts (κείμενα)</span>
						</div>
						<div className={styles.textList} ref={textListRef}>
							<div className={styles.textItemWrapper}>
								{textData.length !== 0 ? textData.map(({ title, level }, index) => (
									<>
										{levelSeparators.some(separator => separator.index === index) ?
											<div key={"levelSeparator" + index} data-index={index} className={`${styles.levelSeparator} levelSeparator`}>
												{levelSeparators.find(separator => separator.index === index)?.level}
											</div>
											: null}
										<div key={"textModule" + index} onClick={() => {
											setCurrentLanguage(0);
											setCurrentText(index)
										}
										}>
											{textModule(title, level, currentText === index)}
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
										<p dangerouslySetInnerHTML={{
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
