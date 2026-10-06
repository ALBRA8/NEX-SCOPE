import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';
import { safeErrorMessage, logError } from '@/lib/errors';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Cap maxResults so an anonymous or malicious caller cannot request 10k videos
// and burn the server's quota in a single hit.
const MAX_RESULTS_CAP = 50;

function clampMaxResults(raw: string | null): string {
  const n = Number.parseInt(raw || '', 10);
  if (!Number.isFinite(n) || n <= 0) return '10';
  return String(Math.min(n, MAX_RESULTS_CAP));
}

async function getApiKey(): Promise<string | null> {
  // First check the database (set via Settings UI)
  try {
    const setting = await db.setting.findUnique({ where: { key: 'YOUTUBE_API_KEY' } });
    if (setting?.value) return setting.value;
  } catch {
    // DB not available, fall through
  }
  // Fallback to environment variable
  return process.env.YOUTUBE_API_KEY || null;
}

// Search for niches/channels/videos
export async function GET(request: NextRequest) {
  // ━━ Auth gate — every YouTube API call uses the server key, so anonymous
  // abuse would burn quota. Require an authenticated session. ━━
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const apiKey = await getApiKey();

  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'YouTube API key not configured',
        message: 'Please add your YOUTUBE_API_KEY in Settings',
        setup: true,
      },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'search';

  try {
    switch (action) {
      case 'search': {
        const query = searchParams.get('q');
        const type = searchParams.get('type') || 'video';
        const maxResults = clampMaxResults(searchParams.get('maxResults'));
        const regionCode = searchParams.get('regionCode') || 'US';
        const relevanceLanguage = searchParams.get('relevanceLanguage') || 'es';

        if (!query) {
          return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
        }

        const params = new URLSearchParams({
          part: 'snippet',
          q: query,
          type,
          maxResults,
          regionCode,
          relevanceLanguage,
          key: apiKey,
        });

        const response = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);
        const data = await response.json();

        if (data.error) {
          return NextResponse.json({ error: data.error.message }, { status: data.error.code || 500 });
        }

        return NextResponse.json(data);
      }

      case 'channel-stats': {
        const channelId = searchParams.get('channelId');
        const handle = searchParams.get('handle');

        if (!channelId && !handle) {
          return NextResponse.json({ error: 'channelId or handle parameter required' }, { status: 400 });
        }

        const params = new URLSearchParams({
          part: 'snippet,statistics,brandingSettings,contentDetails',
          key: apiKey,
        });

        if (channelId) {
          params.set('id', channelId);
        } else if (handle) {
          params.set('forHandle', handle);
        }

        const response = await fetch(`${YOUTUBE_API_BASE}/channels?${params}`);
        const data = await response.json();

        if (data.error) {
          return NextResponse.json({ error: data.error.message }, { status: data.error.code || 500 });
        }

        return NextResponse.json(data);
      }

      case 'channel-videos': {
        const channelId = searchParams.get('channelId');
        const maxResults = clampMaxResults(searchParams.get('maxResults'));

        if (!channelId) {
          return NextResponse.json({ error: 'channelId parameter required' }, { status: 400 });
        }

        const channelParams = new URLSearchParams({
          part: 'contentDetails',
          id: channelId,
          key: apiKey,
        });

        const channelResponse = await fetch(`${YOUTUBE_API_BASE}/channels?${channelParams}`);
        const channelData = await channelResponse.json();

        if (channelData.error) {
          return NextResponse.json({ error: channelData.error.message }, { status: channelData.error.code || 500 });
        }

        const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

        if (!uploadsPlaylistId) {
          return NextResponse.json({ error: 'Could not find uploads playlist' }, { status: 404 });
        }

        const playlistParams = new URLSearchParams({
          part: 'snippet,contentDetails',
          playlistId: uploadsPlaylistId,
          maxResults,
          key: apiKey,
        });

        const playlistResponse = await fetch(`${YOUTUBE_API_BASE}/playlistItems?${playlistParams}`);
        const playlistData = await playlistResponse.json();

        if (playlistData.error) {
          return NextResponse.json({ error: playlistData.error.message }, { status: playlistData.error.code || 500 });
        }

        const videoIds = playlistData.items?.map((item: any) => item.contentDetails?.videoId).filter(Boolean).join(',');

        if (videoIds) {
          const videoParams = new URLSearchParams({
            part: 'snippet,statistics',
            id: videoIds,
            key: apiKey,
          });

          const videoResponse = await fetch(`${YOUTUBE_API_BASE}/videos?${videoParams}`);
          const videoData = await videoResponse.json();
          return NextResponse.json({ ...playlistData, videoStats: videoData });
        }

        return NextResponse.json(playlistData);
      }

      case 'video-categories': {
        const regionCode = searchParams.get('regionCode') || 'US';

        const params = new URLSearchParams({
          part: 'snippet',
          regionCode,
          key: apiKey,
        });

        const response = await fetch(`${YOUTUBE_API_BASE}/videoCategories?${params}`);
        const data = await response.json();

        if (data.error) {
          return NextResponse.json({ error: data.error.message }, { status: data.error.code || 500 });
        }

        return NextResponse.json(data);
      }

      case 'trending': {
        const regionCode = searchParams.get('regionCode') || 'US';
        const categoryId = searchParams.get('categoryId') || '';
        const maxResults = clampMaxResults(searchParams.get('maxResults'));

        const params = new URLSearchParams({
          part: 'snippet,statistics',
          chart: 'mostPopular',
          regionCode,
          maxResults,
          key: apiKey,
        });

        if (categoryId) {
          params.set('videoCategoryId', categoryId);
        }

        const response = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`);
        const data = await response.json();

        if (data.error) {
          return NextResponse.json({ error: data.error.message }, { status: data.error.code || 500 });
        }

        return NextResponse.json(data);
      }

      case 'niche-search': {
        // Advanced niche search - searches for channels in a niche
        const query = searchParams.get('q');
        const maxResults = clampMaxResults(searchParams.get('maxResults'));

        if (!query) {
          return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
        }

        const searchParams_ = new URLSearchParams({
          part: 'snippet',
          q: query,
          type: 'channel',
          maxResults,
          relevanceLanguage: 'es',
          key: apiKey,
        });

        const searchResponse = await fetch(`${YOUTUBE_API_BASE}/search?${searchParams_}`);
        const searchData = await searchResponse.json();

        if (searchData.error) {
          return NextResponse.json({ error: searchData.error.message }, { status: searchData.error.code || 500 });
        }

        const channelIds = searchData.items?.map((item: any) => item.snippet?.channelId).filter(Boolean).join(',');

        if (!channelIds) {
          return NextResponse.json({ items: [], channels: [] });
        }

        const channelParams = new URLSearchParams({
          part: 'snippet,statistics',
          id: channelIds,
          key: apiKey,
        });

        const channelResponse = await fetch(`${YOUTUBE_API_BASE}/channels?${channelParams}`);
        const channelData = await channelResponse.json();

        if (channelData.error) {
          return NextResponse.json({ error: channelData.error.message }, { status: channelData.error.code || 500 });
        }

        return NextResponse.json({
          searchResults: searchData.items,
          channelDetails: channelData.items,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    logError('YouTube API', error);
    return NextResponse.json(
      { error: safeErrorMessage(error, 'Internal server error') },
      { status: 500 }
    );
  }
}

// Check API key status
export async function POST(request: NextRequest) {
  // ━━ Auth gate — POST tests the server's API key; do not expose to anonymous. ━━
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const apiKey = await getApiKey();

  if (!apiKey) {
    return NextResponse.json({ configured: false });
  }

  // Test the key with a simple request
  try {
    const params = new URLSearchParams({
      part: 'snippet',
      chart: 'mostPopular',
      regionCode: 'US',
      maxResults: '1',
      key: apiKey,
    });

    const response = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`);
    const data = await response.json();

    if (data.error) {
      return NextResponse.json({
        configured: true,
        valid: false,
        error: data.error.message,
      });
    }

    return NextResponse.json({
      configured: true,
      valid: true,
      quotaRemaining: data.pageInfo?.totalResults || 0,
    });
  } catch (error: any) {
    return NextResponse.json({
      configured: true,
      valid: false,
      error: safeErrorMessage(error, 'Unknown error'),
    });
  }
}
