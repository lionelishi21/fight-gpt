import { Storage } from '@google-cloud/storage';
import { streamYoutubeToGcs } from '../src/helpers/youtubeDownloader';

async function main() {
  console.log("Testing yt-dlp video ingestion to GCS...");
  const storage = new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT || 'metapunish-493915',
  });
  const bucketName = process.env.GOOGLE_STORAGE_BUCKET || 'metapunish-storage-bucket';
  
  // Use a short video for testing (e.g., YouTube short or a 10s clip)
  // "Me at the zoo" - very short
  const youtubeUrl = "https://www.youtube.com/watch?v=jNQXAC9IVRw"; 
  const fileName = `test-ingestion/test-video-${Date.now()}.mp4`;

  try {
    console.log(`Downloading ${youtubeUrl}...`);
    const gcsPath = await streamYoutubeToGcs(youtubeUrl, storage, bucketName, fileName);
    console.log(`Success! Video saved to ${gcsPath}`);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

main();
