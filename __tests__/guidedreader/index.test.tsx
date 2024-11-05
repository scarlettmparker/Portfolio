import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IndexUser } from '../../pages/guidedreader/jsx/indexuserjsx';
import Head from 'next/head';
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
            avatar: 'default',
            discordId: '1234567890',
            acceptedPolicy: false,
        }
    }

    // user has accepted policy
    const indexUserAccepted = {
        user: {
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
});
