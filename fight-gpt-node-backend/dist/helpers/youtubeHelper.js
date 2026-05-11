"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeYoutubeUrl = normalizeYoutubeUrl;
exports.isBadVideoTitle = isBadVideoTitle;
/**
 * Standardizes YouTube URLs to a consistent format
 */
function normalizeYoutubeUrl(url) {
    if (!url)
        return '';
    try {
        let videoId = '';
        if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/').pop()?.split(/[?&]/)[0] || '';
        }
        else if (url.includes('v=')) {
            videoId = url.split('v=')[1]?.split('&')[0] || '';
        }
        else if (url.includes('shorts/')) {
            videoId = url.split('shorts/').pop()?.split(/[?&]/)[0] || '';
        }
        else if (url.includes('watch?v=')) {
            videoId = url.split('watch?v=')[1]?.split('&')[0] || '';
        }
        else {
            // Try to extract ID from URL if it's just the ID or some other format
            const match = url.match(/(?:v=|be\/|shorts\/)([\w-]{11})/);
            if (match) {
                videoId = match[1];
            }
            else {
                return url;
            }
        }
        return `https://www.youtube.com/watch?v=${videoId}`;
    }
    catch (e) {
        return url;
    }
}
/**
 * Checks if a title indicates low-quality or non-match content
 */
function isBadVideoTitle(title) {
    const lower = title.toLowerCase();
    const badKeywords = [
        'compilation', 'highlights', 'best of', 'top 10', 'top 5',
        'funny moments', 'vlog', 'setup', 'tutorial', 'combo guide',
        'how to play', 'tier list', 'teaser', 'trailer', 'reaction',
        'guide', 'tips', 'tricks', 'how to'
    ];
    return badKeywords.some(kw => lower.includes(kw));
}
//# sourceMappingURL=youtubeHelper.js.map