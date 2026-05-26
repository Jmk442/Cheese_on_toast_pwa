import { Link, useLocation } from "react-router-dom";
import { Flame, Home, BookOpen, Cpu } from "lucide-react";

export const Layout = ({ children }) => {
  const loc = useLocation();
  const navItem = (to, label, icon, tid) => {
    const active = loc.pathname === to || (to !== "/" && loc.pathname.startsWith(to));
    return (
      <Link
        to={to}
        data-testid={tid}
        className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 border-t-2 transition-colors ${
          active ? "border-brand-primary text-brand-primary" : "border-transparent text-foreground/60 hover:text-foreground"
        }`}
      >
        <span className="text-current">{icon}</span>
        <span className="text-[10px] tracking-widest uppercase font-mono">{label}</span>
      </Link>
    );
  };

  return (
    <div className="App relative z-[2] min-h-screen flex flex-col" data-testid="app-shell">
      <header className="sticky top-0 z-30 border-b-2 border-white/90 bg-ink/95 backdrop-blur">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between gap-2">
          <Link to="/" data-testid="brand-link" className="flex items-center gap-2 group">
            <span className="inline-flex w-7 h-7 items-center justify-center bg-brand-primary text-ink border-2 border-white">
              <Flame size={16} strokeWidth={2.5} />
            </span>
            <span className="font-display font-black uppercase text-sm sm:text-base tracking-tight">
              Cheese<span className="text-brand-primary">/</span>Toast
            </span>
          </Link>
          <div className="flex items-center gap-2">
          <Link
            to="/achievements"
            data-testid="header-trophy-link"
            className="text-[10px] sm:text-xs font-mono uppercase tracking-widest px-2 py-1 border-2 border-white/60 text-foreground hover:border-brand-primary hover:text-brand-primary transition-colors"
          >
            Trophies
          </Link>
          <Link
            to="/simulator"
            data-testid="header-sim-link"
            className="text-[10px] sm:text-xs font-mono uppercase tracking-widest px-2 py-1 border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-ink transition-colors"
          >
            Sandbox
          </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-5 pb-28 pt-4">{children}</main>

      <nav
        data-testid="bottom-nav"
        className="fixed bottom-0 inset-x-0 z-30 border-t-2 border-white/90 bg-ink/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
      >
        <div className="max-w-3xl mx-auto flex">
          {navItem("/", "Home", <Home size={20} />, "nav-home")}
          {navItem("/recipes", "Recipes", <BookOpen size={20} />, "nav-recipes")}
          {navItem("/simulator", "Sandbox", <Cpu size={20} />, "nav-sim")}
        </div>
      </nav>
    </div>
  );
};
