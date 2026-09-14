import { WallpaperProvider } from "@/context/WallpaperContext";
import MainPage from "@/components/pages/home/MainPage";

export default function Home() {
  return (
    <WallpaperProvider>
      <MainPage />
    </WallpaperProvider>
  );
}
