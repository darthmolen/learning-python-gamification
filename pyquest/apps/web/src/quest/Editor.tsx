import { python } from '@codemirror/lang-python';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  temporarilySetTabFocusMode,
} from '@codemirror/commands';
import { useEffect, useRef } from 'react';
import { color, font } from '../design/tokens';

/**
 * The editor he actually types in.
 *
 * `indentWithTab` is included deliberately: Python is whitespace-significant, and Tab escaping to
 * the next control is right for a form and wrong for a code editor. It costs a keyboard trap.
 *
 * **The escape hatch used to be stated here and did not exist.** This file claimed
 * "Escape-then-Tab still leaves — CodeMirror's own behaviour", which is Monaco's behaviour, not
 * CodeMirror's: `defaultKeymap` binds Escape to `simplifySelection`, and the real hatch is
 * **Ctrl-m** (`toggleTabFocusMode`), which nothing on screen mentioned. So the considered trade
 * was made against a mechanism nobody had checked, and the Quest screen's Run, Stop and Submit
 * buttons — all of which follow the editor in the DOM — were unreachable by keyboard once you
 * were in it. Found 2026-09-01 by the accessibility sweep, which is what a sweep is for.
 *
 * Escape is now bound to `temporarilySetTabFocusMode`, so the sentence above is true rather than
 * merely written down: Escape releases Tab for two seconds, which is long enough to leave and
 * short enough not to break indenting. Ctrl-m still latches it, and `label` says so out loud —
 * an escape hatch nobody can discover is the same as no escape hatch.
 */
interface EditorProps {
  value: string;
  onChange: (next: string) => void;
  label: string;
}

export function Editor({ value, onChange, label }: EditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const latest = useRef(onChange);
  latest.current = onChange;

  useEffect(() => {
    if (host.current === null) return;

    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          history(),
          python(),
          /*
           * The name goes on the element that actually has the textbox role.
           *
           * The wrapper below is `role="group" aria-label={label}`, which names the *region* —
           * but CodeMirror's contenteditable is its own `role="textbox"`, and a screen reader
           * landing in it announced nothing. The accessibility sweep missed this at first
           * because its hand-rolled name check fell back to `textContent`, so it decided the
           * editor's name was the entire program.
           */
          EditorView.contentAttributes.of({ 'aria-label': label }),
          /* Escape first, so it wins over `defaultKeymap`'s `simplifySelection`. Releasing the
           * Tab key matters more than collapsing a selection nobody made. */
          keymap.of([
            { key: 'Escape', run: temporarilySetTabFocusMode },
            ...defaultKeymap,
            ...historyKeymap,
            indentWithTab,
          ]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) latest.current(update.state.doc.toString());
          }),
          EditorView.theme({
            '&': { fontSize: '13px', backgroundColor: color.bg, color: color.fg },
            '.cm-content': { fontFamily: font.mono, caretColor: color.accent },
            '.cm-gutters': { backgroundColor: color.bg, color: color.crumbRule, border: 'none' },
            '.cm-activeLine': { backgroundColor: '#161a22' },
            '.cm-activeLineGutter': { backgroundColor: '#161a22' },
          }),
        ],
      }),
    });

    view.current = editor;
    return () => {
      editor.destroy();
      view.current = null;
    };
    // Mounted once. Re-creating the view on every keystroke would lose the cursor, and `value`
    // is pushed in below rather than re-seeding the document.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Only when something other than typing changed the code — a reset, or a different quest. */
  useEffect(() => {
    const editor = view.current;
    if (editor === null) return;
    if (editor.state.doc.toString() === value) return;

    editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } });
  }, [value]);

  return (
    <div
      ref={host}
      role="group"
      aria-label={label}
      style={{ border: `1px solid ${color.border}`, background: color.bg, minHeight: '260px' }}
    />
  );
}
