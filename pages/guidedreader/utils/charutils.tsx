const helper: React.FC = () => {
    return null;
};

export default helper;

// function for selecting text for annotations
export const handleTextSelection = ({ textContentRef, selectedText, setSelectedText, setButtonPosition, setCharIndex, creatingAnnotation }:
    {
        textContentRef: any, selectedText: string, setSelectedText: (value: string) => void, setButtonPosition: (value: { x: number, y: number }) => void,
        setCharIndex: (value: number) => void, creatingAnnotation: boolean
    }) => {
    const selection = window.getSelection();
    const textContentElement = textContentRef.current;

    if (creatingAnnotation) {
        return;
    }

    // check if the selection is valid (part of the text content)
    if (selection && selection.toString().length > 0 && textContentElement?.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        const startContainer = range.startContainer.parentElement;
        const endContainer = range.endContainer.parentElement;

        // Function to find the closest span element
        const findClosestSpan = (element: HTMLElement | null): HTMLElement | null => {
            while (element && element.tagName !== 'SPAN') {
                element = element.parentElement;
            }
            return element;
        };

        const containsPlainTextId = (element: HTMLElement | null): boolean => {
            if (!element) return false;
            return element.id.startsWith('plain-text') || !!element.querySelector('[id^="plain-text"]');
        };

        const startSpan = findClosestSpan(startContainer);
        const endSpan = findClosestSpan(endContainer);

        // prevent the annotation button from appearing if the selection spans multiple elements
        if (startSpan === endSpan) {
            // check if the selected text is within an element with id starting with "plain-text"
            if (!containsPlainTextId(startSpan) || !containsPlainTextId(endSpan)) {
                selection.removeAllRanges();
                setSelectedText('');
                return;
            }

            // check if the selected text is the same as the previously selected text
            if (selection.toString() === selectedText) {
                selection.removeAllRanges();
                setSelectedText('');
            } else {
                setSelectedText(selection.toString());
                if (startSpan) {
                    const charIndex = getCharacterIndex(startSpan, range.startContainer, range.startOffset);
                    setCharIndex(charIndex);

                    // get bounding box of the text selection
                    const rect = range.getBoundingClientRect();

                    // calculate the center and set button position
                    const middleX = rect.left + (rect.width / 2);
                    const middleY = rect.top + (rect.height / 2);
                    setButtonPosition({ x: middleX, y: middleY - 20 });
                }
            }
        } else {
            // clear the selection if it spans multiple elements
            selection.removeAllRanges();
            setSelectedText('');
        }
    } else {
        setSelectedText('');
    }
};

// get character index helper for annotation selection
const getCharacterIndex = (parentDiv: HTMLElement, startContainer: Node, startOffset: number): number => {
    let charIndex = 0;

    // traverse nodes and find the character index
    const traverseNodes = (node: Node): boolean => {
        if (node === startContainer) {
            charIndex += startOffset;
            return true;
        }

        // check if the node is a text node
        if (node.nodeType === Node.TEXT_NODE) {
            charIndex += node.textContent?.length || 0;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // ensure the element is not an annotation
            for (let i = 0; i < node.childNodes.length; i++) {
                if (traverseNodes(node.childNodes[i])) {
                    return true;
                }
            }
        }

        return false;
    };

    traverseNodes(parentDiv);
    return charIndex;
};