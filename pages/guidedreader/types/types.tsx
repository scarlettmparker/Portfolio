const helper: React.FC = () => {
    return null;
};

export default helper;

// author object (will be expanded upon)
export interface Author {
	username: string;
}

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
}