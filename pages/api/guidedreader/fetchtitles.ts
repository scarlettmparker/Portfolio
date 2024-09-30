import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { load } from 'cheerio';

const increment = 20;
const baseUrl = "https://www.greek-language.gr/certification/dbs/teachers/index.html?start=";

const fetchData = async (start: number) => {
    try {
        const response = await axios.get(`${baseUrl}${start}`);
        const html = response.data;
        const $ = load(html);

        // extract the page data
        const results: { title: string; link: string; level: string; }[] = [];
        $("table.table-striped tbody tr").each((index, element) => {
            const firstTd = $(element).find("td").first();
            const title = firstTd.text().trim();
            const link = firstTd.find("a").attr("href");
            const nextTd = firstTd.next();
            const level = nextTd.text().trim();

            if (title && link) {
                results.push({ title, link, level });
            }
        });

        return results;
    } catch (error) {
        console.error(`Error fetching data for start=${start}:`, error);
        return [];
    }
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const numPages = Math.min(parseInt(req.query.numPages as string) || 17, 17);
    const requests = Array.from({ length: numPages }, (_, i) => fetchData(i * increment));
    
    // execute all requests in parallel and collect the results
    const allResults = (await Promise.all(requests)).flat();
    res.status(200).json({ results: allResults });
};
