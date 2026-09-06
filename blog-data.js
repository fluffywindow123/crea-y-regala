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
        title: "la bienvenida",
        category: "General",
        date: "Jun 3, 2026",
        readTime: "2 minutos",
        image: "assets/Fluffy Saludando.png",
        excerpt: "Hola, aquí fluffy, en mi blog personal con temas de todo tipo, supongo xd",
        content: `
            <p>Hola, aquí fluffy. En esta primer entrada de blog quiero hablar sobre cosas que podrán ver aquí.</p>
            <h3>¿Qué podrán ver aquí?</h3>
            <ul>
                <li>Ideas sobre creatividad</li>
                <li>Ideas sobre diseño</li>
                <li>Ideas sobre reflexiones</li>
            </ul>
            <p>Espero que les guste mi blog de fluffy, por ejemplo en blogs posteriores pondré info sobre un juego que saldrá próximamente. Esto con el fin de que puedan ver todo lo que se viene en el blog de fluffy, que tendrán cosas interesantes para todos ustedes. En fin, disfrútenlo.</p>
            <p>Saludos, fluffy.</p>
        `
    },
    {
        id: 2,
        title: "Retrospectiva: Toy Story 3 El Videojuego",
        category: "Gaming",
        date: "Jun 4, 2026",
        readTime: "5 minutos",
        image: "https://imagen.nextn.es/wp-content/uploads/2026/06/2606-02-Toy-Story-Retro-Roundup-Toy-Story-3-Complete-Edition-Anunciado-15-Octubre-Formato-Fisico-Nintendo-Switch-2-PS5-PS4-Xbox-Series-PC-01.jpg",
        excerpt: "Recordando uno de los mejores juegos de la infancia: Toy Story 3 y su modo Toy Box.",
        content: `
            <p>¡Hola! Aquí fluffy. Hoy les traigo un anuncio de lo que posiblemente es el mejor regreso (para mí) del año en la industria de los videojuegos.</p>
            
            <p>Se trata del regreso del juego Toy Story 3, pero esta vez en una edición completa que incluye todo lo que tenían todas las ediciones de las consolas como PS3, Xbox 360, Wii y PC.</p>
            
            <h3>Juegos retro</h3>
            <p>Para las ediciones de consola, junto con Toy Story 3 se lanzarán varios juegos que salieron para consolas retro como las ediciones de las películas Toy Story 1 y 2, además de un juego de carreras: Toy Story Racer, Buzz Lightyear of Star Command y un juego de Bichos.</p>

            <h3>¿Cuándo saldrá esta edición?</h3>
            <p>Todos los juegos se lanzarán el 15 de octubre del 2026 para consolas como Nintendo Switch (1 y 2), PS4 y PS5, Xbox Series X/S y PC.</p>

            <p>Algo que me gusta del juego de Toy Story 3 es que tenías una corta pero buena historia donde se contaba la trama de la película con alguna que otra adaptación que la hacía más entretenida. Pero lo más increíble del juego era su modo Toy Box.</p>
            
            <h3>El increíble modo Toy Box</h3>
            <p>Este juego no era solo una adaptación de la película, sino que introdujo el modo Toy Box, un mundo abierto donde podías personalizar tu pueblo, completar misiones y jugar con Woody, Buzz o Jessie, y en la versión de PS3 podías jugar con Zurg, que ahora en la nueva edición estará disponible para todas las plataformas.</p>

            <h4>Te invito a ver el tráiler de la colección:</h4>
            [video 1]

            <h3>Enlace de Steam a la colección de juegos retro</h3>
            <p>
                <a href="https://store.steampowered.com/app/4049170/DisneyoPixar_Toy_Story_Retro_Roundup/" target="_blank" rel="noopener noreferrer">Ver Disney•Pixar Toy Story Retro Roundup en Steam ↗</a>
            </p>

            <h3>Enlace de Steam a Toy Story 3</h3>
            <p>
                <a href="https://store.steampowered.com/app/4049180/DisneyoPixar_Toy_Story_3_Complete_Edition/" target="_blank" rel="noopener noreferrer">Ver Disney•Pixar Toy Story 3 Complete Edition en Steam ↗</a>
            </p>
        `
    },
    {
        id: 3,
        title: "Todos los juegos del Summer Game Fest 2026",
        category: "Gaming",
        date: "Jun 10, 2026",
        readTime: "10 minutos",
        image: "https://i.ytimg.com/vi/SFTkefXMIws/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLDkafSs74Ph_SQhf5GQC-u9kaReOA",
        excerpt: "El desglose masivo y real con cada uno de los anuncios y fechas de la gala de Geoff Keighley.",
        content: `
            <p>¡Hola! Aquí fluffy. Hoy les traigo la lista definitiva, real y sin filtros de absolutamente todo lo que pisó el escenario del Summer Game Fest según el seguimiento de MeriStation. Prepara la cartera porque se viene un aluvión de lanzamientos brutales.</p>
            
            <p>Tuvimos desde remakes ultra esperados hasta el regreso de joyas de culto y sorpresas cooperativas. Vamos directo al grano con toda la lista.</p>
            
            <h3>Los bombazos principales de la gala</h3>
            <p><b>Resident Evil Veronica:</b> El megabombazo de Capcom abriendo el show. Una reimaginación total del clásico Code: Veronica usando el RE Engine que apunta a llegar en 2027.</p>
            [video_resident_evil_veronica]

            <p><b>Final Fantasy VII Revelation:</b> Square Enix cerró la transmisión enseñando la tercera y última entrega de la trilogía del remake. Llegará en la primavera de 2027 para PS5, PC, Xbox Series y Nintendo Switch 2 coincidiendo con el 30 aniversario del original.</p>
            [video_final_fantasy_vii_revelation]

            <p><b>Control Resonant:</b> Remedy mostró la esperada continuación donde manejaremos a Dylan Faden en una versión paranatural y totalmente distorsionada de Manhattan. Sale el 24 de septiembre de 2026.</p>
            [video_control_resonant]

            <p><b>Assassin's Creed IV: Black Flag Resynced:</b> Ubisoft confirmó el regreso de Edward Kenway a los mares con esta revisión que promete traer de vuelta toda la piratería clásica el próximo 9 de julio de 2026.</p>
            [video_assassins_creed_black_flag]

            <h3>Secuelas y nuevas IPs de peso</h3>
            <p><b>gen Atlas:</b> Lo nuevo de genDesign (creadores de Shadow of the Colossus y The Last Guardian) de la mano de Epic Games. Una aventura de acción y mundo abierto en un planeta desolado con robots colosales.</p>
            [video_gen_atlas]

            <p><b>Mighty Cuphead Adventure:</b> Studio MDHR sorprendió con un juego de acción en 8 bits desarrollado bajo las especificaciones reales de la clásica Sega Master System.</p>
            [video_mighty_cuphead]

            <p><b>Teenage Mutant Ninja Turtles: The Last Ronin:</b> Adaptación oficial de la famosa novela gráfica desarrollada por PlatinumGames y Paramount. Controlaremos a la última tortuga superviviente en su misión de venganza.</p>
            [video_tmnt_last_ronin]

            <p><b>Guild Wars 3:</b> ArenaNet soltó el bombazo confirmando que la tercera entrega de su MMORPG llegará por primera vez a consolas (PS5) además de PC, con una primera beta en otoño de 2027.</p>
            [video_guild_wars_3]

            <p><b>Gundam Rogue Orbit:</b> Bandai Namco presentó una nueva propuesta de acción de alta movilidad y batallas espaciales cinemáticas programada para 2027.</p>
            [video_gundam_rogue_orbit]

            <h3>Estrategia, Conducción y Supervivencia</h3>
            <p><b>Star Wars Zero Company:</b> Desarrollado por Bit Reactor, mostraron más de este juego táctico por turnos donde Anakin Skywalker tendrá un peso gigantesco en la trama.</p>
            [video15]

            <p><b>Star Wars: Galactic Racer:</b> La velocidad pura regresa con un título centrado en las míticas carreras de vainas galácticas que llegará el 6 de octubre de 2026.</p>
            [video_star_wars_galactic_racer]

            <p><b>Hot Wheels Infinite Rush:</b> Conducción arcade en mundo abierto de la mano de Milestone, lleno de rampas naranjas gigantescas en una ciudad de juguetes. Sale el 24 de septiembre de 2026.</p>
            [video_hot_wheels_infinite_rush]

            <p><b>Palworld (Versión 1.0):</b> Pocketpair anunció que el juego de supervivencia y gestión de criaturas cerrará por fin su acceso anticipado lanzando la versión definitiva el 10 de julio de 2026.</p>
            [video_palworld_1_0]

            <p><b>Grounded 2:</b> Obsidian confirmó la expansión "Into the Abyss" para el 11 de agosto de 2026, llevando la supervivencia miniatura a zonas aún más profundas y peligrosas del jardín.</p>
            [video_grounded_2]

            <h3>Joyas independientes y terror</h3>
            <p><b>The Blood of Dawnwalker:</b> Lo nuevo de Rebel Wolves junto a Bandai Namco. Un RPG vampírico oscuro ambientado en la Europa del siglo XIV que llegará el 3 de septiembre de 2026.</p>
            [video_the_blood_of_dawnwalker]

            <p><b>Among Us Story: On Guard:</b> Innersloth anunció una aventura narrativa espacial donde jugaremos como el guardia de seguridad de la nave intentando resolver un asesinato antes de que el impostor nos atrape.</p>
            [video_among_us_story]

            <p><b>An Eggstremely Hard Game:</b> Un divertido y caótico juego cooperativo donde hasta cuatro jugadores controlan a unos patos transportando un huevo a través de obstáculos. Llega este 24 de julio de 2026.</p>
            [video_an_eggstremely_hard_game]

            <h4>Aquí tienes el video oficial con el resumen general de la gala:</h4>
            [video_summer_game_fest_resumen]
            
            <h3>Sorpresas de la madrugada (Anuncios Post-Show)</h3>
            <p><b>Hitman Classic Trilogy Remastered:</b> El Agente 47 regresa en 2027 reuniendo Codename 47, Silent Assassin y Contracts remasterizados con gráficos modernos y modo foto.</p>
            [video_hitman_classic_trilogy]

            <p><b>Trine 6:</b> Vuelve la clásica y hermosa saga de plataformas y puzles en 2D, fijando su fecha de lanzamiento para el 17 de septiembre de 2026 en todas las plataformas.</p>
            [video_trine_6]

            <p><b>Super Yooka-Laylee Kart:</b> Un juego de carreras de karts con un estilo retro divertidísimo que reunirá a los personajes de la franquicia en pistas al más puro estilo clásico.</p>
            [video_yooka_laylee]
        `
    },
    {
        id: 4,
        title: "¡Oficial!: Ocarina of Time Remake llegará a Switch 2",
        category: "Gaming",
        date: "Jun 9, 2026",
        readTime: "4 minutos",
        image: "https://pbs.twimg.com/media/HKYfkUKWIAAARXo.png",
        excerpt: "Hyrule renace. Nintendo anunció el remake de Ocarina of Time exclusivo para su nueva consola.",
        content: `
            <p>¡Hola! Aquí fluffy. Hoy les traigo el que sin duda alguna es el mayor bombazo del año y probablemente de la década para todos los que amamos los videojuegos.</p>
            
            <p>Se terminó la espera y los rumores eran totalmente reales: ¡Nintendo acaba de anunciar oficialmente el remake de The Legend of Zelda: Ocarina of Time! Esta obra maestra va a renacer por completo con un nuevo estilo visual espectacular, desarrollado exclusivamente para la Nintendo Switch 2.</p>
            
            <h3>El regreso de una leyenda</h3>
            <p>El anuncio cerró el Nintendo Direct con broche de oro. El teaser comenzó mostrando los paisajes nostálgicos del Bosque Kokiri y al Gran Árbol Deku hablando del niño que no tenía un hada, para luego mostrarnos un vistazo increíble de Link dormido en su casa con unos gráficos actualizados que quitan el aliento. Al parecer, el logo usa una tipografía muy al estilo de Breath of the Wild, por lo que muchos ya rumorean que podrían fusionar la exploración moderna con la clásica historia de 1998.</p>

            <h3>¿Cuándo saldrá esta joya?</h3>
            <p>Aunque Nintendo nos dejó con las ganas de ver un gameplay detallado, confirmaron que el juego se lanzará en algún momento de este mismo año 2026. Están tirando la casa por la ventana para celebrar con todo el 40 aniversario de la franquicia.</p>
            
            <h4>Te invito a ver el teaser tráiler del anuncio:</h4>
            [video 2]

            <h3>¿Qué más sabemos?</h3>
            <p>De momento se sabe que será una exclusiva total de la nueva generación de Nintendo (Switch 2). Nos prometieron que darán muchísimos más detalles y mecánicas de combate renovadas más adelante en el año, pero la emoción ya está por las nubes.</p>
        `
    }
];

// Exponer en el objeto global de ventana para modularidad
if (typeof window !== 'undefined') {
    window.BLOG_POSTS = BLOG_POSTS;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BLOG_POSTS };
}
