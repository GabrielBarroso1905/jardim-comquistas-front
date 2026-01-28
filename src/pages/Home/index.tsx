import { useAchievements } from './hooks/useAchievements';
import Sky from './components/Sky';
import Landscape from './components/Landscape';
import HillOutline from './components/HillOutline';
import FloorElements from './components/Elements/Floor/FloorElements';
import SkyElements from './components/Elements/Sky/SkyElements';

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
      {/* <HillOutline/> */}
      <FloorElements />
      <SkyElements />
    </div>
  );
};

export default Home;