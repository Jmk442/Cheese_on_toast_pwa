import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";
import RecipeDetail from "@/pages/RecipeDetail";
import RecipeList from "@/pages/RecipeList";
import Simulator from "@/pages/Simulator";
import RiceSimulator from "@/pages/RiceSimulator";
import SaucepanSimulator from "@/pages/SaucepanSimulator";
import Achievements from "@/pages/Achievements";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recipes" element={<RecipeList />} />
          <Route path="/recipe/:slug" element={<RecipeDetail />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/simulator/boiled-rice" element={<RiceSimulator />} />
          <Route path="/simulator/saucepan-heating" element={<SaucepanSimulator />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
