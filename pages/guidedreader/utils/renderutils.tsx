import { Annotation } from '../types/types'
import styles from '../styles/index.module.css';

const helper: React.FC = () => {
	return null;
};

export default helper;

export const renderAnnotatedText = (text: string, annotations: Annotation[]) => {
	const parts: string[] = [];
	let lastIndex = 0;
	let annotationCounter = 0;
	let plainTextCounter = 0;

	const annotationMap = new Map<string, Annotation>();

	// create a map of annotations with the same start and end indices
	annotations.forEach(annotation => {
		const key = `${annotation.start}-${annotation.end}`;
		const current = annotationMap.get(key);

		if (!current || (annotation.likes - annotation.dislikes) > (current.likes - current.dislikes)) {
			annotationMap.set(key, annotation);
		}
	});

	// convert the map back to an array
	const filteredAnnotations = Array.from(annotationMap.values());

	// sort annotations by start index
	filteredAnnotations.sort((a, b) => a.start - b.start);

	// create a temporary dom element to parse html
	const tempDiv = document.createElement('div');
	tempDiv.innerHTML = text;

	// function to sanitize text
	const sanitizeText = (rawText: string): string => {
		return rawText
			.replace(/<[^>]*>/g, '') // remove HTML tags
			.replace(/\u00A0/g, ' ') // replace non-breaking spaces with regular spaces
			.replace(/\s+/g, ' ')
			.trim(); // replace all whitespace characters with a single space
	};

	// recursively process child nodes
	const processNode = (node: Node, startOffset: number) => {
		if (node.nodeType === Node.TEXT_NODE) {
			const textContent = node.textContent || '';
			const sanitizedText = sanitizeText(textContent);
			const textLength = sanitizedText.length;

			// handle annotation overlaps
			let currentOffset = startOffset;
			let lastAnnotatedIndex = 0;

			// check against annotations for this text node
			filteredAnnotations.forEach(({ description, start, end }) => {
				if (currentOffset < end && currentOffset + textLength > start) {
					const overlapStart = Math.max(start, currentOffset);
					const overlapEnd = Math.min(end, currentOffset + textLength);

					// push unannotated text before the overlap, ensuring no empty strings
					const unannotatedText = sanitizedText.slice(lastAnnotatedIndex, overlapStart - currentOffset);
					if (unannotatedText.trim()) {
						parts.push(`<span id="plain-text-${plainTextCounter++}">${unannotatedText}</span>`);
					}

					// create the annotated span for the overlapping text
					const annotatedText = sanitizedText.slice(overlapStart - currentOffset, overlapEnd - currentOffset);
					if (annotatedText.trim()) {
						const annotatedHTML = `<span id="annotated-text-${annotationCounter++}" class="${styles.annotatedText}" data-description="${encodeURIComponent(description)}">${annotatedText}</span>`;
						parts.push(annotatedHTML);
					}
					lastAnnotatedIndex = overlapEnd - currentOffset;
				}
			});

			// push remaining text after the last annotation
			if (lastAnnotatedIndex < textLength) {
				const remainingText = sanitizedText.slice(lastAnnotatedIndex);
				if (remainingText.trim()) {
					parts.push(`<span id="plain-text-${plainTextCounter++}">${remainingText}</span>`);
				}
			}

			lastIndex = currentOffset + textLength;
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			// for element nodes, add the opening tag
			const element = node as HTMLElement;
			parts.push(`<${element.tagName.toLowerCase()}${getAttributes(element)}>`);

			node.childNodes.forEach((child) => processNode(child, lastIndex));
			parts.push(`</${element.tagName.toLowerCase()}>`);
		}
	};

	// get attributes from an element as a string
	const getAttributes = (element: HTMLElement): string => {
		return Array.from(element.attributes)
			.map(attr => ` ${attr.name}="${attr.value}"`)
			.join('');
	};

	processNode(tempDiv, 0);

	// join all parts into a single string and remove <br> tags
	const result = parts.join('').replace(/<br\s*\/?>/g, '');

	// add css rule for margin-right space
	const style = document.createElement('style');
	style.innerHTML = `
    	span[id^="annotated-text-"] {
        	margin-right: 0;
	    }
	    span[id^="annotated-text-"]:not(:last-child):not(:has(+ span[id^="plain-text-"])) {
	        margin-right: 5px;
    	}
	`;

	document.head.appendChild(style);
	return result;
};