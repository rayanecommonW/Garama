/**
 * Input handler - tracks keyboard state
 * Uses plain JS object to avoid React re-renders
 */

export type InputState = {
  z: boolean; // up
  q: boolean; // left
  s: boolean; // down
  d: boolean; // right
};

export const Input: InputState = {
  z: false,
  q: false,
  s: false,
  d: false,
};

/**
 * Initializes keyboard event listeners
 */
export function initInput() {
  const handleKeyDown = (event: KeyboardEvent) => {
    // Ignore if typing in input/textarea
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    const key = event.key.toLowerCase();
    if (key === 'z') {
      Input.z = true;
      event.preventDefault();
    }
    if (key === 'q') {
      Input.q = true;
      event.preventDefault();
    }
    if (key === 's') {
      Input.s = true;
      event.preventDefault();
    }
    if (key === 'd') {
      Input.d = true;
      event.preventDefault();
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (key === 'z') {
      Input.z = false;
      event.preventDefault();
    }
    if (key === 'q') {
      Input.q = false;
      event.preventDefault();
    }
    if (key === 's') {
      Input.s = false;
      event.preventDefault();
    }
    if (key === 'd') {
      Input.d = false;
      event.preventDefault();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  };
}

