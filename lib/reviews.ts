import { readdir } from "node:fs/promises";
import { marked } from "marked";
import qs from "qs";

const CMS_URL = "http://localhost:1337";

interface CmsItem {
    id: number;
    attributes: any;
}
export interface Review {
    slug: string;
    title: string;
    date: string;
    image: string;
}

export interface FullReview extends Review {
    body: string;
}

// TODO getFeaturedReview
export async function getFeaturedReview(): Promise<Review> {
    const reviews = await getReviews();
    return reviews[0];
}

export async function getReview(slug: string): Promise<FullReview> {
    const { data } = await fetchReviews({
        filters: { slug: { $eq: slug} },
        fields: ["slug", "title", "subtitle", "publishedAt", "body"],
        populate: { image: { fields: ["url"] } },
        pagination: { pageSize: 1, withCount: false },
    });
    const item = data[0];
    return {
        ...toReveiw(item),
        body: marked(item.attributes.body, { headerIds: false, mangle: false }),
    };
}

export async function getReviews(): Promise<Review[]> {
    const { data } = await fetchReviews({
        fields: ["slug", "title", "subtitle", "publishedAt"],
        populate: { image: { fields: ["url"] } },
        sort: ["publishedAt:desc"],
        pagination: { pageSize: 6 },
    });
    return data.map(toReveiw);
}

export async function getSlugs(): Promise<string[]> {
    const files = await readdir("./content/reviews");
    return files.filter((file) => file.endsWith(".md"))
        .map((file) => file.slice(0, -".md".length));
}

async function fetchReviews(params: any) {
    const url = `${CMS_URL}/api/reviews?` 
    + qs.stringify(params, {encodeValuesOnly: true});
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`CMS returned ${response.status} for ${url}`)
    }
    return await response.json();
}

function toReveiw(item: CmsItem): Review {
    const { attributes } = item;
    return {
        slug: attributes.slug,
        title: attributes.title,
        date: attributes.publishedAt.slice(0, "yyyy-mm-dd".length),
        image: CMS_URL + attributes.image.data.attributes.url,
    };
}