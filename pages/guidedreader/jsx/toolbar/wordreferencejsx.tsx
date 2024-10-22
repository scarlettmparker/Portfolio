import { useEffect, useRef, useState } from 'react';
import { ButtonWithAltText } from './fontsizejsx';
import { defineWord } from 'wordreference';
import styles from '../../styles/toolbar.module.css';
import indexstyles from '../../styles/index.module.css';

const DELAY = 100; // ensure not to spam requests
const DICTIONARY = "Greek-English";

const WordReferenceModal = ({ wordReferenceMenuVisible, setWordReferenceMenuVisible }: { wordReferenceMenuVisible: boolean, setWordReferenceMenuVisible: (value: boolean) => void }) => {
    let localStorageText = (typeof window !== 'undefined' ? localStorage.getItem('lastSelectedText') : '') || '';

    const [inputWord, setInputWord] = useState("");
    const [debouncedInputWord, setDebouncedInputWord] = useState("");
    const [definition, setDefinition] = useState<any>(null);

    useEffect(() => {
        setInputWord(localStorageText);
    }, [localStorageText])

    useEffect(() => {
        // ensure there's a delay before fetching the word (avoid spamming)
        const handler = setTimeout(() => {
            setDebouncedInputWord(inputWord);
        }, DELAY);

        return () => {
            clearTimeout(handler);
        };
    }, [inputWord]);

    useEffect(() => {
        const fetchWord = async () => {
            if (wordReferenceMenuVisible) {
                if (debouncedInputWord.trim() === "") {
                    setDefinition(null);
                } else {
                    // get the definition from wordreference
                    const definition = await defineWord(debouncedInputWord, DICTIONARY);
                    setDefinition(definition);
                }
            }
        };
        fetchWord();
    }, [debouncedInputWord]);

    // refs for wikt menu for defocusing
    const wordReferenceMenuRef = useRef<HTMLDivElement>(null);
    const wordReferenceButtonRef = useRef<HTMLButtonElement>(null);

    const toggleWordReferenceMenu = () => {
        setWordReferenceMenuVisible(!wordReferenceMenuVisible);
    };

    return (
        <div className={styles.fontSizeWrapper}>
            <ButtonWithAltText label="W" altText="Word Reference Look Up" onClick={toggleWordReferenceMenu} className={indexstyles.fontSizeButton} buttonRef={wordReferenceButtonRef} />
            {wordReferenceMenuVisible && (
                <div className={`${indexstyles.fontSizeMenu} ${styles.wordReferenceMenu}`} ref={wordReferenceMenuRef}>
                    <div className={styles.wordReferenceResultWrapper}>
                        <input type="text" placeholder="Search a word..." className={styles.wordReferenceSearchBar} value={inputWord} onChange={(e) => setInputWord(e.target.value)} />
                        <RenderDefinition definition={definition} />
                    </div>
                </div>
            )}
        </div>
    );
}

// render the definition data of the word
const isSectionEmpty = (section: any): boolean => {
    if (!section.translations || section.translations.length === 0) {
        return true;
    }
    return section.translations.every((translation: any) => {
        return !translation.word || !translation.word.word;
    });
};

const RenderDefinition = ({ definition }: { definition: any }) => {
    if (!definition) {
        return <p className={styles.wordReferencePreWord}>Search or select a word to find its definition.</p>;
    }

    if (!definition.inputWord || !definition.sections || definition.sections.length === 0) {
        return <p className={styles.wordReferencePreWord}>Word not found</p>;
    }
    
    const filteredSections = definition.sections.filter((section: any) => !isSectionEmpty(section));

    if (filteredSections.length === 0) {
        return <p className={styles.wordReferencePreWord}>Word not found</p>;
    }

    // find the first non-empty word.word
    let firstNonEmptyWord = '';
    for (const section of filteredSections) {
        for (const translation of section.translations) {
            if (translation.word && translation.word.word) {
                firstNonEmptyWord = translation.word.word;
                break;
            }
        }
        if (firstNonEmptyWord) break;
    }

    return (
        <div className={styles.wordReferenceAnswer}>
            <span className={styles.wordReferenceInputWord}>{firstNonEmptyWord}</span>
            {filteredSections.map((section: any, index: number) => (
                <div key={index}>
                    {section.title && <span className={styles.wordReferenceSectionTitle}>{section.title}</span>}
                    {section.translations.map((translation: any, tIndex: number) => (
                        <div key={tIndex}>
                            <div className={styles.wordReferenceDefinitionWrapper}>
                                {translation.definition && <><span className={styles.wordReferenceDefinition}>Definition:</span> {translation.definition}</>}
                                <div className={styles.wordReferenceTranslations}>
                                    {translation.meanings && translation.meanings.length > 0 && translation.meanings.map((meaning: any, mIndex: number) => (
                                        <span key={mIndex} className={styles.wordReferenceTranslatedWord}>{JSON.stringify(meaning.word).replace(/\\n/g, ' ')}</span>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.wordReferenceDefinitionWrapper}>
                                {translation.examples && translation.examples.length > 0 && translation.examples.map((example: any, eIndex: number) => (
                                    <div key={eIndex} className={styles.wordReferenceExampleWrapper}>
                                        {example.phrase && <><span className={styles.wordReferenceDefinition}>Phrase:</span> {example.phrase}</>}<br />
                                        {example.translations && example.translations.length > 0 && example.translations.map((exTranslation: any, exIndex: number) => (
                                            <span key={exIndex} className={styles.wordReferenceTranslatedWord}>{JSON.stringify(exTranslation).replace(/\\n/g, ' ')}</span>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {index < filteredSections.length - 1 && <hr />}
                </div>
            ))}
        </div>
    );
};

export default WordReferenceModal;