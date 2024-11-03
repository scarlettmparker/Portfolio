const helper: React.FC = () => {
    return null;
};

export default helper;

// handle clearing annotations
export const clearAnnotations = (setAnnotations: (value: any[]) => void) => {
    setAnnotations([]);
};

// handle clearing texts
export const clearTexts = (setNumTexts: (value: number) => void, setTexts: (value: any[]) => void) => {
    setNumTexts(0);
    setTexts([]);
};

// reset page index and clear data when switching menus
export const changeMenus = (setPageIndex: (value: number) => void, clearTexts: () => void, clearAnnotations: () => void) => {
    setPageIndex(0);
    clearTexts();
    clearAnnotations();
};

// utility function to toggle annotation selection
export const toggleAnnotationSelection = (id: number, textId: number, selectedAnnotations: Set<[number, number]>) => {
    const selected = new Set(selectedAnnotations);
    const annotationTuple: [number, number] = [id, textId];
    let found = false;
    // check if annotation is already selected
    selected.forEach((value) => {
        if (value[0] === id && value[1] === textId) {
            found = true;
            selected.delete(value);
        }
    });
    !found && selected.add(annotationTuple);
    return selected;
};