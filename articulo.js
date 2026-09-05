// Script for the Product Detail Subpage of Crea y Regala
document.addEventListener('DOMContentLoaded', () => {
  // Reset scroll to top as a fallback
  window.scrollTo(0, 0);

  // --- 1. Product Catalog Data ---
  const designsData = [
    {
      id: 'galaxy-mug',
      name: 'Taza Galaxia Cósmica',
      category: 'mugs',
      categoryLabel: 'Taza Sublimada',
      price: 120,
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
      description: 'Una taza cerámica premium con un sublimado de alta definición que simula una nebulosa en el espacio profundo. Ideal para amantes del café y el cosmos.',
      specs: {
        material: 'Cerámica de alta resistencia',
        details: 'Apta para microondas y lavavajillas. Capacidad: 11 oz (325ml).'
      }
    },
    {
      id: 'sunset-mug',
      name: 'Taza Degradado Atardecer',
      category: 'mugs',
      categoryLabel: 'Taza Sublimada',
      price: 120,
      image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
      description: 'Hermosa taza sublimada con colores cálidos e intensos en degradado, evocando un atardecer veraniego perfecto. Aporta energía positiva a tus mañanas.',
      specs: {
        material: 'Cerámica brillante',
        details: 'Impresión térmica 360 grados. Capacidad: 11 oz.'
      }
    },
    {
      id: 'minimal-thermo',
      name: 'Termo Mate Negro',
      category: 'termos',
      categoryLabel: 'Termo Vinil',
      price: 250,
      image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80',
      description: 'Termo de acero inoxidable con acabado mate texturizado. Personalizado con vinilo de alta adherencia en tono oro metálico. Conserva tu bebida a la temperatura perfecta.',
      specs: {
        material: 'Acero inoxidable de doble pared',
        details: 'Aislamiento al vacío. Mantiene frío 24h, caliente 12h. Capacidad: 500ml.'
      }
    },
    {
      id: 'neon-thermo',
      name: 'Termo Degradado Neón',
      category: 'termos',
      categoryLabel: 'Termo Vinil',
      price: 260,
      image: 'https://images.unsplash.com/photo-1592861956120-e524fc739696?w=600&auto=format&fit=crop&q=80',
      description: 'Llamativo vaso térmico con un degradado de azul cian a rosa neón. Decorado con tipografías y líneas holográficas que cambian de color con la luz del día.',
      specs: {
        material: 'Acero inoxidable 304 térmico',
        details: 'Tapa hermética libre de BPA. Capacidad: 600ml.'
      }
    },
    {
      id: 'dragon-3d',
      name: 'Flexi Dragon Articulado',
      category: 'print3d',
      categoryLabel: 'Impresión 3D',
      price: 180,
      image: 'https://images.unsplash.com/photo-1615655406736-b37c4fabf923?w=600&auto=format&fit=crop&q=80',
      description: 'Figura de dragón completamente articulada, impresa en una sola pieza con filamento PLA de alta precisión. Las extremidades y escamas se mueven libremente de forma fluida.',
      specs: {
        material: 'PLA Biodegradable de alta densidad',
        details: 'Dimensiones: 35cm de longitud. Diseño articulado antiestrés.'
      }
    },
    {
      id: 'pots-3d',
      name: 'Macetas Geométricas Modernas',
      category: 'print3d',
      categoryLabel: 'Impresión 3D',
      price: 220,
      image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&auto=format&fit=crop&q=80',
      description: 'Juego de tres macetas miniaturas con patrones poligonales minimalistas. Cuentan con un sistema de drenaje invisible oculto en la base. Ideales para suculentas.',
      specs: {
        material: 'PLA reforzado (resistente al agua)',
        details: 'Set de 3 piezas de 8x8cm. Colores mate combinados.'
      }
    },
    {
      id: 'retro-mug',
      name: 'Taza Vaporwave 80s',
      category: 'mugs',
      categoryLabel: 'Taza Sublimada',
      price: 120,
      image: 'https://images.unsplash.com/photo-1517256064527-09c53b2d0ec6?w=600&auto=format&fit=crop&q=80',
      description: 'Taza sublimada con una cuadrícula retro, palmeras y sol degradado al más puro estilo estético de los años 80 y la cultura Vaporwave.',
      specs: {
        material: 'Cerámica brillante',
        details: 'Apta para lavavajillas y microondas. Capacidad: 11 oz.'
      }
    },
    {
      id: 'exec-thermo',
      name: 'Termo Ejecutivo Acero',
      category: 'termos',
      categoryLabel: 'Termo Vinil',
      price: 280,
      image: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=600&auto=format&fit=crop&q=80',
      description: 'Termo de acero inoxidable cepillado con mango ergonómico. Personalizado con vinilo de alta durabilidad para un aspecto limpio, profesional y sobrio.',
      specs: {
        material: 'Acero inoxidable de grado alimenticio',
        details: 'Taza integrada en la tapa. Capacidad: 750ml.'
      }
    },
    {
      id: 'organizer-3d',
      name: 'Organizador Modular Pro',
      category: 'print3d',
      categoryLabel: 'Impresión 3D',
      price: 200,
      image: 'https://images.unsplash.com/photo-1590244921950-b88d8f7bf4f2?w=600&auto=format&fit=crop&q=80',
      description: 'Soporte modular impreso en 3D para bolígrafos, clips, teléfono inteligente y notas adhesivas. Las bandejas laterales magnéticas se pueden reorganizar libremente.',
      specs: {
        material: 'PLA rígido estructurado',
        details: 'Dimensiones: 20x12x8cm. 4 módulos magnéticos.'
      }
    }
  ];

  // --- 2. Query URL and Load Product details ---
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  
  const product = designsData.find(item => item.id === productId);

  const detailLayout = document.getElementById('product-detail-layout');
  const notFoundLayout = document.getElementById('product-not-found-layout');
  const recommendationsContainer = document.getElementById('recommendations-container');

  if (product) {
    // Populate product page elements
    document.getElementById('product-img').src = product.image;
    document.getElementById('product-img').alt = product.name;
    document.getElementById('product-title').textContent = product.name;
    document.getElementById('product-price').textContent = `$${product.price} MXN`;
    document.getElementById('product-desc').textContent = product.description;
    
    // Specifications
    document.getElementById('spec-material').textContent = product.specs.material;
    document.getElementById('spec-details').textContent = product.specs.details;

    // Badges & Themes
    const badge = document.getElementById('product-badge');
    badge.textContent = product.categoryLabel;
    badge.className = `product-badge-theme ${product.category}-theme`;

    // Set page Title
    document.title = `${product.name} | Crea y Regala`;

    // WhatsApp Direct Link
    const phoneNumber = "525626248386";
    const customMessage = `Hola Crea y Regala, me interesa encargar el siguiente diseño de su catálogo:\n\n` +
                          `• Producto: ${product.name}\n` +
                          `• Categoría: ${product.categoryLabel}\n` +
                          `• Precio: $${product.price} MXN\n` +
                          `• Material: ${product.specs.material}\n\n` +
                          `¿Me podrían dar detalles sobre tiempos de entrega y envío? ¡Gracias!`;
    
    document.getElementById('product-whatsapp-btn').href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(customMessage)}`;

    // Show details layout
    detailLayout.style.display = 'grid';

    // Render Recommendations
    const recommendationsGrid = document.getElementById('recommendations-grid');
    if (recommendationsGrid) {
      // 1. Get same-category products
      let recs = designsData.filter(item => item.category === product.category && item.id !== product.id).slice(0, 3);
      
      // 2. Fallback to other designs if less than 3
      if (recs.length < 3) {
        const others = designsData.filter(item => item.id !== product.id && !recs.find(r => r.id === item.id)).slice(0, 3 - recs.length);
        recs.push(...others);
      }

      recommendationsGrid.innerHTML = '';
      recs.forEach(rec => {
        const card = document.createElement('div');
        card.className = `catalog-card ${rec.category}-card`;
        card.innerHTML = `
          <span class="card-badge">${rec.categoryLabel}</span>
          <div class="card-img-container">
            <img src="${rec.image}" alt="${rec.name}" loading="lazy">
          </div>
          <h3 class="card-title">${rec.name}</h3>
          <p class="card-desc">${rec.description.substring(0, 80)}...</p>
          <div class="card-footer">
            <span class="card-price">$${rec.price} MXN</span>
            <span class="card-action">
              <span>Ver detalles</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </span>
          </div>
        `;
        card.addEventListener('click', () => {
          window.location.href = `articulo.html?id=${rec.id}`;
        });
        recommendationsGrid.appendChild(card);
      });

      recommendationsContainer.style.display = 'block';
    }

  } else {
    // Product not found or no ID provided
    notFoundLayout.style.display = 'block';
    document.title = `Diseño no encontrado | Crea y Regala`;
  }

  // --- 3. Starry Background Canvas Engine ---
  const canvas = document.getElementById('starry-background');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let stars = [];
    const starCount = window.innerWidth < 769 ? 35 : 65;

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    function initStars() {
      stars = [];
      for (let i = 0; i < starCount; i++) {
        const size = Math.random() * Math.random() * 1.8 + 0.4;
        const depth = size / 2.2;
        
        let colorPrefix = 'rgba(255, 255, 255, ';
        const colorRand = Math.random();
        if (colorRand < 0.08) {
          colorPrefix = 'rgba(120, 200, 240, ';
        } else if (colorRand < 0.16) {
          colorPrefix = 'rgba(220, 240, 120, ';
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

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();

    window.addEventListener('mousemove', (e) => {
      targetMouseX = (e.clientX - window.innerWidth / 2) * 0.04;
      targetMouseY = (e.clientY - window.innerHeight / 2) * 0.04;
    });

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

      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      const scrollY = window.scrollY;

      stars.forEach(star => {
        star.phase += star.twinkleSpeed;
        const opacity = 0.25 + Math.abs(Math.sin(star.phase)) * 0.75;

        const rx = (star.x - mouseX * star.depth) % canvas.width;
        const ry = (star.y - scrollY * star.depth - mouseY * star.depth) % canvas.height;

        const finalX = rx < 0 ? rx + canvas.width : rx;
        const finalY = ry < 0 ? ry + canvas.height : ry;

        ctx.fillStyle = star.color + opacity + ')';
        ctx.beginPath();
        ctx.arc(finalX, finalY, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    }

    animate();

    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initStars();
      }, 150);
    });

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
