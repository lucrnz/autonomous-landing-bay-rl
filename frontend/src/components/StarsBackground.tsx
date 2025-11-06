"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// Create a star-shaped texture with glow effect
function createStarTexture(): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;

  const centerX = 32;
  const centerY = 32;

  // Create radial gradient for glow effect
  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    32
  );
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.1, "rgba(255,255,255,0.9)");
  gradient.addColorStop(0.3, "rgba(255,255,255,0.5)");
  gradient.addColorStop(0.5, "rgba(255,255,255,0.2)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  // Add bright center point for extra sparkle
  ctx.fillStyle = "rgba(255,255,255,1)";
  ctx.beginPath();
  ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;

  return texture;
}

export default function StarsBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined" || !containerRef.current) return;

    // Prevent double mounting in development
    if (mountedRef.current) return;
    mountedRef.current = true;

    // Capture container reference for cleanup
    const container = containerRef.current;

    // Setup scene
    const scene = new THREE.Scene();

    // Setup camera - position further back for better depth perception
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      3000
    );
    camera.position.z = 1;

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Create star texture
    const starTexture = createStarTexture();

    // Create stars with enhanced properties
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 5000;

    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const velocities = new Float32Array(starCount);
    const twinkleOffsets = new Float32Array(starCount);

    // Color palette for stars
    const starColors = [
      new THREE.Color(0xffffff), // Pure white
      new THREE.Color(0xaaccff), // Blue-white
      new THREE.Color(0xffffdd), // Warm white
      new THREE.Color(0xffddaa), // Slightly warm
      new THREE.Color(0xccddff), // Cool white
    ];

    for (let i = 0; i < starCount; i++) {
      // Position stars in front of camera (negative z values)
      positions[i * 3] = (Math.random() - 0.5) * 2000; // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2000; // y
      positions[i * 3 + 2] = -Math.random() * 2000 - 10; // z (from -10 to -2010)

      // Random color from palette
      const color = starColors[Math.floor(Math.random() * starColors.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Random size (some stars are bigger/brighter)
      sizes[i] = Math.random() * 2.5 + 0.5;

      // Random velocity for varied movement speed
      velocities[i] = Math.random() * 2.7 + 0.3;

      // Random offset for twinkling effect
      twinkleOffsets[i] = Math.random() * Math.PI * 2;
    }

    starsGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    starsGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    starsGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    // Create material with enhanced properties
    const starsMaterial = new THREE.PointsMaterial({
      size: 3,
      map: starTexture,
      transparent: true,
      blending: THREE.AdditiveBlending, // Creates beautiful glow effect
      depthWrite: false,
      vertexColors: true,
      sizeAttenuation: true,
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Animation loop with time tracking
    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      time += 0.01;

      const positions = starsGeometry.attributes.position.array as Float32Array;
      const sizes = starsGeometry.attributes.size.array as Float32Array;

      // Move stars towards camera and add twinkling effect
      for (let i = 0; i < starCount; i++) {
        // Move stars forward (towards camera)
        positions[i * 3 + 2] += velocities[i];

        // Add subtle horizontal drift for organic movement
        positions[i * 3] += Math.sin(time + twinkleOffsets[i]) * 0.05;
        positions[i * 3 + 1] += Math.cos(time + twinkleOffsets[i] * 0.7) * 0.05;

        // Reset star position when it passes the camera
        if (positions[i * 3 + 2] > 10) {
          positions[i * 3 + 2] = -2000;
          positions[i * 3] = (Math.random() - 0.5) * 2000;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
        }

        // Twinkling effect - vary size over time
        const baseSizeIndex = i;
        const baseSize = sizes[baseSizeIndex] || 1;
        const twinkle = Math.sin(time * 2 + twinkleOffsets[i]) * 0.3 + 0.7;
        sizes[baseSizeIndex] = baseSize * twinkle;
      }

      // Add subtle rotation to entire star field for extra depth
      stars.rotation.z = time * 0.01;

      starsGeometry.attributes.position.needsUpdate = true;
      starsGeometry.attributes.size.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      mountedRef.current = false;
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      // Dispose of resources
      starsGeometry.dispose();
      starsMaterial.dispose();
      starTexture.dispose();
      renderer.dispose();

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none",
        backgroundColor: "#000000",
      }}
    />
  );
}
