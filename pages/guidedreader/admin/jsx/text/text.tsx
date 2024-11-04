import { useEffect, useState } from "react";
import { addVTTtoText, changeTextGroup, changeTextLevel, fetchAllTexts, fetchTextData, getTextGroups, handleDeleteText } from "../../utils/text/textutils";
import ChangeListButton from "../listbutton";
import styles from '../../styles/admin.module.css';
import textstyles from '../../styles/text.module.css';
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
    const [groups, setGroups] = useState<any[]>([]);

    // other menus yayy
    const [changeLevelMenu, setChangeLevelMenu] = useState<boolean>(false);
    const [changeGroupMenu, setChangeGroupMenu] = useState<boolean>(false);
    const [addVTTMenu, setAddVTTMenu] = useState<boolean>(false);

    // text stuff
    const [texts, setTexts] = useState<any[]>([]);
    const [currentText, setCurrentText] = useState<any>(null);
    const [allSelectedTexts, setAllSelectedTexts] = useState<any[]>([]);

    const [numTexts, setNumTexts] = useState(0);
    const [searchInput, setSearchInput] = useState('');

    const parentKey = 'text';

    useEffect(() => {
        if (groups.length === 0) {
            getTextGroups(setGroups);
        }
    })

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
        setAddVTTMenu(false);
    }

    useEffect(() => {
        if (allSelectedTexts.length === 0) {
            return;
        }
        switch (currentPermission) {
            case 'text.changeTextGroup':
                setChangeGroupMenu(!changeGroupMenu);
                break;
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
                if (allSelectedTexts.length > 1) return;
                setAddVTTMenu(!addVTTMenu);
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
            {addVTTMenu && (
                <AddVTT allSelectedTexts={allSelectedTexts} />
            )}
            {changeGroupMenu && (
                <ChangeGroup groups={groups} allSelectedTexts={allSelectedTexts} />
            )}
        </>
    );
}

// change the text group of a text
const ChangeGroup = ({ groups, allSelectedTexts }: { groups: any[]; allSelectedTexts: any[] }) => {
    const currentGroupIndex = 0;
    const [groupIndex, setGroupIndex] = useState(currentGroupIndex);

    const handleNextGroup = () => {
        setGroupIndex((prevIndex) => (prevIndex + 1) % groups.length);
    };

    const handlePrevGroup = () => {
        setGroupIndex((prevIndex) => (prevIndex - 1 + groups.length) % groups.length);
    };

    // change the text group
    const handleChangeGroup = () => {
        const ids = allSelectedTexts.map(text => text.id);
        changeTextGroup(ids, groups[groupIndex].id);
    };

    return (
        <div>
            {groups.length !== 0 && (
                <>
                    <button onClick={handlePrevGroup}>Previous Group</button>
                    <span>{groups[groupIndex].id} | {groups[groupIndex].groupName}</span>
                    <button onClick={handleNextGroup}>Next Group</button>
                    <button onClick={handleChangeGroup}>Change Group</button>
                </>
            )}
        </div>
    );
};


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

// add a vtt file to a text
const AddVTT = ({ allSelectedTexts }: { allSelectedTexts: any[] }) => {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [vttFile, setVttFile] = useState<File | null>(null);

    const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAudioFile(e.target.files[0]);
        }
    };

    const handleVttFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setVttFile(e.target.files[0]);
        }
    };

    // handle submitting the audio and vtt files
    const handleSubmit = () => {
        if (audioFile && vttFile) {
            addVTTtoText(allSelectedTexts[0].id, audioFile, vttFile);
        } else {
            alert('Please select both an audio file and a VTT file.');
        }
    };

    return (
        <div className={textstyles.vttSubmit}>
            <label>Audio File</label>
            <input type="file" accept="audio/*" onChange={handleAudioFileChange} />
            <label>VTT File</label>
            <input type="file" accept=".vtt" onChange={handleVttFileChange} />
            <button onClick={handleSubmit}>Submit</button>
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
        <div className={textstyles.allTextsWrapper}>
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
            <div className={textstyles.textList}>
                {texts.map((text, index) => (
                    <div className={styles.individualTextWrapper} key={index}>
                        {setAllSelectedTexts && (
                            <input type="checkbox" checked={selectedTexts.includes(text)} onChange={() => handleCheckboxChange(text)} />
                        )}
                        <span className={styles.textSelectMenu} onClick={() => onTextSelect(text)}>{text.title + " (" + text.language + ")"}</span>
                    </div>
                ))}
            </div>
            <ChangeListButton direction="left" pageIndex={pageIndex} setPageIndex={setPageIndex} numUsers={numTexts} />
            <ChangeListButton direction="right" pageIndex={pageIndex} setPageIndex={setPageIndex} numUsers={numTexts} />
            {pageIndex + "/" + numTexts}
        </div>
    );
};

export default Text;