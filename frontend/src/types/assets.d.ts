// Ambient type declarations for non-code assets imported for their side effects
// (or as modules) in the Next.js app. Without these, TypeScript 5.6+ raises
// TS2882: "Cannot find module or type declarations for side-effect import".

declare module '*.css';
declare module '*.scss';
declare module '*.sass';

// CSS Modules (e.g. `import styles from './foo.module.css'`)
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
