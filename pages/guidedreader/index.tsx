import Head from 'next/head';
import styles from './styles/index.module.css';
import roles from '../data/roles.json';
import { useEffect, useState, useRef } from 'react';
import { parseCookies } from 'nookies';
import './styles/global.css';

const BOT_LINK = process.env.NEXT_PUBLIC_BOT_LINK;

// annotation interface for text data
interface Annotation {
	start: number;
	end: number;
	description: string;
}

interface Author {
	username: string;
}

// text itself
interface Text {
	id: number;
	text: string;
	language: String;
	annotations: Annotation[];
}

// text object containing multiple texts
interface TextObject {
	id: number;
	title: string;
	level: string;
	text: Text[];
}

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
function hideAnnotationAnimation(setCurrentAnnotation: (value: string) => void, elementToHide: string, setCreatingAnnotation?: (value: boolean) => void) {
	let annotationModal = document.getElementById(elementToHide);
	annotationModal?.classList.add(styles.annotationModalHidden);

	// wait for the modal to be hidden before setting resetting the annotation
	setTimeout(() => {
		setCurrentAnnotation('');
		if (elementToHide == "createAnnotationModal" && setCreatingAnnotation) {
			setCreatingAnnotation(false);
		}
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
		hideAnnotationAnimation(setCurrentAnnotation, 'annotationModal');
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

const renderAnnotatedText = (text: string, annotations: Annotation[]) => {
	const parts: string[] = [];
	let lastIndex = 0;

	// Sort annotations by start index
	annotations.sort((a, b) => a.start - b.start);

	// Create a temporary DOM element to parse HTML
	const tempDiv = document.createElement('div');
	tempDiv.innerHTML = text;

	// Function to sanitize text
	const sanitizeText = (rawText: string): string => {
		return rawText
			.replace(/<[^>]*>/g, '') // Remove HTML tags
			.replace(/\u00A0/g, ' ') // Replace non-breaking spaces with regular spaces
			.replace(/\s+/g, ' ')
			.trim(); // Replace all whitespace characters with a single space
	};

	// Recursively process child nodes
	const processNode = (node: Node, startOffset: number) => {
		if (node.nodeType === Node.TEXT_NODE) {
			const textContent = node.textContent || '';
			const sanitizedText = sanitizeText(textContent); // Sanitize the text node
			const textLength = sanitizedText.length;

			// Handle annotation overlaps
			let currentOffset = startOffset;
			let lastAnnotatedIndex = 0;

			// Check against annotations for this text node
			annotations.forEach(({ description, start, end }) => {
				if (currentOffset < end && currentOffset + textLength > start) {
					const overlapStart = Math.max(start, currentOffset);
					const overlapEnd = Math.min(end, currentOffset + textLength);

					// Push unannotated text before the overlap, ensuring no empty strings
					const unannotatedText = sanitizedText.slice(lastAnnotatedIndex, overlapStart - currentOffset);
					if (unannotatedText.trim()) {
						parts.push(unannotatedText);
					}

					// Create the annotated span for the overlapping text
					const annotatedText = sanitizedText.slice(overlapStart - currentOffset, overlapEnd - currentOffset);
					if (annotatedText.trim()) {
						const annotatedHTML = `<span class="${styles.annotatedText}" data-description="${encodeURIComponent(description)}">${annotatedText}</span>`;
						parts.push(annotatedHTML);
					}
					lastAnnotatedIndex = overlapEnd - currentOffset;
				}
			});

			// Push remaining text after the last annotation, ensuring no empty strings
			if (lastAnnotatedIndex < textLength) {
				const remainingText = sanitizedText.slice(lastAnnotatedIndex);
				if (remainingText.trim()) {
					parts.push(remainingText);
				}
			}

			lastIndex = currentOffset + textLength;
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			// For element nodes, add the opening tag
			const element = node as HTMLElement;
			parts.push(`<${element.tagName.toLowerCase()}${getAttributes(element)}>`);

			node.childNodes.forEach((child) => processNode(child, lastIndex));
			parts.push(`</${element.tagName.toLowerCase()}>`);
		}
	};

	// Get attributes from an element as a string
	const getAttributes = (element: HTMLElement): string => {
		return Array.from(element.attributes)
			.map(attr => ` ${attr.name}="${attr.value}"`)
			.join('');
	};

	processNode(tempDiv, 0);

	// Join all parts into a single string and remove <br> tags
	return parts.join('').replace(/<br\s*\/?>/g, '');
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

// helper function
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

// annotation modal component
const AnnotationModal = ({ setCurrentAnnotation, currentAnnotation, currentLanguage, currentText, textData }:
	{ setCurrentAnnotation: (value: string) => void, currentAnnotation: string, currentLanguage: number, currentText: number, textData: any }) => {
	const [author, setAuthor] = useState<Author | null>(null);

	// fetch the author of the annotation
	useEffect(() => {
		// this is really ugly i can't lie
		const currentAnnotationId = textData[currentText].text[currentLanguage].annotations.findIndex((annotation: { description: string; }) => annotation.description === currentAnnotation);
		const currentUserId = textData[currentText].text[currentLanguage].annotations[currentAnnotationId].userId;

		// get the user data from api endpoint
		const fetchUser = async () => {
			const response = await fetch(`./api/guidedreader/getuserbyid?userId=${currentUserId}`);
			const userData = await response.json();
			setAuthor(userData);
		};

		fetchUser();
	}, [currentAnnotation, currentText, currentLanguage, textData]);

	return (
		<div id="annotationModal" className={styles.annotationModal}>
			<span className={styles.annotationModalTitle}><strong>Annotation</strong></span>
			<span className={styles.annotationModalClose} onClick={() => {
				hideAnnotationAnimation(setCurrentAnnotation, "annotationModal");
			}}>X</span>
			<div className={styles.annotationWrapper}>
				<span className={styles.annotationModalText} dangerouslySetInnerHTML={{ __html: currentAnnotation }}></span>
				<span className={styles.annotationModalAuthor}>Author: <b>{author ? author.username : 'Loading...'}</b></span>
			</div>
		</div>
	);
}

function hideAnnotationButton(setCreatingAnnotation: (value: boolean) => void) {
	setCreatingAnnotation(true);
};

// submit annotation to the database
async function submitAnnotation(selectedText: string, annotationText: string, userDetails: any, currentTextID: number, charIndex: number) {
	// get the current unix time
	const currentTime = Math.floor(Date.now() / 1000);

	// send request to get raw text
	let response = await fetch('./api/guidedreader/getrawtext', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			textID: currentTextID
		})
	});

	let rawText = await response.json();
	const { start, end } = findAnnotationIndexes(selectedText, rawText.text, charIndex);

	// structure the annotation
	const annotation = {
		start: start,
		end: end,
		description: annotationText,
		userId: userDetails.user.id,
		textId: currentTextID,
		creationDate: currentTime
	};

	// send the annotation to the database
	response = await fetch('./api/guidedreader/addannotation', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(annotation)
	});

	// get the response from the server
	const data = await response.json();
	if (data.error) {
		console.error("Failed to add annotation", data);
	} else {
		console.log("Annotation added successfully", data);
		//window.location.reload();
	}
}

function findAnnotationIndexes(selectedText: string, rawText: string, charIndex: number) {
	// find the start index in the stripped text
	const start = charIndex;
	const cleanedSelectedText = selectedText.replace(/\n/g, '');
	let end = start + cleanedSelectedText.length;

	if (start === -1 || end > rawText.length) {
		throw new Error("Selected text not found in stripped text.");
	}

	return { start: start, end: end };
}

// create annotation button
const CreateAnnotationButton = ({ buttonPosition, isLoggedIn, setCreatingAnnotation }:
	{ buttonPosition: { x: number, y: number }, isLoggedIn: boolean, setCreatingAnnotation: (value: boolean) => void }) => {
	return (
		<div
			className={styles.annotationPopup}
			style={{ top: buttonPosition.y, left: buttonPosition.x }}
			onMouseUp={(e) => e.stopPropagation()} // stop propagation to prevent the modal from disappearing
		>
			{isLoggedIn ? (
				<button onClick={() => { hideAnnotationButton(setCreatingAnnotation) }}
					className={styles.annotateButton}>Annotate</button>
			) : (
				<button onClick={() => { window.location.href = BOT_LINK!; }}
					className={styles.annotateButton}>Sign in to Annotate</button>
			)}
		</div>
	);
}

// modal for in-creation of annotations
const CreatingAnnotationModal = ({ setSelectedText, selectedText, setCreatingAnnotation, userDetails, currentTextID, charIndex }:
	{ setSelectedText: (value: string) => void, selectedText: string, setCreatingAnnotation: (value: boolean) => void, userDetails: any, currentTextID: number, charIndex: number }) => {
	const [annotationText, setAnnotationText] = useState("");
	return (
		<div id="createAnnotationModal" className={styles.annotationModal}>
			<span className={styles.annotationModalTitle}><strong>Annotate</strong></span>
			<span className={styles.annotationModalClose} onClick={() => {
				hideAnnotationAnimation(setSelectedText, "createAnnotationModal", setCreatingAnnotation)
			}}>X</span>
			<div className={styles.annotationWrapper}>
				<span className={styles.annotationModalText}>
					<span className={styles.annotationModalSelect}>{"- "} <i>{selectedText}</i></span>
					<textarea
						className={styles.annotationTextarea}
						placeholder="Enter annotation here..."
						rows={10}
						cols={50}
						value={annotationText}
						onChange={(e) => setAnnotationText(e.target.value)}
					/>
					<button
						className={styles.submitButton}
						onClick={() => {
							submitAnnotation(selectedText, annotationText, userDetails, currentTextID, charIndex);
							//hideAnnotationAnimation(setSelectedText, "createAnnotationModal", setCreatingAnnotation);
						}}
					>
						Submit
					</button>
				</span>
			</div>
		</div>
	);
};

const handleTextSelection = ({ textContentRef, selectedText, setSelectedText, setButtonPosition, setCharIndex, creatingAnnotation }:
	{
		textContentRef: any, selectedText: string, setSelectedText: (value: string) => void, setButtonPosition: (value: { x: number, y: number }) => void,
		setCharIndex: (value: number) => void, creatingAnnotation: boolean
	}) => {
	const selection = window.getSelection();
	const textContentElement = textContentRef.current;

	if (creatingAnnotation) {
		return;
	}

	// check if the selection is valid (part of the text content)
	if (selection && selection.toString().length > 0 && textContentElement?.contains(selection.anchorNode)) {
		const range = selection.getRangeAt(0);
		const startContainer = range.startContainer.parentElement;
		const endContainer = range.endContainer.parentElement;

		// Function to find the closest div element
		const findClosestDiv = (element: HTMLElement | null): HTMLElement | null => {
			while (element && element.tagName !== 'DIV') {
				element = element.parentElement;
			}
			return element;
		};

		const containsAnnotationId = (element: HTMLElement | null): boolean => {
			if (!element) return false;
			return !!element.querySelector('#annotation');
		};

		const startDiv = findClosestDiv(startContainer);
		const endDiv = findClosestDiv(endContainer);

		// prevent the annotation button from appearing if the selection spans multiple elements
		if (startDiv === endDiv) {
			// check if the selected text is within an element with id "annotation"
			if (containsAnnotationId(startDiv)) {
				selection.removeAllRanges();
				setSelectedText('');
				return;
			}

			// check if the selected text is the same as the previously selected text
			if (selection.toString() === selectedText) {
				selection.removeAllRanges();
				setSelectedText('');
			} else {
				setSelectedText(selection.toString());
				if (startDiv) {
					const charIndex = getCharacterIndex(startDiv, range.startContainer, range.startOffset);
					setCharIndex(charIndex);

					// get bounding box of the text selection
					const rect = range.getBoundingClientRect();

					// calculate the center and set button position
					const middleX = rect.left + (rect.width / 2);
					const middleY = rect.top + (rect.height / 2);
					setButtonPosition({ x: middleX, y: middleY - 20 });
				}
			}
		} else {
			// clear the selection if it spans multiple elements
			selection.removeAllRanges();
			setSelectedText('');
		}
	} else {
		setSelectedText('');
	}
};

// get character index helper for annotation selection
const getCharacterIndex = (parentDiv: HTMLElement, startContainer: Node, startOffset: number): number => {
	let charIndex = 0;

	const traverseNodes = (node: Node): boolean => {
		if (node === startContainer) {
			charIndex += startOffset;
			return true;
		}

		if (node.nodeType === Node.TEXT_NODE) {
			charIndex += node.textContent?.length || 0;
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			for (let i = 0; i < node.childNodes.length; i++) {
				if (traverseNodes(node.childNodes[i])) {
					return true;
				}
			}
		}

		return false;
	};

	traverseNodes(parentDiv);
	return charIndex;
};

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
				{isLoggedIn && (
					<p>Good Morning, {userDetails.user.username} <LevelDisplay level={userDetails.user.levels[0]} /></p>
				)}
				{currentAnnotation && (
					<AnnotationModal setCurrentAnnotation={setCurrentAnnotation} currentAnnotation={currentAnnotation}
						currentLanguage={currentLanguage} currentText={currentText} textData={textData} />
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
											setCurrentText(textIndex);
											setCurrentTextID(textData[textIndex].text[0].id);
										}}>
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
