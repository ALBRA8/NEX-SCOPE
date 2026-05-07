import { NextRequest, NextResponse } from 'next/server';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

function getApiKey(): string | null {
  return process.env.YOUTUBE_API_KEY || null;
}

// Search for niches/channels/videos
export async function GET(request: NextRequest) {
  const apiKey = getApiKey();

  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'YouTube API key not configured',
        message: 'Please add your YOUTUBE_API_KEY to the .env.local file',
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
        const maxResults = searchParams.get('maxResults') || '10';
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
        const maxResults = searchParams.get('maxResults') || '10';

        if (!channelId) {
          return NextResponse.json({ error: 'channelId parameter required' }, { status: 400 });
        }

        // First get the uploads playlist ID
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

        // Then get the videos from the playlist
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

        // Get video statistics
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
        const maxResults = searchParams.get('maxResults') || '10';

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
        const maxResults = searchParams.get('maxResults') || '20';

        if (!query) {
          return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
        }

        // Search for channels
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

        // Get channel statistics for all found channels
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
    console.error('[YouTube API Error]', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// Check API key status
export async function POST(request: NextRequest) {
  const apiKey = getApiKey();

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
      error: error.message,
    });
  }
}
