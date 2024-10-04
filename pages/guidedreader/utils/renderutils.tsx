import { Annotation } from '../types/types'
import styles from '../styles/index.module.css';

const helper: React.FC = () => {
	return null;
};

export default helper;

// because of random whitespaces in texts and stuff
export const sanitizeText = (rawText: string): string => {
	return rawText
		.replace(/<[^>]*>/g, '') // remove HTML tags
		.replace(/\u00A0/g, ' ') // replace non-breaking spaces with regular spaces
		.replace(/\s+/g, ' ')    // replace all whitespace characters with a single space
		.trim();                 // trim leading/trailing spaces
};

// render out annotations in the text
export const renderAnnotatedText = (text: string, annotations: Annotation[]) => {
	const parts: string[] = [];
	let lastIndex = 0;
	let annotationCounter = 0;
	let plainTextCounter = 0;

	// use object directly to avoid duplicate annotations
	const annotationMap: Record<string, Annotation> = {};

	// filter out overlapping annotations
	annotations.forEach(annotation => {
		const key = `${annotation.start}-${annotation.end}`;
		const current = annotationMap[key];

		if (!current || (annotation.likes - annotation.dislikes) > (current.likes - current.dislikes)) {
			annotationMap[key] = annotation;
		}
	});

	const filteredAnnotations = Object.values(annotationMap).sort((a, b) => a.start - b.start);

	// create a temporary div to parse the text
	const tempDiv = document.createElement('div');
	tempDiv.innerHTML = text;

	// handle text processing
	const processTextNode = (textNode: string, startOffset: number) => {
		const sanitizedText = sanitizeText(textNode);
		let currentOffset = startOffset;
		let lastAnnotatedIndex = 0;

		// iterate over filtered annotations
		filteredAnnotations.forEach(({ description, start, end }) => {
			if (currentOffset < end && currentOffset + sanitizedText.length > start) {
				const overlapStart = Math.max(start, currentOffset);
				const overlapEnd = Math.min(end, currentOffset + sanitizedText.length);

				// append plaintext before the annotation
				const unannotatedText = sanitizedText.slice(lastAnnotatedIndex, overlapStart - currentOffset);
				if (unannotatedText) {
					parts.push(`<span id="plain-text-${plainTextCounter++}">${unannotatedText}</span>`);
				}

				// append annotated text and description
				const annotatedText = sanitizedText.slice(overlapStart - currentOffset, overlapEnd - currentOffset);
				if (annotatedText) {
					parts.push(`<span id="annotated-text-${annotationCounter++}" class="${styles.annotatedText}" data-description="${encodeURIComponent(description)}">${annotatedText}</span>`);
				}
				lastAnnotatedIndex = overlapEnd - currentOffset;
			}
		});

		// append remaining plaintext
		if (lastAnnotatedIndex < sanitizedText.length) {
			const remainingText = sanitizedText.slice(lastAnnotatedIndex);
			if (remainingText) {
				parts.push(`<span id="plain-text-${plainTextCounter++}">${remainingText}</span>`);
			}
		}

		lastIndex = currentOffset + sanitizedText.length;
	};

	// process each node in the temporary div recursively
	const processNode = (node: Node, startOffset: number) => {
		if (node.nodeType === Node.TEXT_NODE) {
			processTextNode(node.textContent || '', startOffset);
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			const element = node as HTMLElement;
			parts.push(`<${element.tagName.toLowerCase()}${getAttributes(element)}>`);
			node.childNodes.forEach((child) => processNode(child, lastIndex));
			parts.push(`</${element.tagName.toLowerCase()}>`);
		}
	};

	// get attributes of an element as a string
	const getAttributes = (element: HTMLElement): string =>
		Array.from(element.attributes).reduce((attrs, attr) => `${attrs} ${attr.name}="${attr.value}"`, '');

	// start processing the temporary div and join into single string
	processNode(tempDiv, 0);
	return parts.join('').replace(/<br\s*\/?>/g, '');
};
