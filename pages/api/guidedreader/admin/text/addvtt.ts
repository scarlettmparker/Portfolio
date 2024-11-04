import prisma from '../../../prismaclient';
import { NextApiRequest, NextApiResponse } from 'next';
import rateLimitMiddleware from "@/middleware/rateLimiter";
import { verifyUser } from '../verify';
import fs from 'fs';
import path from 'path';
import formidable, { IncomingForm, Fields, Files } from 'formidable';
import { WebVTTParser } from 'webvtt-parser';

// permissions needed to access this path
const PERMISSIONS = ["text.addVoiceOver"];

const MAX_AUDIO_SIZE = 5 * 1024 * 1024; // 5MB

export const config = {
    api: {
        bodyParser: false,
    },
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const form = new IncomingForm();
    form.parse(req, async (err: any, fields: Fields, files: Files) => {
        if (err) {
            return res.status(400).json({ error: 'Error parsing the form data' });
        }

        const { textId, author, link } = fields;
        if (!files.audio || !files.vtt) {
            return res.status(400).json({ error: 'Audio and VTT files are required!' });
        }

        const audio = files.audio[0] as formidable.File;
        const vtt = files.vtt[0] as formidable.File;

        // validate form data
        if (!textId || !audio || !vtt || !author || !link) {
            return res.status(400).json({ error: 'Text ID, audio, VTT, author and link are required!' });
        }

        if (audio.size > MAX_AUDIO_SIZE) {
            return res.status(400).json({ error: 'Audio file size exceeds 5MB' });
        }

        if (!audio.filepath || !vtt.filepath) {
            return res.status(400).json({ error: 'File paths are missing' });
        }

        // read and validate vtt file content
        const vttContent = fs.readFileSync(vtt.filepath, 'utf8');
        const parser = new WebVTTParser();
        const result = parser.parse(vttContent);

        if (result.errors.length > 0) {
            return res.status(400).json({ error: 'Invalid VTT file format' });
        }

        // verify user permissions
        const user = await verifyUser(req, res, PERMISSIONS);
        if (!user) {
            return;
        }

        // define file paths
        const audioFilePath = path.join(process.cwd(), `public/assets/guidedreader/audios/raw/${textId}.mp3`);
        const vttFilePath = path.join(process.cwd(), `public/assets/guidedreader/audios/vtt/${textId}.vtt`);

        const dirPath = path.dirname(audioFilePath);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        // move files to the defined paths
        fs.renameSync(audio.filepath, audioFilePath);
        fs.renameSync(vtt.filepath, vttFilePath);

        const authorString = Array.isArray(author) ? author[0] : author;
        const linkString = Array.isArray(link) ? link[0] : link;

        // create audio data object
        const audioData = {
            audioFile: `/assets/guidedreader/audios/raw/${textId}.mp3`,
            vttFile: `/assets/guidedreader/audios/vtt/${textId}.vtt`,
            submissionName: authorString,
            submissionLink: linkString,
        };

        // create new audio entry in the database
        const newAudio = await prisma.audio.create({
            data: audioData,
        });

        // update text entry with the new audio id
        await prisma.text.update({
            where: { id: parseInt(textId as unknown as string) },
            data: { audioId: newAudio.id },
        });

        // send success response
        res.status(200).json({ message: 'Audio and VTT files uploaded successfully', audio: newAudio });
    });
}

export default rateLimitMiddleware(handler, { privacy: true });