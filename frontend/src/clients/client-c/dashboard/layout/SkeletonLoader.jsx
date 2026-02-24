import VerticalSidebar from '../../common/Layout/VerticalSidebar';
import Header from '../../common/Layout/Header';
import { Loader2 } from 'lucide-react';

const SkeletonLoader = () => (
  <div className="min-h-screen bg-[#f8faf9] text-slate-800 font-sans">
    <VerticalSidebar />
    <Header title="Loading..." />
    <main className="ml-[72px] lg:ml-[240px] pt-[64px] min-h-screen">
      <div className="p-4 lg:p-6 space-y-4 max-w-[1920px] mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin text-[#1EA88A]" size={48} />
        </div>
      </div>
    </main>
  </div>
);

export default SkeletonLoader;