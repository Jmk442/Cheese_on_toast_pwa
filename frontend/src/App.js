import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PremiumProvider } from "@/context/PremiumContext";
import { PaywallTrigger } from "@/components/PaywallTrigger";
import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";
import RecipeDetail from "@/pages/RecipeDetail";
import RecipeList from "@/pages/RecipeList";
import Simulator from "@/pages/Simulator";
import RiceSimulator from "@/pages/RiceSimulator";
import SaucepanSimulator from "@/pages/SaucepanSimulator";
import Achievements from "@/pages/Achievements";
import Paywall from "@/pages/Paywall";
import PaywallSuccess from "@/pages/PaywallSuccess";
import Collections from "@/pages/Collections";
import CollectionDetail from "@/pages/CollectionDetail";
import MealPlan from "@/pages/MealPlan";
import GroceryList from "@/pages/GroceryList";
import SavedRecipes from "@/pages/SavedRecipes";
import Settings from "@/pages/Settings";
import AuthVerify from "@/pages/AuthVerify";

function App() {
  return (
    <BrowserRouter>
      <PremiumProvider>
        <Layout>
          <PaywallTrigger />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/recipes" element={<RecipeList />} />
            <Route path="/recipe/:slug" element={<RecipeDetail />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/simulator/boiled-rice" element={<RiceSimulator />} />
            <Route path="/simulator/saucepan-heating" element={<SaucepanSimulator />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/premium" element={<Paywall />} />
            <Route path="/premium/success" element={<PaywallSuccess />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/collections/:slug" element={<CollectionDetail />} />
            <Route path="/meal-plan" element={<MealPlan />} />
            <Route path="/grocery-list" element={<GroceryList />} />
            <Route path="/saved" element={<SavedRecipes />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/auth/verify" element={<AuthVerify />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Layout>
      </PremiumProvider>
    </BrowserRouter>
  );
}

export default App;
