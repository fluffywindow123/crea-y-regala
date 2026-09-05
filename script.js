// Interactive script for Crea y Regala website

document.addEventListener('DOMContentLoaded', () => {
  // Reset scroll to top as a DOMContentLoaded fallback
  if (!window.location.hash) window.scrollTo(0, 0);





  // --- 3. Scroll Reveal Animations ---

  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Stop observing once revealed
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15
  });

  revealElements.forEach(el => observer.observe(el));


  // --- 4. Order / Contact Form Submission ---
  
  const contactForm = document.getElementById('crea-contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('form-name').value.trim();
      const email = document.getElementById('form-email').value.trim();
      const product = document.getElementById('form-product-type').selectedOptions[0].text;
      const details = document.getElementById('form-details').value.trim();
      const message = `¡Hola! Soy ${name}. Me interesa: ${product}.\nMi idea: ${details}\nCorreo: ${email}`;
      window.open(`https://wa.me/523412156828?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    });
  }



  // --- 5. Starry Background Canvas Engine ---
  const canvas = document.getElementById('starry-background');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let stars = [];
    const starCount = 65;

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    function initStars() {
      stars = [];
      for (let i = 0; i < starCount; i++) {
        // Star size: bias towards smaller sizes using power distribution
        const size = Math.random() * Math.random() * 1.8 + 0.4;
        
        // Depth/Parallax factor: larger stars are "closer" and move faster
        const depth = size / 2.2;
        
        // Color selection: sutil tints of brand colors (cyan and lime)
        let colorPrefix = 'rgba(255, 255, 255, ';
        const colorRand = Math.random();
        if (colorRand < 0.08) {
          colorPrefix = 'rgba(120, 200, 240, '; // Sutil Cyan
        } else if (colorRand < 0.16) {
          colorPrefix = 'rgba(220, 240, 120, '; // Sutil Lime
        }

        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: size,
          depth: depth,
          color: colorPrefix,
          twinkleSpeed: Math.random() * 0.015 + 0.005,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    // Set initial canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();

    // Mouse movement tracking for dynamic parallax drift
    window.addEventListener('mousemove', (e) => {
      targetMouseX = (e.clientX - window.innerWidth / 2) * 0.04;
      targetMouseY = (e.clientY - window.innerHeight / 2) * 0.04;
    });

    // Touch support for screen tilt parallax on mobile
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        targetMouseX = (e.touches[0].clientX - window.innerWidth / 2) * 0.04;
        targetMouseY = (e.touches[0].clientY - window.innerHeight / 2) * 0.04;
      }
    });

    let animationId;
    let isPageVisible = true;

    function animate() {
      if (!isPageVisible || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Smooth mouse position interpolation (lerp)
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      const scrollY = window.scrollY;

      stars.forEach(star => {
        // Update twinkling phase
        star.phase += star.twinkleSpeed;
        const opacity = 0.25 + Math.abs(Math.sin(star.phase)) * 0.75;

        // Apply scroll & mouse parallax with vertical/horizontal wrap-around
        const rx = (star.x - mouseX * star.depth) % canvas.width;
        const ry = (star.y - scrollY * star.depth - mouseY * star.depth) % canvas.height;

        const finalX = rx < 0 ? rx + canvas.width : rx;
        const finalY = ry < 0 ? ry + canvas.height : ry;

        // Draw star
        ctx.fillStyle = star.color + opacity + ')';
        ctx.beginPath();
        ctx.arc(finalX, finalY, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) animationId = requestAnimationFrame(animate);
    }

    // Start animation loop
    animate();

    // Debounced resize handler to optimize performance
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initStars();
      }, 150);
    });

    // Page Visibility API optimization: pause loop when off-screen
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        isPageVisible = false;
        cancelAnimationFrame(animationId);
      } else {
        isPageVisible = true;
        animate();
      }
    });
  }
});
