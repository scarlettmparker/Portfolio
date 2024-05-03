/*
Though I am aware that draggable elements exist, I implemented my own.
Despite the fact that I've used draggable elements before, I still made my own.
Why? I forgot they existed. I don't know why I did this. I'm sorry.
*/

import { useEffect, useState, useRef } from 'react';
import styles from './styles/play.module.css';
import Image from 'next/image';
import './styles/global.css';

export default function Play() {
    // keep track of game points
    const [gamePoints, setPoints] = useState<number>(0);
    const [totalPoints, setTotalPoints] = useState<number>(0);
    const [lettersWithoutMiddle, setLettersWithoutMiddle] = useState<string[]>([]);
    const [middleLetter, setMiddleLetter] = useState<string>("");
    const [currentWord, setCurrentWord] = useState<string>("");

    // filtered words are the words that are valid and can be formed with the given letters
    const [filteredWords, setFilteredWords] = useState<{ wordWithoutAccent: string, wordWithAccent: string }[]>([]);
    const [correctWords, setCorrectWords] = useState<{ wordWithoutAccent: string, wordWithAccent: string }[]>([]);
    const [showOverlay, setShowOverlay] = useState(false);
    
    // used to close the wrappers
    const [isWinWrapperVisible, setIsWinWrapperVisible] = useState(true);
    const [isSettingsWrapperVisible, setIsSettingsWrapperVisible] = useState(false);
    const greekAlphabet = ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ', 'Ι', 'Κ', 'Λ', 'Μ',
            'Ν', 'Ξ', 'Ο', 'Π', 'Ρ', 'Σ', 'Τ', 'Υ', 'Φ', 'Χ', 'Ψ', 'Ω'];
    const wordIssueRef = useRef(null);

    // different difficulties for display reasons
    const [difficulty, setDifficulty] = useState<number>(-1);
    const [tempDifficulty, setTempDifficulty] = useState<number>(-1);
        
    // used for dragging the settings wrapper
    const [dragging, setDragging] = useState(false);
    const [draggingElement, setDraggingElement] = useState<string | null>(null);

    // difference state to hold x and y difference coordinates
    const [diff, setDiff] = useState<{ [key: string]: { x: number, y: number } }>({
        element1: { x: 0, y: 0 },
        element2: { x: 0, y: 0 }
    });

    // initialize position state to hold the left and top positions for elements
    const [pos, setPos] = useState<{ [key: string]: { left: number, top: number } }>({
        element1: { left: 0, top: 200 },
        element2: { left: 0, top: 200 }
    });

    // ensure the current dragged element takes priority
    const [activeZIndex, setActiveZIndex] = useState<{ [key: string]: number }>({
        element1: 4,
        element2: 6
    });

    useEffect(() => {
        // get size of window
        let initialWindow = {
            width: window.innerWidth,
        };

        const updatePositions = () => {
            // get the ratio of the new window size to the initial window size
            const widthRatio = window.innerWidth / initialWindow.width;

            setPos(prevPos => ({
                // move the elements to their new positions based on the ratio
                element1: { 
                    left: prevPos.element1.left * widthRatio, 
                    top: prevPos.element1.top
                },
                element2: { 
                    left: prevPos.element2.left * widthRatio, 
                    top: prevPos.element2.top
                },
            }));

            // get the new window size
            initialWindow = {
                width: window.innerWidth,
            };
        }

        // set the initial position of the elements
        setPos({
            element1: { left: window.innerWidth / 2, top: 200 },
            element2: { left: window.innerWidth / 2, top: 200 },
        });

        window.addEventListener('resize', updatePositions);
        return () => {
            window.removeEventListener('resize', updatePositions);
        }
    }, []);
    
    // handle mouse dwn events
    const handleMouseDown = (key: string, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        setDragging(true);
        setDraggingElement(key);
        setDiff({ ...diff, [key]: { x: e.clientX - pos[key].left, y: e.clientY - pos[key].top } });

        // dragged element takes priority
        const newZIndex = Object.keys(activeZIndex).reduce((result, elementKey) => {
            result[elementKey] = elementKey === key ? 5 : 4;
            return result;
        }, {} as { [key: string]: number });
        setActiveZIndex(newZIndex);
        document.body.classList.add('dragging');
    }
    
    // handle mouse move events
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (dragging && draggingElement) {
            const left = e.clientX - diff[draggingElement].x;
            const top = e.clientY - diff[draggingElement].y;
            setPos({ ...pos, [draggingElement]: { left, top } });
        }
    }
    
    // stop dragging
    const handleMouseUp = () => {
        setDragging(false);
        setDraggingElement(null);
        document.body.classList.remove('dragging');
    }
    
    useEffect(() => {
        // handle mouse move events
        const handleMouseMove = (e: MouseEvent) => {
            if (dragging && draggingElement) {
                const left = e.clientX - diff[draggingElement].x;
                const top = e.clientY - diff[draggingElement].y;
                setPos({ ...pos, [draggingElement]: { left, top } });
            }
        }
    
        // stop dragging
        const handleMouseUp = () => {
            setDragging(false);
            setDraggingElement(null);
            document.body.classList.remove('dragging');
        }
    
        // Add mouse move and mouse up events to window
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    
        return () => {
            // Remove the events when the component unmounts
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
    }, [dragging, draggingElement, diff, pos]);

    function resetGame() {
        // remove game from local storage
        localStorage.removeItem('currentGame');
        // if in a browser environment, save difficulty to local storage
        if (typeof window !== 'undefined') {
            localStorage.setItem('difficulty', tempDifficulty.toString());
        }
        window.location.reload();
    }

    useEffect(() => {
        let storedDifficulty = localStorage.getItem('difficulty');
        let storedGame = localStorage.getItem('currentGame');

        // if difficulty doesn't exist, default to medium
        if (storedDifficulty === null || storedDifficulty === undefined || storedDifficulty === '') {
            storedDifficulty = '1';
            localStorage.setItem('difficulty', storedDifficulty);
        } if (storedGame === null || storedGame === undefined || storedGame === '') {
            // set up new game
            setDifficulty(Number(storedDifficulty));
            setTempDifficulty(Number(storedDifficulty));
            generateLetters(Number(storedDifficulty));
        } else {
            // get the game from local storage
            const parsedGame = JSON.parse(storedGame);
            // set up all this nonsense
            setDifficulty(Number(storedDifficulty));
            setTempDifficulty(Number(storedDifficulty));
            setLettersWithoutMiddle(parsedGame.lettersWithoutMiddle);
            setMiddleLetter(parsedGame.middleLetter);
            setFilteredWords(parsedGame.filteredWords);
            setCorrectWords(parsedGame.correctWords);
            setPoints(parsedGame.points);
            setTotalPoints(parsedGame.totalPoints);
        }
    }, []);

    // used for html garbage
    const difficultyMapping: { [key: number]: string } = {
        0: 'Εύκολη',
        1: 'Μέτρια',
        2: 'Δύσκολη',
        3: 'Πολύ Δύσκολη'
    };

    // depending on difficulty change colour :O
    const difficultyColorMapping = {
        0: '#1a67ed',
        1: '#11d63f',
        2: '#eb960e',
        3: '#d60f23',
    };

    // more html stuff + html INSIDE THE STRINGS WHATTT
    const descriptionMapping: { [key: number]: string } = {
        0: `8-20 λέξεις ανά παιχνίδι <i><font color='${difficultyColorMapping[0]}'>πολύ κοινές λέξεις</font></i>`,
        1: `20-40 λέξεις ανά παιχνίδι <i><font color='${difficultyColorMapping[1]}'>κοινές λέξεις</font></i>`,
        2: `40-60 λέξεις ανά παιχνίδι <i><font color='${difficultyColorMapping[2]}'>πολλές λέξεις</font></i>`,
        3: `60-120 λέξεις ανά παιχνίδι <i><font color='${difficultyColorMapping[3]}'>κάθε λέξη στο λεξικό</font></i>`
    }
        
    function handleDifficultyChange(e: React.ChangeEvent<HTMLSelectElement>) {
        setTempDifficulty(Number(e.target.value));
    }

    // used if english keyboard is activated
    const englishToGreekKeyMap = {
        'w': 'ς', 'e': 'ε', 'r': 'ρ', 't': 'τ', 'y': 'υ', 'u': 'θ', 'i': 'ι', 'o': 'ο', 'p': 'π',
        'a': 'α', 's': 'σ', 'd': 'δ', 'f': 'φ', 'g': 'γ', 'h': 'η', 'j': 'ξ', 'k': 'κ',
        'l': 'λ', 'z': 'ζ', 'x': 'χ', 'c': 'ψ', 'v': 'ω', 'b': 'β', 'n': 'ν', 'm': 'μ',
    };

    // show settings wrapper when clicked
    const showSettingsWrapper = () => {
        setIsSettingsWrapperVisible(prevState => !prevState)
        // z-index stuff because of course
        if (gamePoints === totalPoints && isWinWrapperVisible && totalPoints !== 0) {
            // bring settings wrapper to front
            const newZIndex = Object.keys(activeZIndex).reduce((result, elementKey) => {
                result[elementKey] = elementKey === 'element1' ? 5 : 4;
                return result;
            }, {} as { [key: string]: number });
            setActiveZIndex(newZIndex);
        }
    }
    // allow win wrapper to close
    const closeWinWrapper = () => {
        setIsWinWrapperVisible(false);
    };

    const closeSettingsWrapper = () => {
        setDifficulty(Number(localStorage.getItem('difficulty')));
        setIsSettingsWrapperVisible(false);
    }

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            // reload page if game is stuck
            if (lettersWithoutMiddle.length === 0) {
                window.location.reload();
            }
        }, 2500); // 2500 milliseconds = 2.5 seconds
    
        // cleanup function to clear the timeout if the component unmounts before 5 seconds
        return () => clearTimeout(timeoutId);
    }, [lettersWithoutMiddle]);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            let key = event.key.toLowerCase();
            // if keyboard is in english mode
            if (key in englishToGreekKeyMap) {
                key = englishToGreekKeyMap[key as keyof typeof englishToGreekKeyMap];
            }
            key = key.toUpperCase();
            if (key === 'BACKSPACE') {
                // remove letter
                setCurrentWord(currentWord.slice(0, -1));
            } else if (key === "ENTER") {
                submitWord();
            } else if (greekAlphabet.includes(key)){
                // allow user to type the word
                addLetter(key.toUpperCase());
            }
            if (key === 'ESCAPE') {
                // close highest z-index element
                const settingsZIndex = activeZIndex['element1'];
                const winZIndex = activeZIndex['element2'];

                const isSettingsVisible = isSettingsWrapperVisible;
                const isWinVisible = isWinWrapperVisible;

                if (isSettingsVisible && settingsZIndex > winZIndex) {
                    closeSettingsWrapper();
                } else if (isWinVisible) {
                    closeWinWrapper(); 
                } else if (isSettingsVisible) {
                    closeSettingsWrapper();
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [lettersWithoutMiddle, middleLetter, currentWord, activeZIndex, isSettingsWrapperVisible, isWinWrapperVisible]);

    // get points for each word
    function calculatePoints(word: string, lettersWithMiddle: string[]) {
        let points = word.length >= 5 ? word.length : 1;
        let pangram = false;
        const allLetters = lettersWithMiddle;
        // if word is a pangram
        if (allLetters.every(letter => word.includes(letter))) {
            points += 7;
            pangram = true;
        }
        return [points, pangram];
    }

    // get filtered words from the dictionary
    async function fetchFilteredWords(lettersWithMiddle: string[], invalidLetters: string[], middleLetter: string, difficulty: Number) {
        const response = await fetch(`/assets/spellbee/scripts/greek_dictionary_filtered_${difficulty}.txt`);
        const text = await response.text();
        // each word on new line
        const lines = text.split('\n');
        const words = lines.map(line => {
            // check against unaccented words, display accented
            const [wordWithoutAccent, wordWithAccent] = line.split(':');
            const points = calculatePoints(wordWithoutAccent, lettersWithMiddle.map(l => l));
            return { wordWithoutAccent, wordWithAccent, points: points[0], pangram: points[1] };
        }).filter(({ wordWithoutAccent }) => 
            // remove words if they contain invalid letters or don't contain the middle letter
            !invalidLetters.some(letter => wordWithoutAccent.includes(letter)) && 
            wordWithoutAccent.includes(middleLetter)
        );

        // get total possible points
        const totalPoints = words.reduce((sum, { points }) => sum + (typeof points === 'boolean' ? 0 : points), 0);
        setTotalPoints(totalPoints);
        setFilteredWords(words);
    }

    async function generateLetters(difficulty: Number) {
        // gets random line from the acceptable letter combinations
        const fileContent = await fetch(`/assets/spellbee/scripts/acceptable_letters_${difficulty}.txt`).then(response => response.text());
        const lines = fileContent.split('\n');
        const randomLine = lines[Math.floor(Math.random() * lines.length)];
        // convert to array
        const letters = randomLine.split('');

        const middle = letters[0];
        const lettersWithoutMiddle = letters.slice(1);

        // game initialization
        setPoints(0);
        setMiddleLetter(middle);
        setLettersWithoutMiddle(lettersWithoutMiddle);

        const lettersWithMiddle = [...lettersWithoutMiddle, middle];
        // invalid letters is alphabet minus letters
        const invalidLetters = greekAlphabet.filter(letter => !lettersWithMiddle.includes(letter));
        fetchFilteredWords(lettersWithMiddle, invalidLetters, middle, difficulty);
    }
    
    // when you click a letter, add it to the list
    function hexClick(index: number) {
        const newLetter = index === -1 ? middleLetter : lettersWithoutMiddle[index];
        setCurrentWord(prevWord => {
            const newWord = prevWord + newLetter;
            return newWord;
        });
    }

    // when you click a letter, add it to the list
    function addLetter(letter: string) {
        setCurrentWord(prevWord => {
            const newWord = prevWord + letter;
            return newWord;
        });
    }

    // remove last letter from current word
    function popLetter() {
        setCurrentWord(prevWord => {
            const newWord = prevWord.slice(0, -1);
            return newWord;
        });
    }

    // shuffle letters (visually)
    function shuffleLetters() {
        const shuffledLetters = [...lettersWithoutMiddle].sort(() => Math.random() - 0.5);
        setLettersWithoutMiddle(shuffledLetters);
        // shuffled letters also get added to local storage
        localStorage.setItem('currentGame', JSON.stringify({
            lettersWithoutMiddle: shuffledLetters,
            middleLetter,
            filteredWords,
            correctWords,
            points: gamePoints,
            totalPoints
        }));
    }

    function submitWord() {
        // return if word is valid and word information (points/pangram)
        let [isValid, issueWithWord, foundWord] = checkWord(currentWord) as [boolean, string,
            { wordWithoutAccent: string, wordWithAccent: string, points: number, pangram: boolean }];

        if (isValid) {
            if (gamePoints !== 0) {
                foundWord = { ...foundWord, wordWithAccent: `${foundWord.wordWithAccent.trimEnd()},\xa0` };
            }
            // increment points by number of points the word is worth
            setPoints(prevPoints => prevPoints + foundWord.points);
            // remove word so it can't be submitted again
            setFilteredWords(prevWords => prevWords.filter(({ wordWithoutAccent }) => wordWithoutAccent.toUpperCase() !== currentWord));
            setCorrectWords(prevWords => [foundWord, ...prevWords]);
            // save game state
            localStorage.setItem('currentGame', JSON.stringify({
                lettersWithoutMiddle,
                middleLetter,
                filteredWords,
                correctWords: [foundWord, ...correctWords],
                points: gamePoints + foundWord.points,
                totalPoints
            }));

            // default message for 4 letter words
            let feedbackMessage = "Σωστά!";

            if (foundWord.points == 5) {
                // nice!
                feedbackMessage = "Ωραία!";
            } else if (foundWord.points == 6) {
                // amazing!
                feedbackMessage = "Καταπληκτικά!";
            } else if (foundWord.points >= 7) {
                // perfect!
                feedbackMessage = "Τέλεια!";
            }

            if (foundWord.pangram) {
                // pangram!
                feedbackMessage = "Παντόγραμμα!";
            }

            createFeedbackDiv(`${feedbackMessage} +${foundWord.points}`, styles.successDiv);
        } else {
            createFeedbackDiv(issueWithWord, styles.issueDiv);
        }

        setCurrentWord("");
    }

    // response when submitting a word
    function createFeedbackDiv(text: string, className: string) {
        const feedbackDiv = document.createElement('div');
        // response message, success or fail
        feedbackDiv.textContent = text;
        feedbackDiv.className = className;

        if (wordIssueRef.current) {
            // add it to the reference div
            (wordIssueRef.current as HTMLElement).insertBefore(feedbackDiv, (wordIssueRef.current as HTMLElement).firstChild);
            setTimeout(() => {
                if (wordIssueRef.current) {
                    (wordIssueRef.current as HTMLElement).removeChild(feedbackDiv);
                }
            }, 3000); // appear only for 3 seconds
        }
    }

    // checks if word is valid
    function checkWord(word: string) {
        let issueWithWord = "";
        const foundWord = filteredWords.find(({ wordWithoutAccent }) => wordWithoutAccent === word);
        if (Array.from(word).some(char => ![...lettersWithoutMiddle, middleLetter].includes(char))) {
            // word contains a character not in lettersWithoutMiddle or middleLetter
            issueWithWord = "Μη αποδεκτή λέξη!";
        }
        else if (word.length < 4) {
            // word must have 4 or more letters
            issueWithWord = "Χρειάζονται 4+ γράμματα!";
        }
        else if (!word.includes(middleLetter)) {
            // doesn't have middle letter
            issueWithWord = "Λείπει το κεντρικό γράμμα!";
        } else if (!foundWord) {
            // word is not in the dictionary
            issueWithWord = "Μη αποδεκτή λέξη!";
        } else {
            return [true, "", foundWord];
        }
        return [false, issueWithWord, 0];
    }
    
    // getters
    function getLetter(index: number) {
        return lettersWithoutMiddle[index];
    }

    function getMiddleLetter() {
        return middleLetter;
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.experienceWrapper}>
                <div 
                    className={styles.settingsWrapper} 
                    style={{ 
                        visibility: isSettingsWrapperVisible ? 'visible' : 'hidden',
                        top: pos['element1'].top,
                        left: pos['element1'].left,
                        zIndex: activeZIndex['element1']
                    }}
                >
                    <div 
                        className={styles.settingsTopSection}
                        onMouseDown={(e) => handleMouseDown('element1', e)}
                        onMouseMove={(e) => handleMouseMove(e)}
                        onMouseUp={handleMouseUp}
                    >
                        Ρυθμίσεις
                        <div className={styles.closeButton} onClick={closeSettingsWrapper}>
                            X
                        </div>
                    </div>
                    <div className={styles.settingsContent}>
                        <div className={styles.settingsDifficulty}>
                            Δυσκολία: 
                            <select value={tempDifficulty} className={styles.difficultyDropDown} onChange={handleDifficultyChange}>
                                <option value={0}>{difficultyMapping[0]}</option>
                                <option value={1}>{difficultyMapping[1]}</option>
                                <option value={2}>{difficultyMapping[2]}</option>
                                <option value={3}>{difficultyMapping[3]}</option>
                            </select> 
                        </div>
                        <div className={styles.settingsDescription}>
                            <div dangerouslySetInnerHTML={{ __html: descriptionMapping[tempDifficulty]}}></div>
                        </div>
                        <button className={`${styles.button} ${styles.applyButton}`} onClick={() => resetGame()}>
                            Νέο Παιχνίδι
                        </button>
                    </div>
                </div>
                <div 
                    className={styles.winWrapper} 
                    style={{ 
                        visibility: (gamePoints === totalPoints && isWinWrapperVisible && totalPoints !== 0) ? 'visible' : 'hidden',
                        top: pos['element2'].top,
                        left: pos['element2'].left,
                        zIndex: activeZIndex['element2']
                    }}
                >
                    <div 
                        className={styles.winTopSection}
                        onMouseDown={(e) => handleMouseDown('element2', e)}
                        onMouseMove={(e) => handleMouseMove(e)}
                        onMouseUp={handleMouseUp}
                    >
                        Είσαι ιδυιοφυΐα!
                        <div className={styles.closeButton} onClick={closeWinWrapper}>
                            X
                        </div>
                    </div>
                    <div className={styles.winMessage}>
                        βρήκες όλες τις λέξεις!<br />
                        🏆 <br /><br />
                        <b>Στατιστικά:</b><br />
                        Λέξεις: {correctWords.length}/{correctWords.length}<br />
                        Δυσκολία: <span style={{ color: difficultyColorMapping[difficulty as keyof typeof difficultyColorMapping] }}>
                            <i>{difficultyMapping[difficulty]}</i><br />
                        </span>
                    </div>
                    <button className={`${styles.button} ${styles.applyButtonWin}`} onClick={() => resetGame()}>
                            Νέο Παιχνίδι
                    </button>
                </div>
                <div className={styles.pointsWrapper}>
                    <div className={styles.points}>
                        Έχεις <b>{gamePoints} / {totalPoints}</b> πόντους
                    </div>
                </div>
                <div className={styles.correctWordsWrapper} onClick={() => setShowOverlay(true)}>
                    <div className={styles.correctWord}>
                        {gamePoints > 0 && correctWords.map(({ wordWithAccent }, index) => (
                            <span key={wordWithAccent}>
                                {wordWithAccent}{index < correctWords.length - 1} 
                            </span>
                        ))}
                        {gamePoints == 0 && <span className={styles.fadedText}>Λέξεις...</span>}
                    </div>
                    {showOverlay && (
                        <div className={styles.overlayWords} onClick={(e) => { e.stopPropagation(); setShowOverlay(false); }}>
                            Έχεις βρει <b>{correctWords.length}</b> λέξεις!
                            <br></br>
                            <div className={`${styles.overlayWordsList} ${gamePoints > 0 ? 'overlayWordsListPadding' : ''}`}>
                                {correctWords.map(({ wordWithAccent }, index) => (
                                    <span key={wordWithAccent}>
                                        {wordWithAccent}{index < correctWords.length - 1} 
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className={styles.wordIssueRef} ref={wordIssueRef}>

                </div>
                    <div className={styles.currentWord}>
                        {currentWord.split('').map((letter, index) => {
                            let color;
                            if (letter === middleLetter) {
                                color = '#2d83cc';
                            } else if (lettersWithoutMiddle.includes(letter)) {
                                color = 'inherit';
                            } else {
                                color = 'rgb(170, 170, 170)';
                            }
                            return (
                                <span key={index} style={{ color: color }}>
                                    {letter}
                                </span>
                            );
                        })}
                    </div>
                <div className={styles.gameWrapper}>
                    <div className={styles.gameGrid}>  
                        {[0, 1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={`${styles[`div${i}`]} ${styles.divHex}`} onClick={() => hexClick(i)}>
                                {getLetter(i)}
                            </div>
                        ))}
                        <div className={`${styles.centerDiv} ${styles.divHex}`} onClick={() => hexClick(-1)}>
                            {getMiddleLetter()}
                        </div>
                    </div>
                </div>
                <div className={styles.buttonWrapper}>
                    <button className={styles.button} onClick={() => popLetter()}>Διαγραφή</button>
                    <button className={`${styles.button} ${styles.shuffleButton}`} onClick={() => shuffleLetters()}>
                        <Image src="/assets/spellbee/images/shuffle.png" alt="Shuffle" width={22} height={22}/>
                    </button>
                    <button className={styles.button} onClick={() => submitWord()}>Καταχώρηση</button>
                </div>
                    <button 
                        className={`${styles.button} ${styles.settingsButton}`} 
                        onClick={() => showSettingsWrapper()}>
                            <Image src="/assets/spellbee/images/settings.png" alt="Settings" width={22} height={22}/>
                    </button>
            </div>
        </div>
    );
}