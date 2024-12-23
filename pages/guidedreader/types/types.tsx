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

// theme type
export interface Theme {
    name: string;
    has_images: boolean;
    image_path: string;
    images: { id: number; name: string; }[];
}

// annotation modal props
export interface AnnotationModalProps {
    setCurrentAnnotation: (value: string) => void;
    currentAnnotation: string;
    currentLanguage: number;
    currentText: any;
    userDetails: any;
    setCorrectingAnnotation: (value: boolean) => void;
    setCorrectingAnnotationData: (value: any) => void;
    setError: (value: boolean) => void;
    setErrorMessage: (value: string) => void;
}

/* textjsx.tsx stuff */

// props for text list
export interface TextListProps {
    textData: TextData[];
    levelSeparators: LevelSeparator[];
    setCurrentText: (index: number) => void;
    setCurrentAnnotation: (annotation: string) => void;
    setCurrentLanguage: (language: number) => void;
    currentText: number;
    textListRef: React.RefObject<HTMLDivElement>;
    setCurrentLevel: (level: string) => void;
    hasURLData: boolean;
}

// side bar header props
export interface SidebarHeaderProps {
    hiddenSidebar: boolean;
    toggleSidebar: () => void;
    windowWidth: number;
    isMounted: boolean;
}

// text item props
export interface TextItemProps {
    title: string;
    isSelected: boolean;
    onClick: () => void;
    audio: boolean;
}

// level separator props
export interface LevelSeparatorProps {
    level: string;
    textIndex: number;
    levelRefs: React.RefObject<{ [key: string]: HTMLDivElement | null }>;
}

/* end of textjsx.tsx stuff */

// props for toolbar
export interface ToolbarProps {
    textData: any;
    setCurrentAnnotation: (annotation: string) => void;
    setCurrentLanguage: (language: number) => void;
    currentText: number;
    setCurrentTextID: (id: number) => void;
}

// button with alt text for toolbar
export interface ButtonWithAltTextProps {
    label: string;
    altText: string;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    buttonRef?: React.RefObject<HTMLButtonElement>;
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