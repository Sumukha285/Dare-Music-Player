import React, { useEffect, useRef } from "react";
import { ThemeConfig } from "../types";

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  theme: ThemeConfig;
  isPlaying: boolean;
}

export default function AudioVisualizer({ analyser, theme, isPlaying }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI retina screens
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(canvas);

    // Prepare frequency data arrays
    let bufferLength = analyser ? analyser.frequencyBinCount : 128;
    let dataArray = new Uint8Array(bufferLength);
    let timeArray = new Uint8Array(bufferLength);

    // Particle pool for organic/synthwave visualizers
    const particles: { x: number; y: number; size: number; speedY: number; color: string; alpha: number }[] = [];

    const draw = () => {
      // Continue loop
      animationRef.current = requestAnimationFrame(draw);

      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      // Fetch audio data if available
      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
        analyser.getByteTimeDomainData(timeArray);
      } else {
        // Mock idle data (smooth waves)
        const now = Date.now() * 0.003;
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = Math.sin(i * 0.05 + now) * 15 + 30;
          timeArray[i] = 128 + Math.sin(i * 0.1 + now) * 10;
        }
      }

      // Calculate overall volume metric for dynamic elements
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avgVolume = sum / bufferLength; // 0 to 255
      const intensity = avgVolume / 255; // 0 to 1

      // Clear with theme-specific background
      ctx.clearRect(0, 0, width, height);

      // --- VISUALIZATION STYLES ---

      // 0. IMMERSIVE GLOW (Immersive UI Pro)
      if (theme.visualizerStyle === "immersive-glow") {
        // Soft glowing dark purple/indigo background trails
        ctx.fillStyle = "rgba(10, 5, 16, 0.25)";
        ctx.fillRect(0, 0, width, height);

        // Ambient backing glow matching volume intensity
        const centerX = width / 2;
        const centerY = height / 2;
        const glowRadius = Math.min(width, height) * 0.4 * (1 + intensity * 0.3);
        const radGlow = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, glowRadius);
        radGlow.addColorStop(0, `rgba(168, 85, 247, ${0.15 * intensity})`);
        radGlow.addColorStop(0.5, `rgba(236, 72, 153, ${0.05 * intensity})`);
        radGlow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = radGlow;
        ctx.fillRect(0, 0, width, height);

        // Beautiful smooth waveform with glowing gradient fill
        let sliceWidth = width / bufferLength;
        let x = 0;

        // Peak indicators
        ctx.lineWidth = 3;
        ctx.lineCap = "round";

        const points: { x: number; y: number }[] = [];

        for (let i = 0; i < bufferLength; i++) {
          const percent = dataArray[i] / 255;
          const barHeight = percent * height * 0.75;
          const y = height - barHeight - 5;
          points.push({ x, y });
          x += sliceWidth;
        }

        // Draw smooth bezier curve through points
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, points[0]?.y || height);
        for (let i = 0; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2;
          const yc = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        ctx.lineTo(width, height);
        ctx.closePath();

        // Create glowing purple to pink vertical gradient
        const fillGrad = ctx.createLinearGradient(0, height, 0, 0);
        fillGrad.addColorStop(0, "rgba(10, 5, 16, 0)");
        fillGrad.addColorStop(0.4, "rgba(168, 85, 247, 0.15)");
        fillGrad.addColorStop(0.8, "rgba(236, 72, 153, 0.25)");
        fillGrad.addColorStop(1, "rgba(236, 72, 153, 0.4)");
        ctx.fillStyle = fillGrad;
        ctx.fill();

        // Stroke line on top
        ctx.beginPath();
        ctx.moveTo(0, points[0]?.y || height);
        for (let i = 0; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2;
          const yc = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        
        ctx.strokeStyle = "rgba(236, 72, 153, 0.85)";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(236, 72, 153, 0.6)";
        ctx.stroke();
        ctx.shadowBlur = 0; // reset

        // Draw premium vertical pins/needles for individual frequencies
        const pinCount = Math.min(bufferLength, 48);
        const pinStep = width / pinCount;
        for (let i = 0; i < pinCount; i++) {
          const idx = Math.floor((i / pinCount) * bufferLength);
          const percent = dataArray[idx] / 255;
          const pinHeight = percent * height * 0.65;
          const px = i * pinStep + pinStep / 2;
          const py = height - pinHeight - 10;

          // Drawing tiny circular glowing capsules at peak
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? "#a855f7" : "#ec4899"; // Purple vs Pink
          ctx.shadowBlur = 8;
          ctx.shadowColor = i % 2 === 0 ? "#a855f7" : "#ec4899";
          ctx.fill();
          ctx.shadowBlur = 0;

          // Tiny support stem
          ctx.strokeStyle = "rgba(255,255,255,0.06)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px, height);
          ctx.lineTo(px, py + 3);
          ctx.stroke();
        }

      // 1. NEON BARS (Synthwave)
      } else if (theme.visualizerStyle === "neon-bars") {
        ctx.fillStyle = "rgba(15, 23, 42, 0.2)"; // trailing fade
        ctx.fillRect(0, 0, width, height);

        const barWidth = (width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const percent = dataArray[i] / 255;
          const barHeight = percent * height * 0.85;

          // Rainbow neon gradient
          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          gradient.addColorStop(0, "rgba(139, 92, 246, 0.4)"); // violet
          gradient.addColorStop(0.5, "rgba(236, 72, 153, 0.8)"); // pink
          gradient.addColorStop(1, "rgba(34, 211, 238, 1)"); // cyan

          ctx.fillStyle = gradient;
          
          // Glow effect for higher frequencies
          if (percent > 0.4) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#ec4899";
          } else {
            ctx.shadowBlur = 0;
          }

          ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
          
          // Reflection at bottom
          ctx.fillStyle = "rgba(236, 72, 153, 0.1)";
          ctx.fillRect(x, height, barWidth - 1, barHeight * 0.2);
          
          x += barWidth;
        }
        ctx.shadowBlur = 0; // reset

      // 2. DIGITAL MATRIX (Cyberpunk)
      } else if (theme.visualizerStyle === "digital-matrix") {
        ctx.fillStyle = "#0c0a09"; // absolute solid dark
        ctx.fillRect(0, 0, width, height);

        // Grid lines in back
        ctx.strokeStyle = "rgba(132, 204, 22, 0.05)";
        ctx.lineWidth = 1;
        const gridGap = 16;
        for (let gx = 0; gx < width; gx += gridGap) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, height);
          ctx.stroke();
        }
        for (let gy = 0; gy < height; gy += gridGap) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(width, gy);
          ctx.stroke();
        }

        const barCount = Math.min(bufferLength, 24);
        const barWidth = width / barCount;

        for (let i = 0; i < barCount; i++) {
          const percent = dataArray[i] / 255;
          const blocks = Math.floor(percent * 12); // segment blocks
          const x = i * barWidth + barWidth * 0.1;

          for (let b = 0; b < blocks; b++) {
            const blockHeight = height / 15;
            const y = height - b * (blockHeight + 3) - blockHeight;

            // Block color segments (Green -> Yellow -> Red alert)
            if (b > 10) ctx.fillStyle = "#ef4444"; // Red
            else if (b > 7) ctx.fillStyle = "#fde047"; // Yellow
            else ctx.fillStyle = "#84cc16"; // Bright Cyber Lime

            ctx.fillRect(x, y, barWidth * 0.8, blockHeight);
          }
        }

      // 3. ORGANIC LEAVES (Forest Moss)
      } else if (theme.visualizerStyle === "organic-leaves") {
        // Draw fluid flowing hills/vibrations
        ctx.fillStyle = "rgba(245, 245, 244, 0.3)";
        ctx.fillRect(0, 0, width, height);

        ctx.shadowBlur = 0;
        ctx.lineWidth = 3;

        // Wave 1 - Deep Forest
        ctx.beginPath();
        ctx.strokeStyle = "rgba(16, 185, 129, 0.35)"; // green-500
        ctx.fillStyle = "rgba(16, 185, 129, 0.04)";
        let sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeArray[i] / 128.0;
          const y = (v * height) / 2 + (Math.sin(i * 0.1 + Date.now() * 0.002) * 10 * intensity);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.fill();
        ctx.stroke();

        // Wave 2 - Sage Leaf Accent
        ctx.beginPath();
        ctx.strokeStyle = "rgba(4, 120, 87, 0.6)"; // emerald-700
        ctx.fillStyle = "rgba(4, 120, 87, 0.05)";
        x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const percent = dataArray[i] / 255;
          const y = height - percent * height * 0.7 - 20;
          if (i === 0) ctx.moveTo(x, y);
          else {
            const cx = x - sliceWidth / 2;
            const cy = y;
            ctx.quadraticCurveTo(cx, cy, x, y);
          }
          x += sliceWidth;
        }
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.fill();
        ctx.stroke();

        // Generate occasional forest fireflies particles
        if (isPlaying && Math.random() < 0.1 && particles.length < 30) {
          particles.push({
            x: Math.random() * width,
            y: height,
            size: Math.random() * 3 + 1,
            speedY: -(Math.random() * 1 + 0.5),
            color: `rgba(${110 + Math.random() * 40}, 231, 183, ${Math.random() * 0.6 + 0.4})`,
            alpha: 1
          });
        }

        // Draw and update particles
        particles.forEach((p, idx) => {
          p.y += p.speedY + (Math.sin(p.y * 0.05) * 0.5); // float wave
          p.alpha -= 0.005;
          if (p.alpha <= 0 || p.y < 0) {
            particles.splice(idx, 1);
            return;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.shadowBlur = 8;
          ctx.shadowColor = "#34d399";
          ctx.fill();
          ctx.restore();
        });

      // 4. GOLDEN RINGS (Crimson Velvet)
      } else if (theme.visualizerStyle === "golden-rings") {
        ctx.fillStyle = "rgba(20, 2, 2, 0.15)"; // rich burgundy background
        ctx.fillRect(0, 0, width, height);

        // Circular golden radar in center
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.22 + intensity * 15;

        // Draw multiple ring orbits
        ctx.lineWidth = 1.5;
        for (let r = 0; r < 3; r++) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(245, 158, 11, ${0.15 - r * 0.04})`; // amber
          ctx.arc(centerX, centerY, baseRadius * (1 + r * 0.4), 0, Math.PI * 2);
          ctx.stroke();
        }

        // Dynamic Ring based on waveform
        ctx.beginPath();
        ctx.strokeStyle = "rgba(245, 158, 11, 0.85)"; // bright gold
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#d97706";

        const points = Math.min(bufferLength, 80);
        for (let i = 0; i < points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const audioVal = dataArray[i % bufferLength] / 255;
          const radialLength = baseRadius + audioVal * height * 0.25;
          const x = centerX + Math.cos(angle) * radialLength;
          const y = centerY + Math.sin(angle) * radialLength;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.shadowBlur = 0; // reset

        // Center golden nucleus
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius - 5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(245, 158, 11, 0.12)";
        ctx.fill();

      // 5. GLASS WAVE (Glass Minimalist)
      } else if (theme.visualizerStyle === "glass-wave") {
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.fillRect(0, 0, width, height);

        // Waveform oscilloscope style
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "rgba(79, 70, 229, 0.7)"; // Indigo
        ctx.beginPath();

        let sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) ctx.moveTo(x, y);
          else {
            const prevX = x - sliceWidth;
            const prevV = timeArray[i - 1] / 128.0;
            const prevY = (prevV * height) / 2;
            ctx.bezierCurveTo(prevX + sliceWidth / 2, prevY, x - sliceWidth / 2, y, x, y);
          }
          x += sliceWidth;
        }
        ctx.stroke();

        // Secondary subtle shadow wave
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(99, 102, 241, 0.3)"; // light Indigo
        ctx.beginPath();
        x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const percent = dataArray[i] / 255;
          const y = height/2 + Math.sin(i * 0.15 + Date.now() * 0.005) * 20 * percent;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();

      // 6. ANALOG VU METER (Retro Vinyl)
      } else if (theme.visualizerStyle === "analog-vu") {
        ctx.fillStyle = "#fdfaf2"; // cream paper
        ctx.fillRect(0, 0, width, height);

        const meterWidth = width * 0.42;
        const meterHeight = height * 0.8;
        const meterY = height * 0.1;

        const drawSingleVUMeter = (centerX: number, sideName: string, value: number) => {
          // Draw wooden borders for each dial
          ctx.strokeStyle = "#451a03"; // dark brown wood
          ctx.lineWidth = 4;
          ctx.fillStyle = "#fffcf4";
          ctx.beginPath();
          ctx.roundRect(centerX - meterWidth / 2, meterY, meterWidth, meterHeight, 8);
          ctx.fill();
          ctx.stroke();

          // Draw grid arcs inside dial
          ctx.strokeStyle = "rgba(69, 26, 3, 0.2)";
          ctx.lineWidth = 1.5;
          const dialY = meterY + meterHeight * 0.95;

          // Dial limits
          const minAngle = -Math.PI * 0.75;
          const maxAngle = -Math.PI * 0.25;
          const targetAngle = minAngle + value * (maxAngle - minAngle);

          // Grid ticks
          ctx.beginPath();
          ctx.arc(centerX, dialY, meterHeight * 0.75, minAngle, maxAngle);
          ctx.stroke();

          // Sub label
          ctx.fillStyle = "#451a03";
          ctx.font = "bold 9px monospace";
          ctx.textAlign = "center";
          ctx.fillText(`VU - ${sideName}`, centerX, dialY - meterHeight * 0.2);

          // Red zone line
          ctx.strokeStyle = "#dc2626";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(centerX, dialY, meterHeight * 0.75, minAngle + (maxAngle - minAngle) * 0.8, maxAngle);
          ctx.stroke();

          // Needles
          ctx.strokeStyle = "#dc2626"; // bright red needle
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(centerX, dialY);
          const needleX = centerX + Math.cos(targetAngle) * (meterHeight * 0.72);
          const needleY = dialY + Math.sin(targetAngle) * (meterHeight * 0.72);
          ctx.lineTo(needleX, needleY);
          ctx.stroke();

          // Center hinge dot
          ctx.beginPath();
          ctx.arc(centerX, dialY, 8, 0, Math.PI * 2);
          ctx.fillStyle = "#451a03";
          ctx.fill();
        };

        // Separate bass (left dial) and treble (right dial) intensities
        let bassSum = 0;
        let trebleSum = 0;
        const splitPoint = Math.floor(bufferLength * 0.3);

        for (let i = 0; i < bufferLength; i++) {
          if (i < splitPoint) bassSum += dataArray[i];
          else trebleSum += dataArray[i];
        }

        const bassAvg = (bassSum / splitPoint) / 255;
        const trebleAvg = (trebleSum / (bufferLength - splitPoint)) / 255;

        // Apply a small smoothing inertia to needles
        const leftValue = Math.min(Math.max(bassAvg * 1.25, 0.05), 0.95);
        const rightValue = Math.min(Math.max(trebleAvg * 1.35, 0.04), 0.95);

        drawSingleVUMeter(width * 0.26, "LEFT (BASS)", leftValue);
        drawSingleVUMeter(width * 0.74, "RIGHT (TREBLE)", rightValue);
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [analyser, theme, isPlaying]);

  return (
    <div className="relative w-full h-40 rounded-xl overflow-hidden mb-4" id="visualizer-container">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        id="visualizer-canvas"
      />
    </div>
  );
}
