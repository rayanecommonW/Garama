export type InputState = {
  jump: boolean;
  left: boolean;
  right: boolean;
  down: boolean;
  up: boolean;
  attack: boolean;
  dash: boolean;
};

export const Input: InputState = {
  jump: false,
  left: false,
  right: false,
  down: false,
  up: false,
  attack: false,
  dash: false,
};

export type KeyBindings = {
  jump: string;
  left: string;
  right: string;
  down: string;
  up: string;
  attack: string;
  dash: string;
};

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  jump: ' ',
  left: 'q',
  right: 'd',
  down: 's',
  up: 'z',
  attack: 'j',
  dash: 'k',
};

export function initInput(bindings: KeyBindings = DEFAULT_KEY_BINDINGS) {
  Input.jump = false;
  Input.left = false;
  Input.right = false;
  Input.down = false;
  Input.up = false;
  Input.attack = false;
  Input.dash = false;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    const key = event.key.toLowerCase();
    if (key === bindings.jump.toLowerCase()) {
      Input.jump = true;
      event.preventDefault();
    }
    if (key === bindings.left.toLowerCase()) {
      Input.left = true;
      event.preventDefault();
    }
    if (key === bindings.up.toLowerCase()) {
      Input.up = true;
      event.preventDefault();
    }
    if (key === bindings.down.toLowerCase()) {
      Input.down = true;
      event.preventDefault();
    }
    if (key === bindings.right.toLowerCase()) {
      Input.right = true;
      event.preventDefault();
    }
    if (key === bindings.attack.toLowerCase()) {
      Input.attack = true;
      event.preventDefault();
    }
    if (key === bindings.dash.toLowerCase()) {
      Input.dash = true;
      event.preventDefault();
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (key === bindings.jump.toLowerCase()) {
      Input.jump = false;
      event.preventDefault();
    }
    if (key === bindings.left.toLowerCase()) {
      Input.left = false;
      event.preventDefault();
    }
    if (key === bindings.up.toLowerCase()) {
      Input.up = false;
      event.preventDefault();
    }
    if (key === bindings.down.toLowerCase()) {
      Input.down = false;
      event.preventDefault();
    }
    if (key === bindings.right.toLowerCase()) {
      Input.right = false;
      event.preventDefault();
    }
    if (key === bindings.attack.toLowerCase()) {
      Input.attack = false;
      event.preventDefault();
    }
    if (key === bindings.dash.toLowerCase()) {
      Input.dash = false;
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
