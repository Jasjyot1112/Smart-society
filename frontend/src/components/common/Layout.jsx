import Sidebar from './Sidebar';
import Navbar from './Navbar';
import FAB from './FAB';
import SOSOverlay from '../security/SOSOverlay';

const Layout = ({ children, title }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-dark-950 relative">
      <SOSOverlay />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar title={title} />
        {/* pb-16 on mobile prevents content from hiding behind the bottom nav bar */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-dark-950 pb-20 lg:pb-6 relative">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
      <FAB />
    </div>
  );
};

export default Layout;
