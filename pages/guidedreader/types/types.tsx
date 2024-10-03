const helper: React.FC = () => {
    return null;
};

export default helper;

// text object containing multiple texts
export interface TextObject {
    id: number;
    title: string;
    level: string;
    text: Text[];
}

// text object containing a single text
export interface Text {
    id: number;
    text: string;
    language: String;
    annotations: Annotation[];
}

// annotation interface for text data
export interface Annotation {
    start: number;
    end: number;
    description: string;
    likes: number;
    dislikes: number;
}

// props for text list
export interface TextListProps {
    textData: TextData[];
    levelSeparators: LevelSeparator[];
    setCurrentText: (index: number) => void;
    setCurrentAnnotation: (annotation: string) => void;
    setCurrentLanguage: (language: number) => void;
    currentText: number;
    textListRef: React.RefObject<HTMLDivElement>;
}

// props for toolbar
export interface ToolbarProps {
    textData: any;
    setCurrentAnnotation: (annotation: string) => void;
    setCurrentLanguage: (language: number) => void;
    currentText: number;
    setCurrentTextID: (id: number) => void;
}

// level separator interface
interface LevelSeparator {
    index: number;
    level: string;
}

// text data interface
interface TextData {
    title: string;
    level: string;
    id: number;
}
