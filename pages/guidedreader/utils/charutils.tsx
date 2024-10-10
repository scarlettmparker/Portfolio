const helper: React.FC = () => {
    return null;
};

export default helper;

// function for selecting text for annotations
export const handleTextSelection = ({
    textContentRef, selectedText, setSelectedText, setButtonPosition, setCharIndex, creatingAnnotation
}: {
    textContentRef: any, selectedText: string, setSelectedText: (value: string) => void, setButtonPosition: (value: { x: number, y: number }) => void,
    setCharIndex: (value: number) => void, creatingAnnotation: boolean
}) => {
    if (creatingAnnotation) return;

    // get the selected text
    const selection = window.getSelection();
    const textContentElement = textContentRef.current;

    // check if the selection is valid
    if (!selection || !selection.toString() || !textContentElement?.contains(selection.anchorNode) || selection.toString().length > 90) {
        setSelectedText('');
        return;
    }

    // get the range and start/end elements
    const range = selection.getRangeAt(0);
    const startElement = range.startContainer.parentElement;
    const endElement = range.endContainer.parentElement;

    // check if the selection is inside an annotation
    const isAnnotated = (el: HTMLElement | null) => !!el?.closest('span[id^="annotated-text"]');

    // check if the selection is inside an annotation
    if (Array.from(textContentElement.querySelectorAll('span[id^="annotated-text"]')).some(span => range.intersectsNode(span as Node))
        || startElement?.closest('#annotation') || isAnnotated(startElement) || isAnnotated(endElement)) {
        selection.removeAllRanges();
        setSelectedText('');
        return;
    }

    // check if the selection is the same as the selected text
    if (selection.toString() === selectedText) {
        selection.removeAllRanges();
        setSelectedText('');
        return;
    }

    // check if the selection is inside the text content
    const startDiv = startElement?.closest('div');
    if (startDiv && startDiv === endElement?.closest('div')) {
        const charIndex = getCharacterIndex(startDiv, range.startContainer, range.startOffset);
        setCharIndex(charIndex);

        // determine the position of the button
        const { left, width, top, height } = range.getBoundingClientRect();
        setButtonPosition({ x: left + width / 2, y: top + height / 2 - 20 });
        setSelectedText(selection.toString());
    } else {
        // clear the selection if it is not valid
        selection.removeAllRanges();
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