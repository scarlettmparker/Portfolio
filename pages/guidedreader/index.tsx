import Head from 'next/head';
import styles from './styles/index.module.css';
import { useEffect, useState, useRef } from 'react';
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

function Home() {
	// react states yahoooo
	const [textData, setTextData] = useState<TextObject[]>([]);
	const [currentText, setCurrentText] = useState<number>(0);
	const [levelSeparators, setLevelSeparators] = useState<{ index: number, level: string }[]>([]);
	const [currentLevel, setCurrentLevel] = useState<string>('');
	const [currentAnnotation, setCurrentAnnotation] = useState<string>('');
	const [currentLanguage, setCurrentLanguage] = useState<number>(0);

	const textListRef = useRef<HTMLDivElement>(null);
	const textContentRef = useRef<HTMLDivElement>(null);

	// get database data for the default texts
	const fetchData = async () => {
		const data = await getTextDataFromDB();
		setTextData(data);
		setLevelSeparators(findLevelSeparators(data));
	};

	useEffect(() => {
		fetchData();
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

	return (
		<>
			<Head>
				<title>Guided Reader</title>
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<div className={styles.pageWrapper}>
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
											setCurrentText(index)}
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
