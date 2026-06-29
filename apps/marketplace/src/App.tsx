import { Routes, Route } from "react-router-dom";
import { InstallTargetProvider } from "./app/InstallTargetContext";
import { AppShell } from "./app/AppShell";
import Collection from "./routes/Collection";
import PackFeature from "./routes/PackFeature";
import ConfigureInstall from "./routes/ConfigureInstall";
import GalleyProof from "./routes/GalleyProof";
import PressChecklist from "./routes/PressChecklist";
import Library from "./routes/Library";

export default function App() {
  return (
    <InstallTargetProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Collection />} />
          <Route path="pack/:id" element={<PackFeature />} />
          <Route path="pack/:id/install" element={<ConfigureInstall />} />
          <Route path="pack/:id/install/proof" element={<GalleyProof />} />
          <Route path="pack/:id/activate" element={<PressChecklist />} />
          <Route path="library" element={<Library />} />
        </Route>
      </Routes>
    </InstallTargetProvider>
  );
}
