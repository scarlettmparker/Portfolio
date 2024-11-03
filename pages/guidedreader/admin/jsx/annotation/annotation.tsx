import ChangeListButton from "../listbutton";
import styles from "../../styles/admin.module.css";
import { useEffect, useRef, useState } from "react";
import { editAnnotation, fetchAllAnnotations, fetchNumAnnotations, fetchTextAnnotations, handleDeleteAnnotationAdmin } from "../../utils/annotation/annotationutils";
import Sidebar from "../sidebar";
import { fetchAllTexts, fetchTextData } from "../../utils/text/textutils";
import { WritingAnnotationModal } from "@/pages/guidedreader/jsx/text/annotationjsx";
import { hideAnnotationAnimation } from "@/pages/guidedreader/utils/annotation/annotationutils";
import { toggleAnnotationSelection, changeMenus, clearTexts, clearAnnotations } from "../../utils/annotation/jsxutils";

// text list component containing all texts (still not styled!!!)
const TextList = ({ texts, onTextSelect, handleBack, pageIndex, setPageIndex, numTexts, setSearchInput }: {
    texts: any[]; onTextSelect: (text: any) => void; handleBack: () => void; pageIndex: number; setPageIndex: (value: number) => void; numTexts: number; setSearchInput: (value: string) => void;
}) => (
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

// textdetails component (shows all annotation for text)
const TextDetail = ({ currentText, handleBack, userPermissions, parentKey, setCurrentPermission, annotations, setAnnotations, selectedAnnotations, setSelectedAnnotations }: {
    currentText: any; handleBack: () => void; userPermissions: string[]; parentKey: string; setCurrentPermission: (value: string) => void; annotations: any[]; setAnnotations: (value: any[]) => void; selectedAnnotations: Set<[number, number]>; setSelectedAnnotations: (value: Set<[number, number]> | ((prev: Set<[number, number]>) => Set<[number, number]>)) => void;
}) => {
    useEffect(() => {
        fetchTextAnnotations(currentText.id, setAnnotations);
    }, [currentText]);

    useEffect(() => {
        if (annotations.length > 0) {
            setAnnotations(annotations);
        };
    }, [annotations]);

    // selection functions
    const handleSelectAnnotation = (id: number, textId: number) => {
        setSelectedAnnotations(prev => toggleAnnotationSelection(id, textId, prev));
    };

    const handleSelectAll = () => {
        setSelectedAnnotations(new Set(annotations.map(annotation => [annotation.id, annotation.textId])));
    };

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
            <SelectControls annotations={annotations} selectedAnnotations={selectedAnnotations} handleSelectAll={handleSelectAll} handleUnselectAll={handleUnselectAll} />
            <AnnotationList annotations={annotations} selectedAnnotations={selectedAnnotations} handleSelectAnnotation={handleSelectAnnotation} />
        </>
    );
};

// view all the annotations at once
const ViewAllAnnotations = ({ pageIndex, setPageIndex, handleBack, userPermissions, parentKey, setCurrentPermission, annotations, setAnnotations, selectedAnnotations, setSelectedAnnotations, numAnnotations, setNumAnnotations }: {
    pageIndex: number, setPageIndex: (value: number) => void, handleBack: () => void, userPermissions: string[], parentKey: string,
    setCurrentPermission: (value: string) => void, selectedAnnotations: Set<[number, number]>, annotations: any[], setAnnotations: (value: any[]) => void,
    setSelectedAnnotations: (value: Set<[number, number]> | ((prev: Set<[number, number]>) => Set<[number, number]>)) => void, numAnnotations: number, setNumAnnotations: (value: number) => void;
}) => {
    useEffect(() => {
        fetchNumAnnotations(setNumAnnotations);
        fetchAllAnnotations(pageIndex, setAnnotations);
    }, []);

    // selection functions
    const handleSelectAnnotation = (id: number, textId: number) => {
        setSelectedAnnotations(prev => toggleAnnotationSelection(id, textId, prev));
    };

    const handleSelectAll = () => {
        setSelectedAnnotations(new Set(annotations.map(annotation => [annotation.id, annotation.textId])));
    };

    const handleUnselectAll = () => {
        setSelectedAnnotations(new Set());
    };

    return (
        <div>
            <Sidebar userPermissions={userPermissions} parentKey={parentKey} setCurrentPermission={setCurrentPermission} />
            <button onClick={handleBack}>Back</button>
            <SelectControls annotations={annotations} selectedAnnotations={selectedAnnotations} handleSelectAll={handleSelectAll} handleUnselectAll={handleUnselectAll} />
            <AnnotationList annotations={annotations} selectedAnnotations={selectedAnnotations} handleSelectAnnotation={handleSelectAnnotation} />
            <ChangeListButton direction="left" pageIndex={pageIndex} setPageIndex={setPageIndex} numUsers={numAnnotations} />
            <ChangeListButton direction="right" pageIndex={pageIndex} setPageIndex={setPageIndex} numUsers={numAnnotations} />
            {pageIndex + "/" + numAnnotations}
        </div>
    );
};

// component for the main menu
const MainMenu = ({ handleAllTexts, handleAllAnnotations }: { handleAllTexts: () => void; handleAllAnnotations: () => void }) => (
    <div className={styles.mainMenu}>
        <span className={styles.annotationSelectMenu} onClick={handleAllTexts}>View Annotations by Text</span>
        <span className={styles.annotationSelectMenu} onClick={handleAllAnnotations}>View All Annotations</span>
    </div>
);

// main annotation component
const Annotation = ({ userPermissions, setCurrentAnnotation, setCreatingAnnotation }:
    { userPermissions: string[], setCurrentAnnotation: (value: any) => void, setCreatingAnnotation: (value: boolean) => void }) => {
    const [pageIndex, setPageIndex] = useState(0);
    const [currentPermission, setCurrentPermission] = useState<string>('');

    // annotation stuff
    const [numAnnotations, setNumAnnotations] = useState(0);
    const [viewAnnotations, setViewAnnotations] = useState(false);
    const [annotations, setAnnotations] = useState<any[]>([]);
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
                // assume it worked for now
                setAnnotations(prevAnnotations => prevAnnotations.filter(annotation => !Array.from(selectedAnnotations).some(([selectedId]) => selectedId === annotation.id)));
                setNumAnnotations(numAnnotations - selectedAnnotations.size);
                break;
            case 'annotation.editAnnotation':
                if (selectedAnnotations.size > 1) {
                    // error box that says no no noooo
                } else if (selectedAnnotations.size == 1) {
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
        changeMenus(setPageIndex, () => clearTexts(setNumTexts, setTexts), () => clearAnnotations(setAnnotations));
        setViewAnnotations(true);
    };

    // fetch all texts based on page index
    const handleAllTexts = () => {
        changeMenus(setPageIndex, () => clearTexts(setNumTexts, setTexts), () => clearAnnotations(setAnnotations));
        setViewTexts(true);
        fetchAllTexts(setNumTexts, searchInput);
        fetchTextData(pageIndex, setTexts, searchInput);
    };

    // handle back button
    const handleBack = () => {
        if (currentText) {
            setCurrentText(null);
        } else {
            changeMenus(setPageIndex, () => clearTexts(setNumTexts, setTexts), () => clearAnnotations(setAnnotations));
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
                {viewAnnotations && (
                    <ViewAllAnnotations pageIndex={pageIndex} setPageIndex={setPageIndex} handleBack={handleBack} userPermissions={userPermissions} parentKey={parentKey}
                        setCurrentPermission={setCurrentPermission} annotations={annotations} setAnnotations={setAnnotations} selectedAnnotations={selectedAnnotations}
                        setSelectedAnnotations={setSelectedAnnotations} numAnnotations={numAnnotations} setNumAnnotations={setNumAnnotations} />
                )}
            </div>
        </div>
    );
};

// basically the same thing as the other classes
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

// reusable annotation list component
const AnnotationList = ({ annotations, selectedAnnotations, handleSelectAnnotation }: {
    annotations: any[], selectedAnnotations: Set<[number, number]>, handleSelectAnnotation: (id: number, textId: number) => void
}) => (
    <div className={styles.annotationListWrapper}>
        {annotations.map((annotation) => (
            <div key={annotation.id} className={styles.annotationItem}>
                <input type="checkbox"
                    checked={Array.from(selectedAnnotations).some(([selectedId, selectedTextId]) => selectedId === annotation.id && selectedTextId === annotation.textId)}
                    onChange={() => handleSelectAnnotation(annotation.id, annotation.textId)} />
                {annotation.description}
            </div>
        ))}
    </div>
);

// selecting and unselecting controlls
const SelectControls = ({ annotations, selectedAnnotations, handleSelectAll, handleUnselectAll }: {
    annotations: any[], selectedAnnotations: Set<[number, number]>, handleSelectAll: () => void, handleUnselectAll: () => void
}) => (
    <div>
        <input type="checkbox" onChange={handleSelectAll} checked={selectedAnnotations.size === annotations.length} /> Select All
        <input type="checkbox" onChange={handleUnselectAll} checked={selectedAnnotations.size === 0} /> Unselect All
    </div>
);

export default Annotation;
