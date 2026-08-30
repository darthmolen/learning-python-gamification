import { Navigate, Outlet, Route, Routes } from 'react-router';
import { color, font } from '../design/tokens';
import { Rail } from '../shell/Rail';
import {
  AreaScreen,
  BossScreen,
  ConsoleScreen,
  DefendScreen,
  JournalScreen,
  MapScreen,
  PartyScreen,
  QuestScreen,
  TomeScreen,
} from '../screens/placeholders';

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
      {/* Counts are stubbed until Phase 2 wires the gateway. */}
      <Rail />
      <div style={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
    </div>
  );
}

export function App() {
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
