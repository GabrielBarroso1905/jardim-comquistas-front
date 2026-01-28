import { useAchievements } from './hooks/useAchievements';
import Sky from './components/Sky';
import Landscape from './components/Landscape';
import Elements from './components/Elements';

const Home = () => {
  const { loading } = useAchievements();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-lg">Carregando jardim...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <Sky />
      <Landscape />
      <Elements />
    </div>
  );
};

export default Home;