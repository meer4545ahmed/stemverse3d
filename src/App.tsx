import React from 'react';
import { Atom, Compass, Search, User } from 'lucide-react';
import { useAppStore } from './store/useAppStore';
import { TopNavBar } from './components/TopNavBar';
import { SplashScreen } from './screens/SplashScreen';
import { HomeScreen } from './screens/HomeScreen';
import { SubjectScreen } from './screens/SubjectScreen';
import { ExperimentDetailScreen } from './screens/ExperimentDetailScreen';
import { LaboratoryScreen } from './screens/LaboratoryScreen';
import { SearchScreen } from './screens/SearchScreen';
import { ProfileScreen } from './screens/ProfileScreen';

export default function App() {
  const { screen, navigateTo, openSubject } = useAppStore();

  if (screen === 'splash') {
    return <SplashScreen />;
  }

  if (screen === 'lab') {
    return <LaboratoryScreen />;
  }

  return (
    <div className="min-h-screen bg-[#06070B] text-[#F4F6FA] flex flex-col">
      <TopNavBar />

      <div className="flex-1 bg-[#06070B]">
        {screen === 'home' && <HomeScreen />}
        {screen === 'subject' && <SubjectScreen />}
        {screen === 'experiment' && <ExperimentDetailScreen />}
        {screen === 'search' && <SearchScreen />}
        {screen === 'profile' && <ProfileScreen />}
      </div>

      {/* Mobile Thumb Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-[#0B0D13] border-t border-[#222736] grid grid-cols-4">
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            screen === 'home' ? 'text-[#38BDF8]' : 'text-[#8B93A7]'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Home</span>
        </button>
        <button
          type="button"
          onClick={() => openSubject('physics')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            screen === 'subject' ? 'text-[#38BDF8]' : 'text-[#8B93A7]'
          }`}
        >
          <Atom className="w-4 h-4" />
          <span>Labs</span>
        </button>
        <button
          type="button"
          onClick={() => navigateTo('search')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            screen === 'search' ? 'text-[#38BDF8]' : 'text-[#8B93A7]'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Search</span>
        </button>
        <button
          type="button"
          onClick={() => navigateTo('profile')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            screen === 'profile' ? 'text-[#F59E0B]' : 'text-[#8B93A7]'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}
