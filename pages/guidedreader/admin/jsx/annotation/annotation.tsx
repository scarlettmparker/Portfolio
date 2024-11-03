import ChangeListButton from "../listbutton";
import styles from "../../styles/admin.module.css";
import { useEffect, useRef, useState } from "react";
import { editAnnotation, fetchAllAnnotations, fetchNumAnnotations, handleDeleteAnnotationAdmin } from "../../utils/annotation/annotationutils";
import Sidebar from "../sidebar";
import { fetchAllTexts, fetchTextData } from "../../utils/text/textutils";
import { WritingAnnotationModal } from "@/pages/guidedreader/jsx/text/annotationjsx";
import { hideAnnotationAnimation } from "@/pages/guidedreader/utils/annotation/annotationutils";

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
    texts, onTextSelect, handleBack, pageIndex, setPageIndex, numTexts, setSearchInput
}: {
    texts: any[]; onTextSelect: (text: any) => void; handleBack: () => void; pageIndex: number; setPageIndex: (value: number) => void; numTexts: number; setSearchInput: (value: string) => void;
}) => {
    return (
        <div className={styles.allTextsWrapper}>
            <button onClick={handleBack}>Back</button>
            <div className={styles.searchBarWrapper}>
                <input type="text" placeholder="Search texts..." className={styles.searchBar} onChange={(e) => setSearchInput(e.target.value)} />
            </div>
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
};

// component for displaying individual text view
const TextDetail = ({ currentText, handleBack, userPermissions, parentKey, setCurrentPermission, annotations, setAnnotations, selectedAnnotations, setSelectedAnnotations }: {
    currentText: any; handleBack: () => void; userPermissions: string[]; parentKey: string; setCurrentPermission: (value: string) => void; annotations: any[]; setAnnotations: (value: any[]) => void; selectedAnnotations: Set<[number, number]>; setSelectedAnnotations: (value: Set<[number, number]> | ((prev: Set<[number, number]>) => Set<[number, number]>)) => void;
}) => {
    useEffect(() => {
        // fetch annotations for the current text
        fetchAllAnnotations(currentText.id, setAnnotations);
    }, [currentText]);

    useEffect(() => {
        if (annotations.length > 0) {
            setAnnotations(annotations);
        }
    }, [annotations]);

    const handleSelectAnnotation = (id: number, textId: number) => {
        setSelectedAnnotations((prev: Set<[number, number]>) => {
            // toggle the selected annotation
            const selected = new Set(prev);
            const annotationTuple: [number, number] = [id, textId];
            let found = false;
            selected.forEach((value) => {
                if (value[0] === id && value[1] === textId) {
                    found = true;
                    selected.delete(value);
                }
            });
            !found && selected.add(annotationTuple);
            return selected;
        });
    };

    // select all annotations
    const handleSelectAll = () => {
        setSelectedAnnotations(new Set(annotations.map(annotation => [annotation.id, annotation.textId])));
    };

    // unselect all annotations
    const handleUnselectAll = () => {
        setSelectedAnnotations(new Set());
    };

    return (
        <>
            <Sidebar userPermissions={userPermissions} parentKey={parentKey} setCurrentPermission={setCurrentPermission} />
            <div className={styles.individualTextWrapper}>
                <button onClick={handleBack}>Back</button>
                <span className={styles.textSelectMenu}>{currentText.title}</span>
                <span className={styles.textSelectMenu}>{currentText.level}</span>
            </div>
            <div className={styles.annotationListWrapper}>
                <div>
                    <input type="checkbox" onChange={handleSelectAll} checked={selectedAnnotations.size === annotations.length} /> Select All
                    <input type="checkbox" onChange={handleUnselectAll} checked={selectedAnnotations.size === 0} /> Unselect All
                </div>
                {annotations.map((annotation) => (
                    <div key={annotation.id} className={styles.annotationItem}>
                        <input type="checkbox"
                            checked={Array.from(selectedAnnotations).some(([selectedId, selectedTextId]) => selectedId === annotation.id && selectedTextId === annotation.textId)}
                            onChange={() => handleSelectAnnotation(annotation.id, annotation.textId)} />
                        {annotation.description}
                    </div>
                ))}
            </div>
        </>
    );
};

// main annotation component
const Annotation = ({ userPermissions, setCurrentAnnotation, setCreatingAnnotation }:
    { userPermissions: string[], setCurrentAnnotation: (value: any) => void, setCreatingAnnotation: (value: boolean) => void }) => {
    const [pageIndex, setPageIndex] = useState(0);
    const [currentPermission, setCurrentPermission] = useState<string>('');

    // annotation stuff
    const [viewAnnotations, setViewAnnotations] = useState(false);
    const [annotations, setAnnotations] = useState<any[]>([]);
    const [numAnnotations, setNumAnnotations] = useState(0);
    const [selectedAnnotations, setSelectedAnnotations] = useState<Set<[number, number]>>(new Set());

    // text stuff
    const [viewTexts, setViewTexts] = useState(false);
    const [texts, setTexts] = useState<any[]>([]);
    const [currentText, setCurrentText] = useState<any>(null);
    const [numTexts, setNumTexts] = useState(0);
    const [searchInput, setSearchInput] = useState('');

    const parentKey = 'annotation';
    const isInitialRender = useRef(true);

    // ensure texts are fetched when the page index changes
    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }
        viewTexts && fetchAllTexts(setNumTexts, searchInput);
        viewTexts && fetchTextData(pageIndex, setTexts, searchInput);
    }, [pageIndex, searchInput]);

    useEffect(() => {
        switch (currentPermission) {
            case 'annotation.deleteAnnotation':
                handleDeleteAnnotationAdmin(selectedAnnotations);
                break;
            case 'annotation.editAnnotation':
                if (selectedAnnotations.size > 1) {
                    // error box that says no no noooo
                } else {
                    setCurrentAnnotation(annotations.find(annotation => annotation.id === Array.from(selectedAnnotations)[0][0]));
                    setCreatingAnnotation(true);
                }
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
        fetchAllTexts(setNumTexts, searchInput);
        fetchTextData(pageIndex, setTexts, searchInput);
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
                        pageIndex={pageIndex} setPageIndex={setPageIndex} numTexts={numTexts} setSearchInput={setSearchInput} />
                )}
                {currentText && (
                    <TextDetail currentText={currentText} handleBack={handleBack} userPermissions={userPermissions}
                        parentKey={parentKey} setCurrentPermission={setCurrentPermission} annotations={annotations}
                        setAnnotations={setAnnotations} selectedAnnotations={selectedAnnotations} setSelectedAnnotations={setSelectedAnnotations} />
                )}
            </div>
        </div>
    );
};

export const EditAnnotationModal = ({ setCreatingAnnotation, annotation }: { setCreatingAnnotation: (value: boolean) => void, annotation: any }) => {
    const title = "Edit Annotation";
    const [annotationText, setAnnotationText] = useState(annotation.description);

    // when user clicks submit
    const handleSubmit = () => {
        editAnnotation(annotation.id, annotationText);
    };

    const handleClose = () => {
        hideAnnotationAnimation(null, "createAnnotationModal", setCreatingAnnotation);
    };

    return (
        <WritingAnnotationModal title={title} selectedText={null} annotationText={annotationText}
            setAnnotationText={setAnnotationText} onSubmit={handleSubmit} onClose={handleClose} />
    );
};

export default Annotation;
