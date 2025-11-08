import * as fs from 'fs';
import * as path from 'path';

const folderPath = './public/images';

export default function images(): string[]{
    let filePaths: string[] = [];
    try {
        filePaths = fs.readdirSync(folderPath);
        console.log('Files in folder:', filePaths);
    } catch (err) {
        console.error('Error reading directory:', err);
    }
    return filePaths;
}