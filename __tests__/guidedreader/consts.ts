const testAnnotation = {
    id: 0,
    start: 0,
    end: 4,
    description: 'example annotation',
    creationDate: 0,
    author: {
        id: 0,
        username: 'testuser',
        discordId: 1234567890
    }
}

const testAnnotation2 = {
    id: 1,
    start: 0,
    end: 4,
    description: 'example annotation2',
    creationDate: 0,
    author: {
        id: 1,
        username: 'testuser2',
        discordId: 12345678980
    }
}

export const mockTextData = [
    {
        id: 1,
        title: 'Sample Text 1',
        level: 'Α1',
        text: [
            {
                text: 'This is a sample text for Α1 level.',
                language: 'GR',
                annotations: [
                    testAnnotation,
                    testAnnotation2
                ]
            }
        ],
    },
    {
        id: 2,
        title: 'Sample Text 2',
        level: 'Α2',
        text: [
            {
                text: 'This is a sample text for Α2 level.',
                language: 'GR',
                annotations: [
                    testAnnotation
                ]
            }
        ],
    },
    {
        id: 3,
        title: 'Sample Text 3',
        level: 'Β1',
        text: [
            {
                text: 'This is a sample text for Β1 level.',
                language: 'GR',
                annotations: [
                    testAnnotation
                ]
            }
        ],
    },
    {
        id: 4,
        title: 'Sample Text 4',
        level: 'Β2',
        text: [
            {
                text: 'This is a sample text for Β2 level.',
                language: 'GR',
                annotations: [
                    testAnnotation
                ]
            }
        ],
    },
    {
        id: 5,
        title: 'Sample Text 5',
        level: 'Γ1',
        text: [
            {
                text: 'This is a sample text for Α1 level.',
                language: 'GR',
                annotations: [
                    testAnnotation
                ]
            }
        ],
    },
    {
        id: 6,
        title: 'Sample Text 6',
        level: 'Γ2',
        text: [
            {
                text: 'This is a sample text for Α1 level.',
                language: 'GR',
                annotations: [
                    testAnnotation
                ]
            }
        ],
    }
];

// satisfy jest stuff
describe('Constants', () => {
    it('should have a constant defined', () => {
        expect(mockTextData).toBeDefined();
    });
});