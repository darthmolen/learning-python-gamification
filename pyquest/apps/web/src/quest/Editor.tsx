import { python } from '@codemirror/lang-python';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { useEffect, useRef } from 'react';
import { color, font } from '../design/tokens';

/**
 * The editor he actually types in.
 *
 * `indentWithTab` is included deliberately: Python is whitespace-significant and Tab escaping to
 * the next control is correct for a form and wrong for a code editor. It costs a keyboard trap,
 * which is why Escape-then-Tab still leaves — CodeMirror's own behaviour, and the reason this
 * is a considered trade rather than an oversight.
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
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
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
