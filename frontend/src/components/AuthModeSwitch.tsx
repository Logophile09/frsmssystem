import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Sliding pill switch used at the top of both the Login and Register
 * cards. Clicking the inactive side navigates to the other auth route;
 * the sliding highlight behind the labels is what gives the "flip"
 * feel, paired with the directional entrance animation applied by
 * <AuthFlipTransition> on the page you land on.
 *
 * Usage (inside the card, above the form):
 *   <AuthModeSwitch active="signin" />   // on Login.tsx
 *   <AuthModeSwitch active="register" /> // on Register.tsx
 */
export function AuthModeSwitch({ active }: { active: 'signin' | 'register' }) {
  const navigate = useNavigate();

  function go(mode: 'signin' | 'register') {
    if (mode === active) return;
    // direction: moving right into Register, left back into Sign in --
    // read by AuthFlipTransition on the destination page via router state.
    const direction = mode === 'register' ? 'right' : 'left';
    navigate(mode === 'signin' ? '/login' : '/register', { state: { authDir: direction } });
  }

  return (
    <div className="relative grid grid-cols-2 rounded-full border border-white/10 bg-white/5 p-1 text-sm font-semibold">
      {/* sliding highlight */}
      <div
        className="absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-flagred-500 shadow-md shadow-flagred-500/30 transition-transform duration-300 ease-smooth"
        style={{ transform: active === 'signin' ? 'translateX(0%)' : 'translateX(calc(100% + 8px))' }}
      />
      <button
        type="button"
        onClick={() => go('signin')}
        className={`relative z-10 rounded-full py-2 transition-colors duration-300 ${
          active === 'signin' ? 'text-white' : 'text-navy-300 hover:text-navy-100'
        }`}
      >
        Sign in
      </button>
      <button
        type="button"
        onClick={() => go('register')}
        className={`relative z-10 rounded-full py-2 transition-colors duration-300 ${
          active === 'register' ? 'text-white' : 'text-navy-300 hover:text-navy-100'
        }`}
      >
        Register
      </button>
    </div>
  );
}

/**
 * Wraps the auth card content and plays a directional slide-in based on
 * which side of the pill switch was just clicked (read from router
 * state set by AuthModeSwitch above). Falls back to a plain fade-up
 * (the existing 'page-in' animation) on a direct visit/refresh, where
 * there's no direction to infer.
 */
export function AuthFlipTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const dir = (location.state as { authDir?: 'left' | 'right' } | null)?.authDir;
  const animationClass =
    dir === 'right' ? 'animate-auth-slide-from-right' : dir === 'left' ? 'animate-auth-slide-from-left' : 'animate-page-in';

  // key={dir + pathname} forces a remount on every switch so the
  // animation replays each time instead of only on first mount.
  return (
    <div key={`${dir ?? 'initial'}-${location.pathname}`} className={animationClass}>
      {children}
    </div>
  );
}
