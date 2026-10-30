import { Component } from 'react';

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Shows a 2D fallback if the 3D scene throws (no WebGL, lost context, driver issues). */
export class SceneBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    /* fall back silently; the 2D view carries the same information */
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
