import prisma from '../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const { title, level, language, text } = req.body;
    let textContent: string = text.map((item: { type: string; content: string; }) => `<${item.type}>${item.content}</${item.type}>`).join('');

    // fetch the existing textobject (if it exists)
    const existingTextObject = await prisma.textObject.findFirst({
        where: {
            title: title,
            level: level
        },
        include: {
            text: true
        }
    });

    if (existingTextObject) {
        // if textobject exists, create new text and associate it with the existing textobject
        const newText = await prisma.text.create({
            data: {
                text: String(textContent),
                language: language,
                textObjectId: existingTextObject.id
            }
        });

        await prisma.textObject.update({
            where: {
                id: existingTextObject.id
            },
            data: {
                text: {
                    connect: { id: newText.id }
                }
            }
        });
    } else {
        // if textobject does not exist, create a new one and associate the new text with it
        await prisma.textObject.create({
            data: {
                title: title,
                level: level,
                text: {
                    create: [{
                        text: String(textContent),
                        language: language
                    }]
                }
            }
        });
    }

    res.status(200).json({ message: 'Text object created/updated successfully' });
}