(function () {
  'use strict';

  // Palette drapeau taïwanais + blanc
  const TAIWAN_COLORS = [
    { r: 196, g: 32,  b: 50  }, // rouge Taiwan
    { r: 0,   g: 58,  b: 140 }, // bleu Taiwan
    { r: 255, g: 255, b: 255 }, // blanc
    { r: 196, g: 32,  b: 50  }, // rouge
    { r: 0,   g: 58,  b: 140 }, // bleu
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
      this.startColor = { r: 15, g: 26, b: 46 };
      this.targetColor = { r: 15, g: 26, b: 46 };
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
        this.targetColor = { r: 15, g: 26, b: 46 };
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

    function resize() {
      var parent = canvas.parentElement;
      var w = parent ? parent.offsetWidth : window.innerWidth;
      var h = parent ? parent.offsetHeight : 460;
      if (w < 10) w = 1000;
      if (h < 100) h = 460;
      canvas.width = w;
      canvas.height = h;
    }

    resize();
    window.addEventListener('resize', function () {
      resize();
      nextWord(WORDS[wordIndex], wordIndex);
    });

    function nextWord(word, colorIndex) {
      var off = document.createElement('canvas');
      off.width = canvas.width;
      off.height = canvas.height;
      var octx = off.getContext('2d');

      var maxFont = Math.floor(canvas.width / 6);
      var lenFont = Math.floor(canvas.width / Math.max(word.length, 5) * 1.6);
      var fontSize = Math.max(36, Math.min(maxFont, lenFont));

      octx.fillStyle = 'white';
      octx.font = 'bold ' + fontSize + 'px "Playfair Display", Georgia, serif';
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
      // Motion blur sur fond navy
      ctx.fillStyle = 'rgba(15,26,46,0.18)';
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
    animate();
  }

  document.addEventListener('DOMContentLoaded', initParticles);
})();
