const testAnnotation = {
    start: 0,
    end: 4,
    description: 'example annotation',
    author: {
        username: 'testuser',
        discordId: '1234567890'
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
                    testAnnotation
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
        level: 'B1',
        text: [
            {
                text: 'This is a sample text for B1 level.',
                language: 'GR',
                annotations: [
                    testAnnotation
                ]
            }
        ],
    },
];

// satisfy jest stuff
describe('Constants', () => {
    it('should have a constant defined', () => {
        expect(mockTextData).toBeDefined();
    });
});