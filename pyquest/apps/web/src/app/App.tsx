import { Navigate, Outlet, Route, Routes } from 'react-router';
import { color, font } from '../design/tokens';
import { Rail } from '../shell/Rail';
import { AreaScreen } from '../screens/AreaScreen';
import { BossScreen } from '../screens/BossScreen';
import { DefendScreen } from '../screens/DefendScreen';
import { MapScreen } from '../screens/MapScreen';
import { ConsoleScreen } from '../screens/ConsoleScreen';
import { JournalScreen } from '../screens/OverlandScreens';
import { TomeScreen } from '../screens/TomeScreen';
import { PartyScreen } from '../screens/PartyScreen';
import { QuestScreen } from '../screens/QuestScreen';
import { SignInScreen } from '../screens/SignInScreen';
import { SessionProvider, useSession } from '../session/SessionProvider.tsx';

/**
 * The shell: the rail, then whatever screen you are standing on.
 *
 * The rail is outside the `Routes` on purpose — its six destinations are "true wherever you
 * are standing" (§6.8), so they are mounted once and never remounted by navigation. A rail
 * rebuilt per route is a rail that can disagree with itself.
 */
function Shell() {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: color.bg,
        color: color.fg,
        fontFamily: font.sans,
        fontSize: '14px',
        lineHeight: 1.5,
      }}
    >
      {/*
        * The rail's badge is gone for now. It is a count the shell would have to fetch on every
        * route to keep honest, and a stale badge is worse than none — it tells him work is
        * waiting when it is not, or hides work that is. Defend owns that number; the rail carries
        * it again when something pushes it rather than the shell polling for it.
        */}
      <Rail />
      <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
    </div>
  );
}

/**
 * The whole app, once somebody is signed in — and the sign-in screen until they are.
 *
 * **Three states, not two.** The moment between a reload and `GET /api/me` answering is its own
 * state: treating it as signed-out flashes the sign-in form at somebody who is already signed in,
 * on every single reload. Rendering nothing for that beat is the correct answer.
 *
 * The routes are not merely hidden while signed out — they are not mounted at all, which is what
 * lets `usePlayer()` promise an id rather than an id-or-undefined. Six screens would otherwise
 * each have to invent an answer for a case that cannot happen.
 */
function Routed() {
  const { status } = useSession();

  if (status === 'loading') return null;
  if (status === 'out') return <SignInScreen />;

  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Navigate to="/map" replace />} />

        {/* The six overland destinations. No breadcrumb — they have no ancestor. */}
        <Route path="/map" element={<MapScreen />} />
        <Route path="/tome" element={<TomeScreen />} />
        <Route path="/defend" element={<DefendScreen />} />
        <Route path="/party" element={<PartyScreen />} />
        <Route path="/journal" element={<JournalScreen />} />
        <Route path="/console" element={<ConsoleScreen />} />

        {/* The three sub-areas. Each is reached through a place, and each carries the trail. */}
        <Route path="/area/:areaId" element={<AreaScreen />} />
        <Route path="/area/:areaId/quest/:questId" element={<QuestScreen />} />
        <Route path="/area/:areaId/boss" element={<BossScreen />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <SessionProvider>
      <Routed />
    </SessionProvider>
  );
}
