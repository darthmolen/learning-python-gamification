import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tome } from './Tome';

const renderTome = () =>
  render(
    <div>
      <p>the code he was writing</p>
      <Tome>
        <p>dict.get() returns None rather than raising</p>
      </Tome>
    </div>,
  );

/**
 * CLAUDE.md: "No pop-overs. The Tome expands in place and pushes the work down; nothing is
 * covered and nothing is lost."
 *
 * §6.8 says why: "If looking something up costs a learner the code in his editor, he stops
 * looking things up, and the Tome is where the teaching lives." A modal is the obvious
 * implementation and it is the wrong one, so these tests are pointed straight at it.
 */
describe('the Tome', () => {
  it('starts closed, and says so without changing its label', async () => {
    renderTome();
    const trigger = screen.getByRole('button', { name: 'Tome' });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(/dict.get/)).toBeNull();
  });

  it('expands in place when opened', async () => {
    renderTome();
    await userEvent.click(screen.getByRole('button', { name: 'Tome' }));

    expect(screen.getByText(/dict.get/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tome' })).toHaveAttribute('aria-expanded', 'true');
  });

  /**
   * The mutant this file exists for. A dialog covers the work, traps focus, and is dismissed
   * rather than closed — three behaviours the Tome is specified not to have.
   */
  it('opens no dialog, and lays down no scrim', async () => {
    const { container } = renderTome();
    await userEvent.click(screen.getByRole('button', { name: 'Tome' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(container.querySelector('dialog')).toBeNull();
  });

  /** "Nothing is covered": the panel sits in the flow and pushes, rather than floating over. */
  it('stays in the document flow rather than floating over the work', async () => {
    renderTome();
    await userEvent.click(screen.getByRole('button', { name: 'Tome' }));

    const panel = screen.getByRole('region', { name: 'Tome' });
    expect(['', 'static', 'relative']).toContain(panel.style.position);
  });

  /** "Nothing is lost": what was underneath is still mounted, not unmounted behind an overlay. */
  it('leaves the work underneath mounted, open and closed alike', async () => {
    renderTome();
    expect(screen.getByText('the code he was writing')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Tome' }));
    expect(screen.getByText('the code he was writing')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Tome' }));
    expect(screen.getByText('the code he was writing')).toBeInTheDocument();
    expect(screen.queryByText(/dict.get/)).toBeNull();
  });

  /**
   * "Labels never change with state." A trigger reading "Close Tome" when open is the same
   * mistake as "Take it cold" on a screen showing three quests cleared — the word moved
   * instead of the state being announced.
   */
  it('reads the same word open or closed', async () => {
    renderTome();
    const label = () => screen.getByRole('button', { name: 'Tome' }).textContent;

    expect(label()).toBe('Tome');
    await userEvent.click(screen.getByRole('button', { name: 'Tome' }));
    expect(label()).toBe('Tome');
  });
});
