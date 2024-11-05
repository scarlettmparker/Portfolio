import '@testing-library/jest-dom';
import { ErrorBox, PolicyBox } from '../../../pages/guidedreader/jsx/errorjsx';
import { fireEvent, render, screen } from '@testing-library/react';
import fetchMock from 'jest-fetch-mock';
import Router from 'next-router-mock';
fetchMock.enableMocks();

// mock router and fetch
jest.mock('next/router', () => require('next-router-mock'));
jest.mock('node-fetch');

describe('Policy Box Component', () => {
    const setAcceptedPolicy = jest.fn();
    const setPopupVisible = jest.fn();

    beforeEach(() => {
        setAcceptedPolicy.mockClear();
        setPopupVisible.mockClear();
        Router.setCurrentUrl('/guidedreader');
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test('renders correctly', () => {
        render(<PolicyBox setAcceptedPolicy={setAcceptedPolicy} setPopupVisible={setPopupVisible} />);
        expect(screen.getByText('You must agree to our Terms of Service and Privacy Policy.')).toBeInTheDocument();
        expect(screen.getByLabelText(/I have read the Terms of Service/)).toBeInTheDocument();
        expect(screen.getByLabelText(/I have read the Privacy Policy/)).toBeInTheDocument();
        expect(screen.getByText('Accept')).toBeInTheDocument();
    });

    test('checkboxes can be checked and unchecked', () => {
        render(<PolicyBox setAcceptedPolicy={setAcceptedPolicy} setPopupVisible={setPopupVisible} />);
        const termsCheckbox = screen.getByLabelText(/I have read the Terms of Service/);
        const privacyCheckbox = screen.getByLabelText(/I have read the Privacy Policy/);

        fireEvent.click(termsCheckbox);
        expect(termsCheckbox).toBeChecked();

        fireEvent.click(privacyCheckbox);
        expect(privacyCheckbox).toBeChecked();

        fireEvent.click(termsCheckbox);
        expect(termsCheckbox).not.toBeChecked();

        fireEvent.click(privacyCheckbox);
        expect(privacyCheckbox).not.toBeChecked();
    });

    test('accept button works only when both checkboxes are checked', () => {
        render(<PolicyBox setAcceptedPolicy={setAcceptedPolicy} setPopupVisible={setPopupVisible} />);
        const termsCheckbox = screen.getByLabelText(/I have read the Terms of Service/);
        const privacyCheckbox = screen.getByLabelText(/I have read the Privacy Policy/);
        const acceptButton = screen.getByText('Accept');

        // both checkboxes unchecked
        fireEvent.click(acceptButton);
        expect(setAcceptedPolicy).not.toHaveBeenCalled();

        // only terms checkbox checked
        fireEvent.click(termsCheckbox);
        fireEvent.click(acceptButton);
        expect(setAcceptedPolicy).not.toHaveBeenCalled();

        // both checkboxes checked
        fireEvent.click(privacyCheckbox);
        fireEvent.click(acceptButton);
        expect(setAcceptedPolicy).toHaveBeenCalledWith(true);
    });

    test('clicking close button calls setPopupVisible', () => {
        render(<PolicyBox setAcceptedPolicy={setAcceptedPolicy} setPopupVisible={setPopupVisible} />);
        const closeButton = screen.getByText('X');
        fireEvent.click(closeButton);
        expect(setPopupVisible).toHaveBeenCalledWith(false);
    });
});

describe('Error Box Component', () => {
    const setError = jest.fn();
    const errorMessage = 'Test error message';

    beforeEach(() => {
        setError.mockClear();
    });

    test('renders correctly with error message', () => {
        render(<ErrorBox error={errorMessage} setError={setError} />);
        expect(screen.getByText('Error Submitting Annotation')).toBeInTheDocument();
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
        expect(screen.getByText('Close')).toBeInTheDocument();
    });

    test('clicking close button calls setError with false', () => {
        render(<ErrorBox error={errorMessage} setError={setError} />);
        const closeButton = screen.getByText('Close');
        fireEvent.click(closeButton);
        expect(setError).toHaveBeenCalledWith(false);
    });

    test('clicking X button calls setError with false', () => {
        render(<ErrorBox error={errorMessage} setError={setError} />);
        const closeButton = screen.getByText('X');
        fireEvent.click(closeButton);
        expect(setError).toHaveBeenCalledWith(false);
    });
});