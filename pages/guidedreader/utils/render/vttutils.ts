export interface VTTEntry {
    start: number;
    end: number;
    text: string;
}

export const parseVTT = async (url: string): Promise<VTTEntry[]> => {
    const response = await fetch(url);
    const vttText = await response.text();
    const vttEntries: VTTEntry[] = [];

    const vttLines = vttText.split('\n');
    let currentEntry: Partial<VTTEntry> = {};

    // skip header
    let headerSkipped = false;

    vttLines.forEach(line => {
        if (!headerSkipped) {
            if (line.trim() === 'WEBVTT') { // skip the first line
                headerSkipped = true;
            }
            return;
        }

        // match time format: 00:00:00.000 --> 00:00:00.000
        const timeMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/);

        if (timeMatch) {
            if (currentEntry.start !== undefined && currentEntry.end !== undefined && currentEntry.text) {
                // we know this is a new entry in the vtt
                vttEntries.push(currentEntry as VTTEntry);
                currentEntry = {};
            }

            currentEntry.start = parseTime(timeMatch[1]);
            currentEntry.end = parseTime(timeMatch[2]);
        } else if (line.trim() === '') {
            if (currentEntry.start !== undefined && currentEntry.end !== undefined && currentEntry.text) {
                vttEntries.push(currentEntry as VTTEntry);
                currentEntry = {};
            }
        } else if (!isNaN(Number(line.trim()))) {
            // ignore sequence numbers
        } else {
            currentEntry.text = (currentEntry.text || '') + line + '\n';
        }
    });

    // push the last entry if it exists
    if (currentEntry.start !== undefined && currentEntry.end !== undefined && currentEntry.text) {
        vttEntries.push(currentEntry as VTTEntry);
    }

    return vttEntries;
};

export const parseTime = (timeString: string): number => {
    const [hours, minutes, seconds] = timeString.split(':');
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
};