'use client';

import { useState, useEffect, useCallback } from 'react';

interface YouTubeApiStatus {
  configured: boolean;
  valid: boolean;
  error?: string;
  loading: boolean;
}

export function useYouTubeApi() {
  const [status, setStatus] = useState<YouTubeApiStatus>({
    configured: false,
    valid: false,
    loading: true,
  });

  const checkStatus = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true }));
      const res = await fetch('/api/youtube', { method: 'POST' });
      const data = await res.json();
      setStatus({
        configured: data.configured,
        valid: data.valid,
        error: data.error,
        loading: false,
      });
    } catch {
      setStatus({
        configured: false,
        valid: false,
        loading: false,
      });
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const searchNiches = useCallback(async (query: string, maxResults = 20) => {
    const params = new URLSearchParams({
      action: 'niche-search',
      q: query,
      maxResults: String(maxResults),
    });
    const res = await fetch(`/api/youtube?${params}`);
    return res.json();
  }, []);

  const searchVideos = useCallback(async (query: string, type = 'video', maxResults = 10) => {
    const params = new URLSearchParams({
      action: 'search',
      q: query,
      type,
      maxResults: String(maxResults),
    });
    const res = await fetch(`/api/youtube?${params}`);
    return res.json();
  }, []);

  const getChannelStats = useCallback(async (channelId: string) => {
    const params = new URLSearchParams({
      action: 'channel-stats',
      channelId,
    });
    const res = await fetch(`/api/youtube?${params}`);
    return res.json();
  }, []);

  const getChannelVideos = useCallback(async (channelId: string, maxResults = 10) => {
    const params = new URLSearchParams({
      action: 'channel-videos',
      channelId,
      maxResults: String(maxResults),
    });
    const res = await fetch(`/api/youtube?${params}`);
    return res.json();
  }, []);

  const getTrending = useCallback(async (regionCode = 'US', categoryId?: string) => {
    const params = new URLSearchParams({
      action: 'trending',
      regionCode,
    });
    if (categoryId) params.set('categoryId', categoryId);
    const res = await fetch(`/api/youtube?${params}`);
    return res.json();
  }, []);

  return {
    status,
    searchNiches,
    searchVideos,
    getChannelStats,
    getChannelVideos,
    getTrending,
    refreshStatus: checkStatus,
  };
}
