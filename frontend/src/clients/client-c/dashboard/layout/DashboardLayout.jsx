import VerticalSidebar from '../../common/Layout/VerticalSidebar';
import Header from '../../common/Layout/Header';

const DashboardLayout = ({ title, children, anomalies = [], anomaliesCount = 0 }) => {
  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-800 font-sans">
      <VerticalSidebar />

      <Header
        title={title}
        anomalies={anomalies}
        anomaliesCount={anomaliesCount}
      />

      <main className="ml-[72px] lg:ml-[240px] pt-[64px] min-h-screen">
        <div className="p-4 lg:p-6 max-w-[1920px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
