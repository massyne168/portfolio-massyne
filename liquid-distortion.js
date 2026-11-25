/**
 * liquid-distortion.js
 * WebGL-based water ripple distortion effect for MASSYNE portfolio
 * Creates an organic, flowing distortion effect on portrait elements
 */

(() => {
  'use strict';

  // WebGL shader for water ripple distortion
  const vertexShaderSource = `
    precision highp float;

    attribute vec2 a_position;
    attribute vec2 a_texCoord;

    varying vec2 v_texCoord;
    varying vec2 v_pos;

    uniform float u_time;
    uniform vec2 u_resolution;

    void main() {
      gl_Position = vec4(a_position, 0, 1);
      v_texCoord = a_texCoord;
      v_pos = a_position;
    }
  `;

  const fragmentShaderSource = `
    precision highp float;

    varying vec2 v_texCoord;
    varying vec2 v_pos;

    uniform float u_time;
    uniform vec2 u_resolution;
    uniform sampler2D u_map;

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      vec2 distorted = uv;

      // Time-based ripple effect
      float time = u_time * 0.8;

      // Create organic wave pattern
      float wave1 = sin((uv.x + uv.y) * 8.0 + time * 1.2) * 0.015;
      float wave2 = cos((uv.x - uv.y) * 6.0 + time * 0.9) * 0.012;
      float wave3 = sin(uv.x * 12.0 + time * 1.5) * 0.008;
      float wave4 = cos(uv.y * 10.0 + time * 1.1) * 0.008;

      // Combine waves for flowing effect
      distorted.x += wave1 + wave2 + wave3;
      distorted.y += wave1 - wave2 + wave4;

      // Add subtle circular ripples from center points
      vec2 center1 = vec2(0.3, 0.7);
      vec2 center2 = vec2(0.7, 0.3);
      float dist1 = length(uv - center1);
      float dist2 = length(uv - center2);
      distorted += 0.008 * sin(dist1 * 30.0 - time * 1.8) * vec2(cos(dist1 * 25.0), sin(dist1 * 25.0));
      distorted += 0.006 * cos(dist2 * 25.0 + time * 1.4) * vec2(sin(dist2 * 20.0), cos(dist2 * 20.0));

      // Sample the background through the distortion
      vec4 color = texture2D(u_map, distorted);

      // Add subtle glow at edges
      float edge = 1.0 - smoothstep(0.0, 0.1, length(v_pos));
      color.rgb += edge * 0.08 * vec3(0.2, 0.1, 0.15);

      gl_FragColor = color;
    }
  `;

  // Initialize the distortion effect
  function initLiquidDistortion(canvas, options = {}) {
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.warn('WebGL not supported in this browser');
      return null;
    }

    // Configure options with defaults
    const opts = {
      speed: options.speed || 1.0,
      amplitude: options.amplitude || 1.0,
      rippleFrequency: options.rippleFrequency || 1.0,
      distortionStrength: options.distortionStrength || 1.0,
      ...options
    };

    // Compile shader helper
    function compileShader(gl, source, type) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    // Create program
    const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) {
      return null;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return null;
    }

    gl.useProgram(program);

    // Set up vertex buffer (full-screen quad)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Full-screen quad vertices (2 triangles)
    const positions = new Float32Array([
      -1, -1,  0, 0,
       1, -1,  1, 0,
      -1,  1,  0, 1,
       1,  1,  1, 1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    // Get attribute locations
    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const texCoordLoc = gl.getAttribLocation(program, 'a_texCoord');

    // Enable attributes
    gl.enableVertexAttribArray(positionLoc);
    gl.enableVertexAttribArray(texCoordLoc);

    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 16, 8);

    // Get uniform locations
    const timeLoc = gl.getUniformLocation(program, 'u_time');
    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const mapLoc = gl.getUniformLocation(program, 'u_map');

    // Create a texture to sample from
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Render loop
    let startTime = null;
    let frames = 0;

    function render(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) * 0.001;

      // Set uniforms
      gl.uniform1f(timeLoc, elapsed * opts.speed);
      gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
      gl.uniform1i(mapLoc, 0);

      // Clear with dark background
      gl.clearColor(0.1, 0.05, 0.05, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Draw the quad
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      frames++;
      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    return {
      program,
      gl,
      texture,
      dispose: () => {
        gl.deleteProgram(program);
        gl.deleteBuffer(positionBuffer);
        gl.deleteTexture(texture);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
      },
      getStats: () => ({ frames })
    };
  }

  // Apply distortion to specific elements
  function applyDistortionToElements() {
    const targets = [
      '#home-panel .hero-v2-portrait',
      '.process-comparison .comparison'
    ];

    targets.forEach(selector => {
      const elements = document.querySelectorAll(selector);

      elements.forEach(element => {
        // Create a wrapper canvas
        const canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '1';

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(canvas);

        // Resize canvas to match element
        function resizeCanvas() {
          const rect = element.getBoundingClientRect();
          canvas.width = rect.width;
          canvas.height = rect.height;
        }

        resizeCanvas();

        // Initialize distortion
        const distortion = initLiquidDistortion(canvas, {
          speed: 1.2,
          amplitude: 0.8,
          rippleFrequency: 1.0
        });

        // Handle resize
        window.addEventListener('resize', resizeCanvas);
      });
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyDistortionToElements);
  } else {
    applyDistortionToElements();
  }

  // Export for module usage
  if (typeof window !== 'undefined') {
    window.LiquidDistortion = {
      init: initLiquidDistortion,
      applyToElements: applyDistortionToElements
    };
  }

})();