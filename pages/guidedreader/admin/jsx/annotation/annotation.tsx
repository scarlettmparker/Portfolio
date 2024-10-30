import ChangeListButton from "../listbutton";
import styles from "../../styles/admin.module.css";
import { useEffect, useRef, useState } from "react";
import { fetchAllAnnotations, fetchNumAnnotations } from "../../utils/annotation/annotationutils";
import Sidebar from "../sidebar";
import { fetchAllTexts, fetchTextData } from "../../utils/text/textutils";

// handle clearing annotations
const clearAnnotations = (setNumAnnotations: (value: number) => void, setAnnotations: (value: any[]) => void) => {
    setNumAnnotations(0);
    setAnnotations([]);
};

// handle clearing texts
const clearTexts = (setNumTexts: (value: number) => void, setTexts: (value: any[]) => void) => {
    setNumTexts(0);
    setTexts([]);
};

// reset page index and clear data when switching menus
const changeMenus = (setPageIndex: (value: number) => void, clearTexts: () => void, clearAnnotations: () => void) => {
    setPageIndex(0);
    clearTexts();
    clearAnnotations();
};

// component for the main menu
const MainMenu = ({ handleAllTexts, handleAllAnnotations }: { handleAllTexts: () => void; handleAllAnnotations: () => void }) => (
    <div className={styles.mainMenu}>
        <span className={styles.annotationSelectMenu} onClick={handleAllTexts}>View Annotations by Text</span>
        <span className={styles.annotationSelectMenu} onClick={handleAllAnnotations}>View All Annotations</span>
    </div>
);

// component for displaying text list
const TextList = ({
    texts, onTextSelect, handleBack, pageIndex, setPageIndex, numTexts
}: {
    texts: any[]; onTextSelect: (text: any) => void; handleBack: () => void; pageIndex: number; setPageIndex: (value: number) => void; numTexts: number;
}) => (
    <div className={styles.allTextsWrapper}>
        <button onClick={handleBack}>Back</button>
        {texts.map((text, index) => (
            <div className={styles.individualTextWrapper} key={index}>
                <span className={styles.textSelectMenu} onClick={() => onTextSelect(text)}>{text.title}</span>
            </div>
        ))}
        <ChangeListButton direction="left" pageIndex={pageIndex} setPageIndex={setPageIndex} numUsers={numTexts} />
        <ChangeListButton direction="right" pageIndex={pageIndex} setPageIndex={setPageIndex} numUsers={numTexts} />
        {pageIndex + "/" + numTexts}
    </div>
);

// component for displaying individual text view
const TextDetail = ({ currentText, handleBack, userPermissions, parentKey, setCurrentPermission }: {
    currentText: any; handleBack: () => void; userPermissions: string[]; parentKey: string; setCurrentPermission: (value: string) => void;
}) => {
    const [annotations, setAnnotations] = useState<any[]>([]);
    useEffect(() => {
        // fetch annotations for the current text
        fetchAllAnnotations(currentText.id, setAnnotations);
    }, [currentText]);

    useEffect(() => {
        console.log(annotations);
    }, [annotations]);

    return (
        <>
            <Sidebar userPermissions={userPermissions} parentKey={parentKey} setCurrentPermission={setCurrentPermission} />
            <div className={styles.individualTextWrapper}>
                <button onClick={handleBack}>Back</button>
                <span className={styles.textSelectMenu}>{currentText.title}</span>
                <span className={styles.textSelectMenu}>{currentText.level}</span>
            </div>
        </>
    );
};

const Annotation = ({ userPermissions }: { userPermissions: string[] }) => {
    const [pageIndex, setPageIndex] = useState(0);
    const [currentPermission, setCurrentPermission] = useState<string>('');

    // annotation stuff
    const [viewAnnotations, setViewAnnotations] = useState(false);
    const [annotations, setAnnotations] = useState<any[]>([]);
    const [numAnnotations, setNumAnnotations] = useState(0);

    // text stuff
    const [viewTexts, setViewTexts] = useState(false);
    const [texts, setTexts] = useState<any[]>([]);
    const [currentText, setCurrentText] = useState<any>(null);
    const [numTexts, setNumTexts] = useState(0);

    const parentKey = 'annotation';
    const isInitialRender = useRef(true);

    // ensure texts are fetched when the page index changes
    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }
        viewTexts && fetchTextData(pageIndex, setTexts);
    }, [pageIndex]);

    useEffect(() => {
        switch (currentPermission) {
            case 'annotation.deleteAnnotation':
                // handle delete annotation
                break;
            case 'annotation.editAnnotation':
                // handle edit annotation
                break;
            default:
                break;
        }
    }, [currentPermission]);

    // fetch all annotations
    const handleAllAnnotations = () => {
        changeMenus(setPageIndex, () => clearTexts(setNumTexts, setTexts), () => clearAnnotations(setNumAnnotations, setAnnotations));
        setViewAnnotations(true);
        fetchNumAnnotations(setNumAnnotations);
    };

    // fetch all texts based on page index
    const handleAllTexts = () => {
        changeMenus(setPageIndex, () => clearTexts(setNumTexts, setTexts), () => clearAnnotations(setNumAnnotations, setAnnotations));
        setViewTexts(true);
        fetchAllTexts(setNumTexts);
        fetchTextData(pageIndex, setTexts);
    };

    // handle back button
    const handleBack = () => {
        if (currentText) {
            setCurrentText(null);
        } else {
            changeMenus(setPageIndex, () => clearTexts(setNumTexts, setTexts), () => clearAnnotations(setNumAnnotations, setAnnotations));
            setViewAnnotations(false);
            setViewTexts(false);
        }
    };

    return (
        <div>
            <div className={styles.annotationHeader}>
                {!viewAnnotations && !viewTexts && !currentText && (
                    <MainMenu handleAllTexts={handleAllTexts} handleAllAnnotations={handleAllAnnotations} />
                )}
                {viewTexts && !currentText && (
                    <TextList texts={texts} onTextSelect={setCurrentText} handleBack={handleBack}
                        pageIndex={pageIndex} setPageIndex={setPageIndex} numTexts={numTexts} />
                )}
                {currentText && (
                    <TextDetail currentText={currentText} handleBack={handleBack} userPermissions={userPermissions}
                        parentKey={parentKey} setCurrentPermission={setCurrentPermission} />
                )}
            </div>
        </div>
    );
};

export default Annotation;
