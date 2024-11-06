import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IndexUser } from '../../pages/guidedreader/jsx/indexuserjsx';
import Home from '../../pages/guidedreader/index';
import Router from 'next-router-mock';
import fetchMock from 'jest-fetch-mock';
import { mockTextData } from './consts';

fetchMock.enableMocks();

// mock router and fetch
jest.mock('next/router', () => require('next-router-mock'));
jest.mock('node-fetch');

describe('Home Component', () => {
    const indexUser = {
        user: {
            id: 0,
            avatar: 'default',
            discordId: '1234567890',
            acceptedPolicy: false,
        }
    }

    // user has accepted policy
    const indexUserAccepted = {
        user: {
            id: 0,
            avatar: 'default',
            discordId: '1234567890',
            acceptedPolicy: true,
        }
    }

    beforeEach(() => {
        // mock fetch
        (fetch as jest.Mock).mockImplementation(() =>
            Promise.resolve({
                json: () => Promise.resolve(mockTextData)
            })
        );
        Router.setCurrentUrl('/guidedreader');
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('renders IndexUser when user is logged in', async () => {
        const { container } = render(<IndexUser userDetails={indexUserAccepted} />)
        const avatarWrapper = container.querySelector('.avatarWrapper');
        expect(avatarWrapper).toBeInTheDocument();
    });

    it('contains a link to /guidedreader/profile/discordId', async () => {
        render(<IndexUser userDetails={indexUserAccepted} />);
        const profileLink = screen.getByRole('link', { name: /User Avatar/i });
        expect(profileLink).toHaveAttribute('href', `/guidedreader/profile/${indexUser.user.discordId}`);
    });

    it('contains the correct avatar image', async () => {
        render(<IndexUser userDetails={indexUserAccepted} />);
        const avatarImage = screen.getByRole('img', { name: /avatar/i });
        if (indexUserAccepted.user.avatar === 'default') {
            expect(avatarImage).toHaveAttribute('src', expect.stringContaining('0.png'));
        } else {
            expect(avatarImage).toHaveAttribute('src', expect.stringContaining(`${indexUserAccepted.user.discordId}.png`));
        }
    });

    it('renders policy banner when acceptedPolicy is false and popupVisible is false', async () => {
        await act(async () => {
            render(<Home user={indexUser} acceptedPolicy={false} popupVisible={false} />);
        });
        expect(screen.getByText(/You must agree to our Terms of Service and Privacy Policy./i)).toBeInTheDocument();
    });

    it('renders accept policy message when user has not accepted policy', async () => {
        await act(async () => {
            render(<Home user={indexUser} />);
        });
        const acceptPolicyMessage = screen.getByText(/You must agree to our Terms of Service and Privacy Policy./i);
        expect(acceptPolicyMessage).toBeInTheDocument();
    });

    it('renders annotations on the text', async () => {
        await act(async () => {
            render(<Home user={indexUserAccepted} />);
        });
        const annotations = document.querySelectorAll('[id^="annotated-text-"]');
        expect(annotations.length).toBeGreaterThan(0);
    });

    it('renders annotation when clicking on an annotation', async () => {
        await act(async () => {
            render(<Home user={indexUserAccepted} />);
        });

        const annotation = document.querySelector("#annotated-text-0");
        fireEvent.click(annotation!);

        // wait for modal to appear
        const annotationModal = document.querySelector('#annotationModal');
        expect(annotationModal).toBeInTheDocument();

        expect(screen.getByText(/Annotations/i)).toBeInTheDocument();
    })

    it('renders correct annotation modal when clicking the correction button', async () => {
        await act(async () => {
            render(<Home user={indexUserAccepted} />);
        });

        const annotation = document.querySelector("#annotated-text-0");
        fireEvent.click(annotation!);

        // wait for modal to appear
        const annotationModal = document.querySelector('#annotationModal');
        expect(annotationModal).toBeInTheDocument();

        const correctionButton = document.querySelector('.correctionText');
        fireEvent.click(correctionButton!);

        // wait for correction modal to appear
        const correctionModal = document.querySelector('#createAnnotationModal');
        expect(correctionModal).toBeInTheDocument();
    })

    // utility to mock document.createRange and its methods
    function mockCreateRange() {
        const originalCreateRange = document.createRange.bind(document);

        document.createRange = () => {
            const range = originalCreateRange();
            // mock getBoundingClientRect and getClientRects
            range.getBoundingClientRect = jest.fn(() => ({ left: 0, width: 100, top: 0, height: 20, right: 100, bottom: 20, x: 0, y: 0, toJSON: () => { } }));
            range.getClientRects = jest.fn(() => {
                const rect = { left: 0, width: 100, top: 0, height: 20, right: 100, bottom: 20, x: 0, y: 0, toJSON: () => { } } as DOMRect;
                return { length: 1, item: () => rect, [Symbol.iterator]: function* () { yield rect; } } as DOMRectList;
            });
            return range;
        };
    }

    // utility function to select text in an element
    function selectText(element: HTMLElement, start: number, end: number) {
        const range = document.createRange();
        range.setStart(element.firstChild!, start);
        range.setEnd(element.firstChild!, end);

        // select the text
        const selection = window.getSelection();
        selection!.removeAllRanges();
        selection!.addRange(range);

        return selection!;
    }

    it('renders annotation modal when clicking on create annotation button', async () => {
        mockCreateRange();

        await act(async () => {
            render(<Home user={indexUserAccepted} />);
        });

        // select text using the utility function
        const text = document.querySelector('#plain-text-0');
        selectText(text! as HTMLElement, 0, 5);

        fireEvent.mouseUp(text!);
        const createAnnotationButton = document.querySelector('.annotateButton');
        expect(createAnnotationButton).toBeInTheDocument();

        // simulate click on the create annotation button
        fireEvent.click(createAnnotationButton!);

        const annotationModal = document.querySelector('.annotationModal');
        expect(annotationModal).toBeInTheDocument();
    });

    it('renders level separators correctly', async () => {
        await act(async () => {
            render(<Home user={indexUserAccepted} />);
        });

        const levelSeparators = document.querySelectorAll('.levelSeparator');
        expect(levelSeparators.length).toBeGreaterThan(0);

        levelSeparators.forEach((separator, index) => {
            expect(separator.textContent).toBe(mockTextData[index].level);
        });
    });

    // find a text item by title
    const findTextItem = (title: string) => {
        const textItems = document.querySelectorAll('.textItem');
        return Array.from(textItems).find(item => item.textContent!.includes(title));
    };

    it('filters out text items when level checkboxes are clicked', async () => {
        await act(async () => {
            render(<Home user={indexUserAccepted} />);
        });

        const levelFilter = document.querySelector('.dropdownButton');
        expect(levelFilter).toBeInTheDocument();
        fireEvent.click(levelFilter!);

        const levelCheckboxes = document.querySelectorAll('.levelCheckboxLabel');
        expect(levelCheckboxes.length).toBe(6);

        // check text items are all there
        mockTextData.forEach(data => {
            expect(findTextItem(data.title)).toBeInTheDocument();
        });

        // deselect each level checkbox and ensure the text item disappears
        ['Α1', 'Α2', 'Β1', 'Β2', 'Γ1'].forEach((level, index) => {
            fireEvent.click(Array.from(levelCheckboxes).find(cb => cb.textContent === level)!);
            expect(findTextItem(mockTextData[index].title)).toBeUndefined();
        });

        // c2 level checkbox can't be deselected
        const checkboxC2 = Array.from(levelCheckboxes).find(cb => cb.textContent === 'Γ2');
        fireEvent.click(checkboxC2!);
        expect(findTextItem(mockTextData[5].title)).toBeInTheDocument();
    });

    it('changes the font size when the font size button is clicked', async () => {
        await act(async () => {
            render(<Home user={indexUserAccepted} />);
        });

        const fontSizeButton = document.querySelector('.fontSizeButton');
        expect(fontSizeButton).toBeInTheDocument();

        fireEvent.click(fontSizeButton!);

        const increaseFontSizeButton = screen.getByRole('button', { name: '+' });
        const decreaseFontSizeButton = screen.getByRole('button', { name: '-' });

        // set initial font size
        const textElement = document.getElementById("textContent");
        const initialFontSize = '19.2px';
        textElement!.style.fontSize = initialFontSize;

        // increase font size
        fireEvent.click(increaseFontSizeButton);
        const increasedFontSize = (textElement as HTMLElement)!.style.fontSize;
        expect(parseFloat(increasedFontSize)).toBe(1 + parseFloat(initialFontSize));

        // decrease font size
        fireEvent.click(decreaseFontSizeButton);
        const decreasedFontSize = window.getComputedStyle(textElement!).fontSize;
        expect(parseFloat(decreasedFontSize)).toBe(parseFloat(initialFontSize));
    });
});
