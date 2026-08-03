(function () {
  'use strict';

  // Couleur de fond de la bannière (--ink)
  const INK = { r: 14, g: 20, b: 32 };

  // Palette accordée au système de design : rouge, papier, bleu d'archive
  const TAIWAN_COLORS = [
    { r: 196, g: 62,  b: 74  }, // rouge
    { r: 90,  g: 130, b: 200 }, // bleu
    { r: 251, g: 250, b: 247 }, // papier
    { r: 196, g: 62,  b: 74  }, // rouge
    { r: 90,  g: 130, b: 200 }, // bleu
  ];

  class Particle {
    constructor() {
      this.pos = { x: 0, y: 0 };
      this.vel = { x: 0, y: 0 };
      this.acc = { x: 0, y: 0 };
      this.target = { x: 0, y: 0 };
      this.closeEnoughTarget = 100;
      this.maxSpeed = 1.0;
      this.maxForce = 0.1;
      this.isKilled = false;
      this.startColor = { r: INK.r, g: INK.g, b: INK.b };
      this.targetColor = { r: INK.r, g: INK.g, b: INK.b };
      this.colorWeight = 0;
      this.colorBlendRate = 0.01;
    }

    move() {
      const dx = this.pos.x - this.target.x;
      const dy = this.pos.y - this.target.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const proximityMult = distance < this.closeEnoughTarget ? distance / this.closeEnoughTarget : 1;

      const tx = this.target.x - this.pos.x;
      const ty = this.target.y - this.pos.y;
      const mag = Math.sqrt(tx * tx + ty * ty);
      const tsx = mag > 0 ? (tx / mag) * this.maxSpeed * proximityMult : 0;
      const tsy = mag > 0 ? (ty / mag) * this.maxSpeed * proximityMult : 0;

      const sx = tsx - this.vel.x;
      const sy = tsy - this.vel.y;
      const sm = Math.sqrt(sx * sx + sy * sy);
      this.acc.x += sm > 0 ? (sx / sm) * this.maxForce : 0;
      this.acc.y += sm > 0 ? (sy / sm) * this.maxForce : 0;

      this.vel.x += this.acc.x;
      this.vel.y += this.acc.y;
      this.pos.x += this.vel.x;
      this.pos.y += this.vel.y;
      this.acc.x = 0;
      this.acc.y = 0;
    }

    draw(ctx) {
      if (this.colorWeight < 1.0) {
        this.colorWeight = Math.min(this.colorWeight + this.colorBlendRate, 1.0);
      }
      const r = Math.round(this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight);
      const g = Math.round(this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight);
      const b = Math.round(this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight);
      ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      ctx.fillRect(this.pos.x, this.pos.y, 2, 2);
    }

    kill(width, height) {
      if (!this.isKilled) {
        const rp = randomPos(width / 2, height / 2, (width + height) / 2, width, height);
        this.target.x = rp.x;
        this.target.y = rp.y;
        this.startColor = {
          r: this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight,
          g: this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight,
          b: this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight,
        };
        this.targetColor = { r: INK.r, g: INK.g, b: INK.b };
        this.colorWeight = 0;
        this.isKilled = true;
      }
    }
  }

  function randomPos(cx, cy, mag, w, h) {
    const rx = Math.random() * (w || 1000);
    const ry = Math.random() * (h || 500);
    const dir = { x: rx - cx, y: ry - cy };
    const m = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
    if (m > 0) { dir.x = (dir.x / m) * mag; dir.y = (dir.y / m) * mag; }
    return { x: cx + dir.x, y: cy + dir.y };
  }

  function initParticles() {
    var canvas = document.getElementById('particle-canvas');
    if (!canvas) return;

    var WORDS = ['FRANCE FORMOSA', 'TAIWAN', '台灣', 'DÉMOCRATIE', 'FORMOSA'];
    var wordIndex = 0;
    var frameCount = 0;
    var particles = [];
    var pixelSteps = 6;
    var animId;
    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      var parent = canvas.parentElement;
      var w = (parent ? parent.offsetWidth : 0) || canvas.clientWidth || window.innerWidth;
      var h = (parent ? parent.offsetHeight : 0) || canvas.clientHeight || 460;
      if (w < 10) w = 1000;
      if (h < 100) h = 460;
      canvas.width = w;
      canvas.height = h;
    }

    resize();

    // Recompose le mot quand la géométrie change : redimensionnement, mais
    // aussi arrivée des polices web, qui modifie la hauteur de la bannière.
    var refreshTimer;
    function refresh() {
      resize();
      nextWord(WORDS[wordIndex], wordIndex);
      if (reduceMotion) drawStatic();
    }

    function scheduleRefresh() {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(refresh, 150);
    }

    window.addEventListener('resize', scheduleRefresh);

    if (window.ResizeObserver) {
      new ResizeObserver(scheduleRefresh).observe(canvas);
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleRefresh);
    }

    // Mouvement réduit : on compose le mot une fois, sans animation
    function drawStatic() {
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgb(' + INK.r + ',' + INK.g + ',' + INK.b + ')';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        if (p.isKilled) continue;
        p.pos.x = p.target.x;
        p.pos.y = p.target.y;
        p.colorWeight = 1;
        p.draw(ctx);
      }
    }

    function nextWord(word, colorIndex) {
      var off = document.createElement('canvas');
      off.width = canvas.width;
      off.height = canvas.height;
      var octx = off.getContext('2d');

      var maxFont = Math.floor(canvas.width / 6);
      var lenFont = Math.floor(canvas.width / Math.max(word.length, 5) * 1.6);
      var fontSize = Math.max(36, Math.min(maxFont, lenFont));

      octx.fillStyle = 'white';
      octx.font = '600 ' + fontSize + 'px "Crimson Pro", Georgia, serif';
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.fillText(word, canvas.width / 2, canvas.height / 2);

      var imageData = octx.getImageData(0, 0, canvas.width, canvas.height);
      var pixels = imageData.data;
      var newColor = TAIWAN_COLORS[colorIndex % TAIWAN_COLORS.length];

      var coordsIndexes = [];
      for (var i = 0; i < pixels.length; i += pixelSteps * 4) {
        coordsIndexes.push(i);
      }
      // Shuffle pour fluidité
      for (var j = coordsIndexes.length - 1; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var tmp = coordsIndexes[j]; coordsIndexes[j] = coordsIndexes[k]; coordsIndexes[k] = tmp;
      }

      var particleIndex = 0;
      for (var ci = 0; ci < coordsIndexes.length; ci++) {
        var idx = coordsIndexes[ci];
        if (pixels[idx + 3] > 0) {
          var x = (idx / 4) % canvas.width;
          var y = Math.floor(idx / 4 / canvas.width);
          var p;
          if (particleIndex < particles.length) {
            p = particles[particleIndex];
            p.isKilled = false;
            particleIndex++;
          } else {
            p = new Particle();
            var rp = randomPos(canvas.width / 2, canvas.height / 2, (canvas.width + canvas.height) / 2, canvas.width, canvas.height);
            p.pos.x = rp.x;
            p.pos.y = rp.y;
            p.maxSpeed = Math.random() * 6 + 4;
            p.maxForce = p.maxSpeed * 0.05;
            p.colorBlendRate = Math.random() * 0.0275 + 0.0025;
            particles.push(p);
          }
          p.startColor = {
            r: p.startColor.r + (p.targetColor.r - p.startColor.r) * p.colorWeight,
            g: p.startColor.g + (p.targetColor.g - p.startColor.g) * p.colorWeight,
            b: p.startColor.b + (p.targetColor.b - p.startColor.b) * p.colorWeight,
          };
          p.targetColor = newColor;
          p.colorWeight = 0;
          p.target.x = x;
          p.target.y = y;
        }
      }
      for (var pi = particleIndex; pi < particles.length; pi++) {
        particles[pi].kill(canvas.width, canvas.height);
      }
    }

    function animate() {
      var ctx = canvas.getContext('2d');
      // Traînée sur le fond encre
      ctx.fillStyle = 'rgba(14,20,32,0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (var i = particles.length - 1; i >= 0; i--) {
        particles[i].move();
        particles[i].draw(ctx);
        if (particles[i].isKilled &&
          (particles[i].pos.x < -10 || particles[i].pos.x > canvas.width + 10 ||
           particles[i].pos.y < -10 || particles[i].pos.y > canvas.height + 10)) {
          particles.splice(i, 1);
        }
      }

      frameCount++;
      // Change de mot toutes les ~4 sec (240 frames à 60fps)
      if (frameCount % 240 === 0) {
        wordIndex = (wordIndex + 1) % WORDS.length;
        nextWord(WORDS[wordIndex], wordIndex);
      }
      animId = requestAnimationFrame(animate);
    }

    nextWord(WORDS[0], 0);
    if (reduceMotion) {
      drawStatic();
    } else {
      animate();
    }
  }

  document.addEventListener('DOMContentLoaded', initParticles);
})();
