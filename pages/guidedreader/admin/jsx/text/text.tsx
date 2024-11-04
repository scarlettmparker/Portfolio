import { useEffect, useState } from "react";
import { changeTextLevel, fetchAllTexts, fetchTextData, handleDeleteText } from "../../utils/text/textutils";
import ChangeListButton from "../listbutton";
import styles from '../../styles/admin.module.css';
import levels from '../../../data/roles_texts.json';
import Sidebar from "../sidebar";

// text detail component
const TextDetail = ({ currentText, handleBack }: { currentText: any; handleBack: () => void; userPermissions: string[]; parentKey: string; setCurrentPermission: (value: string) => void }) => {
    return (
        <div>
            <button onClick={handleBack}>Back</button>
            <div>{currentText.title}</div>
            <div>{currentText.level}</div>

        </div>
    );
};

const Text = ({ userPermissions }: { userPermissions: string[] }) => {
    const [pageIndex, setPageIndex] = useState(0);
    const [currentPermission, setCurrentPermission] = useState<string>('');
    const [changeLevelMenu, setChangeLevelMenu] = useState<boolean>(false);

    // text stuff
    const [texts, setTexts] = useState<any[]>([]);
    const [currentText, setCurrentText] = useState<any>(null);
    const [allSelectedTexts, setAllSelectedTexts] = useState<any[]>([]);

    const [numTexts, setNumTexts] = useState(0);
    const [searchInput, setSearchInput] = useState('');

    const parentKey = 'text';

    useEffect(() => {
        currentText && setAllSelectedTexts([currentText]);
    }, [currentText]);

    // get list of text for text data
    useEffect(() => {
        fetchAllTexts(setNumTexts, searchInput);
        fetchTextData(pageIndex, setTexts, searchInput);
    }, [pageIndex, searchInput]);

    const handleBack = () => {
        if (currentText) {
            setCurrentText(null);
        }
    }

    useEffect(() => {
        switch (currentPermission) {
            case 'text.changeTextLevel':
                setChangeLevelMenu(!changeLevelMenu);
                break;
            case 'text.editText':
                break;
            case 'text.deleteText':
                // delete depending on texts selected
                handleDeleteText(allSelectedTexts.map(text => text.id));
                break;
            case 'text.addVoiceOver':
                break;
            default:
                break;
        }
    }, [currentPermission]);

    return (
        <>
            {Array.isArray(userPermissions) ? (
                <Sidebar userPermissions={userPermissions} parentKey={parentKey} setCurrentPermission={setCurrentPermission} />)
            : null}
            {currentText && (
                <TextDetail currentText={currentText} handleBack={handleBack} userPermissions={userPermissions} parentKey={parentKey} setCurrentPermission={setCurrentPermission} />
            )}
            {!currentText && (
                <TextList texts={texts} setAllSelectedTexts={setAllSelectedTexts} onTextSelect={setCurrentText} pageIndex={pageIndex} setPageIndex={setPageIndex} numTexts={numTexts} setSearchInput={setSearchInput} />
            )}
            {changeLevelMenu && (
                <ChangeLevel allSelectedTexts={allSelectedTexts} />
            )}
        </>
    );
}

// change level component
const ChangeLevel = ({ allSelectedTexts }: { allSelectedTexts: any[] }) => {
    const level = allSelectedTexts[0]?.level;

    const currentLevelIndex = levels.findIndex(l => l.shortname === level);
    const [levelIndex, setLevelIndex] = useState(currentLevelIndex);

    // handle changing the text level
    const handleNextLevel = () => {
        setLevelIndex((prevIndex) => (prevIndex + 1) % levels.length);
    };

    const handlePrevLevel = () => {
        setLevelIndex((prevIndex) => (prevIndex - 1 + levels.length) % levels.length);
    };

    // change levels either bulk or regular
    const handleChangeLevel = () => {
        const ids = allSelectedTexts.map(text => text.id);
        changeTextLevel(ids, levels[levelIndex].shortname as unknown as number);
    };

    return (
        <div>
            <button onClick={handlePrevLevel}>Previous Level</button>
            <span>{levels[levelIndex].shortname}</span>
            <button onClick={handleNextLevel}>Next Level</button>
            <button onClick={handleChangeLevel}>Change Level</button>
        </div>
    );
};

// text list component containing all texts (still not styled!!!)
export const TextList = ({ texts, setAllSelectedTexts, onTextSelect, handleBack, pageIndex, setPageIndex, numTexts, setSearchInput }: {
    texts: any[]; setAllSelectedTexts?: (texts: any[]) => void; onTextSelect: (text: any) => void; handleBack?: () => void; pageIndex: number; setPageIndex: (value: number) => void; numTexts: number; setSearchInput: (value: string) => void;
}) => {
    const [selectedTexts, setSelectedTexts] = useState<any[]>([]);


    useEffect(() => {
        if (setAllSelectedTexts) {
            setAllSelectedTexts(selectedTexts);
        }
    }, [selectedTexts, setAllSelectedTexts]);

    // handle select all
    const handleSelectAll = () => {
        if (selectedTexts.length === texts.length) {
            setSelectedTexts([]);
        } else {
            setSelectedTexts(texts);
        }
    };

    // handle checkbox change, idk why i've done this differently but ok
    const handleCheckboxChange = (text: any) => {
        if (selectedTexts.includes(text)) {
            setSelectedTexts(selectedTexts.filter(t => t !== text));
        } else {
            setSelectedTexts([...selectedTexts, text]);
        }
    };

    return (
        <div className={styles.allTextsWrapper}>
            {handleBack && <button onClick={handleBack}>Back</button>}
            <div className={styles.searchBarWrapper}>
                <input type="text" placeholder="Search texts..." className={styles.searchBar} onChange={(e) => setSearchInput(e.target.value)} />
            </div>
            {setAllSelectedTexts && (
                <div>
                    <input type="checkbox" checked={selectedTexts.length === texts.length} onChange={handleSelectAll} />
                    <label>Select All/Deselect All</label>
                </div>
            )}
            {texts.map((text, index) => (
                <div className={styles.individualTextWrapper} key={index}>
                    {setAllSelectedTexts && (
                        <input type="checkbox" checked={selectedTexts.includes(text)} onChange={() => handleCheckboxChange(text)} />
                    )}
                    <span className={styles.textSelectMenu} onClick={() => onTextSelect(text)}>{text.title + " (" + text.language + ")"}</span>
                </div>
            ))}
            <ChangeListButton direction="left" pageIndex={pageIndex} setPageIndex={setPageIndex} numUsers={numTexts} />
            <ChangeListButton direction="right" pageIndex={pageIndex} setPageIndex={setPageIndex} numUsers={numTexts} />
            {pageIndex + "/" + numTexts}
        </div>
    );
};

export default Text;