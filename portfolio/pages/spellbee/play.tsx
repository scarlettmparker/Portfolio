import { useEffect, useState } from 'react';
import styles from './styles/play.module.css'
import React, { useRef } from 'react';

export default function Play() {
    // keep track of game points
    const [gamePoints, setPoints] = useState<number>(0);
    const [lettersWithoutMiddle, setLettersWithoutMiddle] = useState<string[]>([]);
    const [middleLetter, setMiddleLetter] = useState<string>("");
    const [currentWord, setCurrentWord] = useState<string>("");
    // filtered words are the words that are valid and can be formed with the given letters
    const [filteredWords, setFilteredWords] = useState<{ wordWithoutAccent: string, wordWithAccent: string }[]>([]);
    const [correctWords, setCorrectWords] = useState<{ wordWithoutAccent: string, wordWithAccent: string }[]>([]);
    const [showOverlay, setShowOverlay] = useState(false);

    const greekAlphabet = ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ', 'Ι', 'Κ', 'Λ', 'Μ',
            'Ν', 'Ξ', 'Ο', 'Π', 'Ρ', 'Σ', 'Τ', 'Υ', 'Φ', 'Χ', 'Ψ', 'Ω'];
    const wordIssueRef = useRef(null);

    // ensure that the game is reset when the component is mounted
    useEffect(() => {
        generateLetters();
    }, []);

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
    async function fetchFilteredWords(lettersWithMiddle: string[], invalidLetters: string[], middleLetter: string) {
        const response = await fetch('/assets/greek_dictionary_filtered.txt');
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
        setFilteredWords(words);
        console.log(words);
    }

    async function generateLetters() {
        // gets random line from the acceptable letter combinations
        const fileContent = await fetch('/assets/acceptable_letters.txt').then(response => response.text());
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
        fetchFilteredWords(lettersWithMiddle, invalidLetters, middle);
    }
    
    // when you click a letter, add it to the list
    function hexClick(index: number) {
        const newLetter = index === -1 ? middleLetter : lettersWithoutMiddle[index];
        setCurrentWord(prevWord => {
            const newWord = prevWord + newLetter;
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
                feedbackMessage = "Πάνγκραμ!";
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
            wordIssueRef.current.insertBefore(feedbackDiv, wordIssueRef.current.firstChild);
            setTimeout(() => {
                if (wordIssueRef.current) {
                    wordIssueRef.current.removeChild(feedbackDiv);
                }
            }, 3000); // appear only for 3 seconds
        }
    }

    // checks if word is valid
    function checkWord(word: string) {
        let issueWithWord = "";
        const foundWord = filteredWords.find(({ wordWithoutAccent }) => wordWithoutAccent === word);
        if (word.length < 4) {
            // word must have 4 or more letters
            issueWithWord = "Χρειάζονται 4+ γράμματα!";
            return [false, issueWithWord, 0];
        }
        if (!word.includes(middleLetter)) {
            // doesn't have middle letter
            issueWithWord = "Λείπει το κεντρικό γράμμα!";
            return [false, issueWithWord, 0];
        }
        if (!foundWord) {
            // word is not in the dictionary
            issueWithWord = "Μη αποδεκτή λέξη!";
            return [false, issueWithWord, 0];
        }

        return [true, "", foundWord];
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
                    {currentWord}
                </div>
                <div className={styles.gameWrapper}>
                    <div className={styles.gameGrid}>  
                        <div className={`${styles.div0} ${styles.divHex}`} onClick={() => hexClick(0)}>
                            {getLetter(0)}
                        </div>
                        <div className={`${styles.div1} ${styles.divHex}`} onClick={() => hexClick(1)}>
                            {getLetter(1)}
                        </div>
                        <div className={`${styles.div2} ${styles.divHex}`} onClick={() => hexClick(2)}>
                            {getLetter(2)}
                        </div>
                        <div className={`${styles.centerDiv} ${styles.divHex}`} onClick={() => hexClick(-1)}>
                            {getMiddleLetter()}
                        </div>
                        <div className={`${styles.div3} ${styles.divHex}`} onClick={() => hexClick(3)}>
                            {getLetter(3)}
                        </div>
                        <div className={`${styles.div4} ${styles.divHex}`} onClick={() => hexClick(4)}>
                            {getLetter(4)}
                        </div>
                        <div className={`${styles.div5} ${styles.divHex}`} onClick={() => hexClick(5)}>
                            {getLetter(5)}
                        </div>
                    </div>
                </div>
                <div className={styles.buttonWrapper}>
                    <button className={styles.button} onClick={() => popLetter()}>
                        Διαγραφή
                    </button>
                    <button className={`${styles.button} ${styles.buttonShuffle}`} onClick={() => shuffleLetters()}>
                        S
                    </button>
                    <button className={styles.button} onClick={() => submitWord()}>
                        Καταχώρηση
                    </button>
                </div>
            </div>
        </div>
    );
}