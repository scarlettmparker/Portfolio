import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    const songDirectories = path.join(process.cwd(), 'public/assets/stemplayer');

    const directories = fs.readdirSync(songDirectories, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    const songDirectoriesWithSong = directories.filter(directory => {
        const songPath = path.join(songDirectories, directory, 'SONG');
        return fs.existsSync(songPath);
    });

    res.status(200).json(songDirectoriesWithSong);
}