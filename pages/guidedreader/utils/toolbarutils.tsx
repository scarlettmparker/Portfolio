const helper: React.FC = () => {
    return null;
};

export default helper;

// handle language changing on toolbar
export const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>, setCurrentLanguage: { (language: number): void; },
    setCurrentAnnotation: { (annotation: string): void; }, setCurrentTextID: { (id: number): void; }, textData: { [x: string]: { text: { id: any; }[]; }; }, currentText: number) => {

    // get the selected index and set the current language
    const selectedIndex = parseInt(e.target.value, 10);
    setCurrentLanguage(selectedIndex);
    setCurrentAnnotation('');
    setCurrentTextID(textData[currentText].text[selectedIndex].id);
};