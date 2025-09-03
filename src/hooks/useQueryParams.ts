import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

type Primitive = string | number | boolean | null | undefined;

export function useQueryParams<T extends Record<string, Primitive>>() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(() => {
    const obj: Record<string, Primitive> = {};
    searchParams.forEach((value, key) => {
      obj[key] = value;
    });
    return obj as T;
  }, [searchParams]);

  const updateParams = (updates: Partial<T>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });
    setSearchParams(next, { replace: true });
  };

  return [params, updateParams] as const;
}


