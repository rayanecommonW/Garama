export type InputState = {
  z: boolean;
  q: boolean;
  s: boolean;
  d: boolean;
};

export const Input: InputState = {
  z: false,
  q: false,
  s: false,
  d: false,
};

export function initInput() {
  const handleKeyDown = (event: KeyboardEvent) => {
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
