import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { load } from 'cheerio';
import rateLimitMiddleware from "@/middleware/rateLimiter";

const detailBaseUrl = "https://www.greek-language.gr";

const fetchDetailData = async (url: string) => {
    try {
        const response = await axios.get(url);
        const html = response.data;
        const $ = load(html);

        // get the text itself
        const details: { type: string, content: string }[] = [];
        $(".well.white .page").children().each((index, element) => {
            const type = element.tagName;
            const content = $(element).html()?.trim() || '';
            details.push({ type, content });
        });

        return details;
    } catch (error) {
        console.error(`Error fetching data from ${url}:`, error);
        return [];
    }
};

async function handler (req: NextApiRequest, res: NextApiResponse) {
    const { results } = req.body;

    if (!Array.isArray(results)) {
        return res.status(400).json({ error: "Invalid input. Expected an array of items." });
    }

    // create an array of promises for all the requests
    const requests = results.map(item => 
        fetchDetailData(`${detailBaseUrl}${item.link}`).then(details => ({
            ...item,
            text: details
        }))
    );

    // execute all requests in parallel and collect the results
    const allResults = await Promise.all(requests);
    res.status(200).json({ results: allResults });
};

export default rateLimitMiddleware(handler);