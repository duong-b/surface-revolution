import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { create, all } from "mathjs";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const math = create(all);

function SurfaceRevolution({ func, axis, playing, speed }) {
  const mountRef = useRef();
  const requestRef = useRef();
  const thetaRef = useRef(0);

  useEffect(() => {
    // Scene setup
    const width = 600, height = 400;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 15);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);

    // OrbitControls for interactive rotation
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 5;
    controls.maxDistance = 50;

    // Lights
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // Axes (black)
    const axesGroup = new THREE.Group();
    const axisMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const addAxis = (from, to) => {
      const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
      const line = new THREE.Line(geometry, axisMaterial);
      axesGroup.add(line);
    };
    addAxis(new THREE.Vector3(-5, 0, 0), new THREE.Vector3(5, 0, 0)); // X
    addAxis(new THREE.Vector3(0, -5, 0), new THREE.Vector3(0, 5, 0)); // Y
    addAxis(new THREE.Vector3(0, 0, -5), new THREE.Vector3(0, 0, 5)); // Z
    scene.add(axesGroup);

    // Axis labels (black, bigger)
    function makeTextSprite(message, color = '#000', fontSize = 96) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      // Increase canvas size for sharper text
      canvas.width = 256;
      canvas.height = 128;
      context.font = `${fontSize}px Arial`;
      context.fillStyle = color;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(message, canvas.width / 2, canvas.height / 2);
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMaterial);
      // Slightly larger than before while preserving aspect
      sprite.scale.set(1.1, 0.55, 1);
      return sprite;
    }

    // X label
    const xLabel = makeTextSprite('x', '#000');
    xLabel.position.set(5.7, 0, 0);
    scene.add(xLabel);
    // Y label
    const yLabel = makeTextSprite('y', '#000');
    yLabel.position.set(0, 5.7, 0);
    scene.add(yLabel);
    // Z label
    const zLabel = makeTextSprite('z', '#000');
    zLabel.position.set(0, 0, 5.7);
    scene.add(zLabel);

    // Parse function
    let expr;
    try {
      expr = math.parse(func);
    } catch {
      expr = math.parse("0");
    }
    const code = expr.compile();

    // Generate curve points
    const xMin = 0, xMax = 6.28, steps = 100;
    const curve = [];
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (xMax - xMin) * (i / steps);
      let y;
      try {
        y = code.evaluate({ x });
        if (!isFinite(y)) y = 0;
      } catch {
        y = 0;
      }
      curve.push({ x, y });
    }

    // Surface geometry
    const surfaceGroup = new THREE.Group();
    scene.add(surfaceGroup);

    // 2D curve line on xy-plane
    const curveMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
    const curveGeometry = new THREE.BufferGeometry();
    const curveVertices = [];
    for (let i = 0; i < curve.length; i++) {
      if (axis === "x") {
        curveVertices.push(curve[i].x, curve[i].y, 0);
      } else {
        curveVertices.push(curve[i].x, 0, curve[i].y);
      }
    }
    curveGeometry.setAttribute("position", new THREE.Float32BufferAttribute(curveVertices, 3));
    const curveLine = new THREE.Line(curveGeometry, curveMaterial);
    scene.add(curveLine);

    function updateSurface(thetaMax) {
      // Remove previous mesh
      while (surfaceGroup.children.length) {
        surfaceGroup.remove(surfaceGroup.children[0]);
      }
      // Build surface
      const segments = 60;
      const geometry = new THREE.BufferGeometry();
      const vertices = [];
      const indices = [];
      for (let i = 0; i < curve.length; i++) {
        for (let j = 0; j <= segments; j++) {
          const theta = (thetaMax * j) / segments;
          let px, py, pz;
          if (axis === "x") {
            px = curve[i].x;
            py = curve[i].y * Math.cos(theta);
            pz = curve[i].y * Math.sin(theta);
          } else {
            px = curve[i].x * Math.cos(theta);
            py = curve[i].x * Math.sin(theta);
            pz = curve[i].y;
          }
          vertices.push(px, py, pz);
        }
      }
      // Indices for faces
      for (let i = 0; i < curve.length - 1; i++) {
        for (let j = 0; j < segments; j++) {
          const a = i * (segments + 1) + j;
          const b = a + segments + 1;
          indices.push(a, b, a + 1);
          indices.push(b, b + 1, a + 1);
        }
      }
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3)
      );
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      const material = new THREE.MeshPhongMaterial({
        color: 0x2196f3,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      const mesh = new THREE.Mesh(geometry, material);
      surfaceGroup.add(mesh);
    }

    // Animation loop
    let t = 0;
    function animate() {
      if (playing) {
        t += 0.015 * speed;
        if (t > 1) t = 1;
      }
      thetaRef.current = t * 2 * Math.PI;
      updateSurface(thetaRef.current);
      controls.update();
      renderer.render(scene, camera);
      // Keep the loop running so orbit rotation always works
      requestRef.current = requestAnimationFrame(animate);
    }
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(requestRef.current);
      renderer.dispose();
      mountRef.current.removeChild(renderer.domElement);
      controls.dispose();
      scene.remove(xLabel);
      scene.remove(yLabel);
      scene.remove(zLabel);
      scene.remove(axesGroup);
      axisMaterial.dispose();
    };
    // eslint-disable-next-line
  }, [func, axis, playing, speed]);

  // Reset animation when play is pressed
  useEffect(() => {
    if (playing) {
      thetaRef.current = 0;
    }
  }, [playing, func, axis]);

  return (
    <div
      ref={mountRef}
      style={{
        width: 600,
        height: 400,
        border: "1px solid #ccc",
        margin: "auto",
        background: "#f0f0f0",
      }}
    />
  );
}

export default SurfaceRevolution;