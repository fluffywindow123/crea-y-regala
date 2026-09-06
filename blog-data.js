/**
 * SISTEMA DE PUBLICACIONES Y BLOG
 * =================================
 * Aquí puedes agregar, editar o eliminar publicaciones fácilmente.
 * Cada publicación puede tener:
 * - id: Identificador numérico único
 * - title: Nombre o título de la publicación
 * - category: Categoría (ej. "General", "Gaming", "Novedades", "Diseño", etc.)
 * - date: Fecha legible (ej. "Jun 10, 2026")
 * - readTime: Tiempo de lectura estimado (ej. "4 minutos")
 * - image: Ruta local (ej. "assets/imagen.png") o enlace web (https://...)
 * - excerpt: Resumen corto que se muestra en la tarjeta
 * - content: Texto completo con formato HTML (<p>, <h3>, <ul>, <li>, <a>, <img>, etc.)
 */

const BLOG_POSTS = [
    {
        id: 1,
        title: "Bienvenidos a Crea y Regala",
        category: "Productos personalizados",
        date: "Sep 5, 2026",
        readTime: "2 minutos",
        image: "assets/tazas.png",
        excerpt: "Detalles personalizados para fiestas, regalos y momentos especiales.",
        content: `
        <p>🎉✨ ¡Bienvenidos a <strong>Crea y Regala</strong>! ✨🎉</p>

        <h3>¿Qué podrán encontrar aquí?</h3>

        <ul>
            <li>🥤 Vasos personalizados con vinil</li>
            <li>☕ Tazas personalizadas con diferentes diseños y estilos</li>
            <li>🎨 Ideas y productos personalizados para fiestas, regalos y eventos</li>
        </ul>

        <p>En Crea y Regala queremos ayudarte a crear detalles especiales para cumpleaños, fiestas, eventos o para sorprender a alguien importante.</p>

        <p>Puedes contarnos tu idea y juntos podemos darle forma a un producto personalizado para ese momento especial.</p>

        <p>Contamos con entrega a domicilio con costo adicional y también puedes recoger tu pedido sin costo extra.</p>

        <p>Aceptamos pagos mediante transferencia bancaria y depósitos. </p>

        <p>✨ <strong>Crea, sorprende y regala</strong> algo hecho especialmente para ti.</p>
    `
    },

];

// Exponer en el objeto global de ventana para modularidad
if (typeof window !== 'undefined') {
    window.BLOG_POSTS = BLOG_POSTS;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BLOG_POSTS };
}
