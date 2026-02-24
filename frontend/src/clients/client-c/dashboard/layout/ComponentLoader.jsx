import { Loader2 } from 'lucide-react';

const ComponentLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <Loader2 className="animate-spin text-[#1EA88A]" size={32} />
  </div>
);

export default ComponentLoader;