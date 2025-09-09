import { useSearchParams } from 'react-router-dom';

export default function TestCallback() {
  const [searchParams] = useSearchParams();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Auth Callback Test</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">URL Parameters:</h2>
          <div className="space-y-2 text-left">
            {Array.from(searchParams.entries()).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-medium">{key}:</span>
                <span className="text-gray-600 break-all">{value}</span>
              </div>
            ))}
          </div>
          {searchParams.size === 0 && (
            <p className="text-gray-500">No parameters found</p>
          )}
        </div>
      </div>
    </div>
  );
}
