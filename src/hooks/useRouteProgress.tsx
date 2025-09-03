import { useEffect, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export function useRouteProgress() {
  const location = useLocation();
  const navType = useNavigationType();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(true);
    const id = setTimeout(() => setActive(false), 500);
    return () => clearTimeout(id);
  }, [location, navType]);

  const ProgressBar = () => (
    <div
      aria-hidden="true"
      className={`fixed left-0 right-0 top-0 h-0.5 z-50 ${active ? 'opacity-100' : 'opacity-0'} transition-opacity`}
    >
      <div className="h-full w-full bg-primary animate-[progress_0.5s_ease-out]" />
      <style>{`@keyframes progress{0%{transform:translateX(-100%)}100%{transform:translateX(0)}}`}</style>
    </div>
  );

  return { ProgressBar };
}


