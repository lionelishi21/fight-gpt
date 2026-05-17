/**
 * Standardizes YouTube URLs to a consistent format
 */
export function normalizeYoutubeUrl(url: string): string {
  if (!url) return '';
  
  // If it's a Twitch URL, don't try to parse it as YouTube
  if (url.includes('twitch.tv')) {
    return url;
  }

  try {
    let videoId = '';
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/').pop()?.split(/[?&]/)[0] || '';
    } else if (url.includes('v=')) {
      videoId = url.split('v=')[1]?.split('&')[0] || '';
    } else if (url.includes('shorts/')) {
      videoId = url.split('shorts/').pop()?.split(/[?&]/)[0] || '';
    } else if (url.includes('watch?v=')) {
      videoId = url.split('watch?v=')[1]?.split('&')[0] || '';
    } else {
      // Try to extract ID from URL if it's just the ID or some other format
      const match = url.match(/(?:v=|be\/|shorts\/)([\w-]{11})/);
      if (match) {
        videoId = match[1];
      } else {
        return url;
      }
    }
    return `https://www.youtube.com/watch?v=${videoId}`;
  } catch (e) {
    return url;
  }
}

/**
 * Checks if a title indicates low-quality or non-match content.
 * Returns true if the video should be SKIPPED (not gameplay).
 */
export function isBadVideoTitle(title: string): boolean {
  const lower = title.toLowerCase();
  const badKeywords = [
    // Non-gameplay formats
    'compilation', 'highlights', 'best of', 'top 10', 'top 5',
    'funny moments', 'vlog', 'setup', 'tutorial', 'combo guide',
    'how to play', 'tier list', 'teaser', 'trailer', 'reaction',
    'guide', 'tips', 'tricks', 'how to',
    // Talk/discussion/IRL content
    'podcast', 'interview', 'stream highlights', 'irl', 'talk show',
    'commentary', 'discussion', 'q&a', 'q & a', 'collab', 'just chatting',
    'wedding', 'birthday', 'unboxing', 'cooking', 'travel', 'news',
    // Low-signal video types
    'montage', 'funniest', 'rage', 'fails', 'moments', 'review',
    'ranked climb', 'season recap', 'retrospective',
  ];
  return badKeywords.some(kw => lower.includes(kw));
}
