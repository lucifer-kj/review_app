import { useEffect, useState } from 'react';

interface MagicLinkData {
  pathname: string;
  hash: string;
  timestamp: number;
  processed: boolean;
}

export default function MagicLinkDebugger() {
  const [magicLinkData, setMagicLinkData] = useState<MagicLinkData | null>(null);
  const [urlInfo, setUrlInfo] = useState({
    href: '',
    pathname: '',
    search: '',
    hash: '',
  });

  useEffect(() => {
    // Get current URL info
    setUrlInfo({
      href: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
    });

    // Check for magic link data
    const data = (window as any).getMagicLinkData?.();
    if (data) {
      setMagicLinkData(data);
    }
  }, []);

  const clearMagicLinkData = () => {
    sessionStorage.removeItem('magic_link_data');
    setMagicLinkData(null);
  };

  const markAsProcessed = () => {
    (window as any).markMagicLinkProcessed?.();
    const data = (window as any).getMagicLinkData?.();
    setMagicLinkData(data);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <h3 className="font-bold text-sm mb-2">🔗 Magic Link Debugger</h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Current URL:</strong>
          <div className="break-all text-gray-600">{urlInfo.href}</div>
        </div>
        
        <div>
          <strong>Pathname:</strong> {urlInfo.pathname}
        </div>
        
        <div>
          <strong>Search:</strong> {urlInfo.search || 'None'}
        </div>
        
        <div>
          <strong>Hash:</strong> {urlInfo.hash || 'None'}
        </div>
        
        {magicLinkData && (
          <div className="border-t pt-2">
            <strong>Magic Link Data:</strong>
            <div className="bg-gray-100 p-2 rounded text-xs">
              <div>Pathname: {magicLinkData.pathname}</div>
              <div>Hash: {magicLinkData.hash.substring(0, 50)}...</div>
              <div>Processed: {magicLinkData.processed ? '✅' : '❌'}</div>
              <div>Timestamp: {new Date(magicLinkData.timestamp).toLocaleTimeString()}</div>
            </div>
            
            <div className="flex gap-2 mt-2">
              <button
                onClick={markAsProcessed}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                disabled={magicLinkData.processed}
              >
                Mark Processed
              </button>
              <button
                onClick={clearMagicLinkData}
                className="px-2 py-1 bg-red-500 text-white rounded text-xs"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
