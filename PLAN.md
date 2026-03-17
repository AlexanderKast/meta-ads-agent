# Claude Ads - Plan de Desarrollo

## Estado Actual (Auditoria del Codigo)

### Lo que tenemos
- **Stack**: Next.js 16 + React 19 + Tailwind v4 + TypeScript
- **API**: 1 endpoint (`/api/generate`) que llama a Claude Sonnet 4.6
- **UI**: Pagina unica con formulario (plataforma, objetivo, tono, producto, audiencia) + resultados + copiar al clipboard
- **Plataformas**: Meta, TikTok, Google, YouTube
- **Tipos**: `AdRequest`, `AdResponse`, `AdVariation` en `src/lib/types.ts`
- **Prompt**: Prompt unico con specs por plataforma (limites de caracteres, estilo)

### Lo que NO tenemos
- Sin autenticacion ni usuarios
- Sin base de datos ni persistencia
- Sin historial de generaciones
- Sin tests de ningun tipo
- Sin validacion robusta de inputs
- Sin rate limiting ni proteccion de API
- Sin streaming (espera completa)
- Sin componentes reutilizables (todo en `page.tsx` - 419 lineas)
- Sin manejo de errores granular
- Sin analytics ni tracking
- Sin SEO ni landing page
- Sin deployment configurado

---

## Objetivos del Proyecto

1. **Herramienta SaaS de generacion de ads con IA** - Que cualquier marketer pueda generar copy publicitario profesional en segundos
2. **Multi-plataforma con conocimiento experto** - Cada plataforma tiene sus specs, limites y mejores practicas integradas
3. **Monetizable** - Modelo freemium con limites de generacion gratuitos y planes pagos
4. **Escalable** - Arquitectura que soporte miles de usuarios concurrentes

---

## Estructura de Archivos Propuesta

```
src/
├── app/
│   ├── (marketing)/          # Landing page publica
│   │   ├── page.tsx          # Landing / hero
│   │   └── layout.tsx
│   ├── (app)/                # App autenticada
│   │   ├── dashboard/
│   │   │   └── page.tsx      # Dashboard principal
│   │   ├── generate/
│   │   │   └── page.tsx      # Generador (actual page.tsx refactorizado)
│   │   ├── history/
│   │   │   └── page.tsx      # Historial de generaciones
│   │   ├── templates/
│   │   │   └── page.tsx      # Templates guardados
│   │   ├── brand/
│   │   │   └── page.tsx      # Perfil de marca / Brand DNA
│   │   └── layout.tsx        # Layout con sidebar
│   ├── api/
│   │   ├── generate/
│   │   │   └── route.ts      # Generacion de ads (existente, mejorado)
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts  # NextAuth endpoints
│   │   ├── history/
│   │   │   └── route.ts      # CRUD historial
│   │   ├── templates/
│   │   │   └── route.ts      # CRUD templates
│   │   ├── brand/
│   │   │   └── route.ts      # Brand profile
│   │   └── usage/
│   │       └── route.ts      # Tracking de uso / limites
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                   # Componentes base (Button, Input, Card, etc.)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── select.tsx
│   │   ├── badge.tsx
│   │   ├── dialog.tsx
│   │   └── toast.tsx
│   ├── forms/
│   │   ├── ad-form.tsx       # Formulario de generacion
│   │   ├── platform-selector.tsx
│   │   ├── objective-selector.tsx
│   │   └── tone-selector.tsx
│   ├── ads/
│   │   ├── ad-card.tsx       # Card de variacion individual
│   │   ├── ad-results.tsx    # Lista de resultados
│   │   ├── ad-tips.tsx       # Tips de optimizacion
│   │   ├── ad-preview.tsx    # Preview visual por plataforma
│   │   └── copy-button.tsx   # Boton copiar
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   ├── footer.tsx
│   │   └── nav-links.tsx
│   └── shared/
│       ├── loading-spinner.tsx
│       ├── error-message.tsx
│       └── empty-state.tsx
├── lib/
│   ├── types.ts              # Tipos globales (existente, expandido)
│   ├── constants.ts          # Constantes (plataformas, objetivos, tonos)
│   ├── prompts/
│   │   ├── base.ts           # Prompt base compartido
│   │   ├── meta.ts           # Prompt especializado Meta
│   │   ├── tiktok.ts         # Prompt especializado TikTok
│   │   ├── google.ts         # Prompt especializado Google
│   │   └── youtube.ts        # Prompt especializado YouTube
│   ├── validators.ts         # Validacion con Zod
│   ├── db.ts                 # Cliente Supabase
│   ├── auth.ts               # Configuracion NextAuth
│   └── utils.ts              # Utilidades generales
├── hooks/
│   ├── use-generate.ts       # Hook para generacion con streaming
│   ├── use-history.ts        # Hook para historial
│   └── use-copy.ts           # Hook para copiar al clipboard
└── styles/
    └── ...
```

---

## Funcionalidades a Desarrollar

### Fase 1 - Refactor + Fundamentos (Semana 1-2)

**Objetivo**: Limpiar el codigo actual, componentizar, y preparar la base para escalar.

#### 1.1 Refactor de Codigo
- [ ] **Descomponer `page.tsx`** en componentes reutilizables (`AdForm`, `AdCard`, `AdResults`, etc.)
- [ ] **Extraer prompts** a archivos separados por plataforma con specs actualizadas
- [ ] **Agregar validacion** con Zod en el API route
- [ ] **Implementar streaming** de respuestas de Claude (mejor UX, menos timeout)
- [ ] **Agregar componentes UI base** (Button, Card, Input) con variantes consistentes
- [ ] **Separar constantes** de tipos (PLATFORMS, OBJECTIVES, TONES a `constants.ts`)
- [ ] **Mejorar manejo de errores** - mensajes especificos por tipo de error
- [ ] **Agregar loading states** mejorados (skeleton, progress indicator)
- [ ] **Rate limiting basico** en el API route (por IP)
- [ ] **Tests basicos** - Al menos tests para validadores y API route

#### 1.2 Frameworks de Copywriting
- [ ] **Selector de framework** por variacion (opcion en el formulario):
  - **AIDA** — Attention, Interest, Desire, Action
  - **PAS** — Problem, Agitate, Solution
  - **BAB** — Before, After, Bridge
  - **FAB** — Features, Advantages, Benefits
  - **4Ps** — Picture, Promise, Prove, Push
  - **QUEST** — Qualify, Understand, Educate, Stimulate, Transition
  - **SLAP** — Stop, Look, Act, Purchase
  - **Hook-Story-Offer** — Para TikTok/YouTube especialmente
  - **The 1-2-3** — Un dolor, dos consecuencias, tres beneficios
- [ ] **Opcion "Auto"** que elige el mejor framework segun objetivo + plataforma
- [ ] **Prompt engineering** por framework: cada formula genera estructura de copy diferente

#### 1.3 Contador de Caracteres y Validacion
- [ ] **Contador en tiempo real** por campo y plataforma (colores rojo/amarillo/verde)
- [ ] **Validacion post-generacion** — Alertar si el copy excede limites de la plataforma
- [ ] **Truncamiento inteligente** — Sugerir versiones mas cortas si excede limites

#### 1.4 Preview Visual por Plataforma
- [ ] **Mockups interactivos** del anuncio como se veria en:
  - Feed de Instagram / Facebook (post + stories)
  - TikTok For You Page
  - Google SERP (search results)
  - YouTube pre-roll (con boton Skip)
- [ ] **Toggle dark/light mode** del preview
- [ ] **Vista responsive** — Preview mobile vs desktop

#### 1.5 Mejoras de UX del Generador
- [ ] **Comparador lado a lado** — Ver 2-3 variaciones simultaneamente
- [ ] **Edicion inline** — Editar el copy generado directamente en la UI
- [ ] **Regenerar individual** — Regenerar solo una variacion sin perder las demas
- [ ] **Rating de variaciones** — Marcar favoritas con estrellas (1-5)
- [ ] **Iteracion sobre resultados** — "Hazlo mas urgente", "Acorta el headline", "Cambia el CTA"

---

### Fase 2 - Persistencia + Auth + Formatos (Semana 3-5)

**Objetivo**: Agregar usuarios, persistencia, historial y formatos avanzados de anuncios.

#### 2.1 Autenticacion y Base de Datos
- [ ] **Supabase setup** - Base de datos + Auth
- [ ] **Autenticacion** con NextAuth (Google + Email magic link)
- [ ] **Modelo de datos** (ver seccion detallada abajo)
- [ ] **Historial de generaciones** - Guardar cada generacion, poder revisitar
  - Busqueda y filtros por fecha, plataforma, producto, framework
  - Tags personalizados
- [ ] **Templates guardados** - Guardar combinaciones de inputs como templates reutilizables
- [ ] **Favoritos** - Marcar variaciones especificas como favoritas
- [ ] **Dashboard** - Vista general con stats basicas
- [ ] **Layouts autenticados** - Sidebar, navegacion, user menu

#### 2.2 Brand DNA / Perfil de Marca
- [ ] **Extractor automatico de marca** — Ingresar URL del sitio y extraer con IA:
  - Paleta de colores (hex codes)
  - Tipografia / estilo visual
  - Tono de voz (formal, casual, tecnico, etc.)
  - Propuesta de valor principal
  - Palabras clave de marca
  - "Do say" / "Don't say" — vocabulario de marca
- [ ] **brand-profile.json** — Guardar perfil de marca reutilizable
- [ ] **Multi-marca** — Gestionar multiples marcas (para agencias)
- [ ] Aplicar automaticamente el perfil de marca a cada generacion de copy

#### 2.3 Formatos de Anuncio Especializados
- [ ] **Carousel Ads** — Generar 3-5 slides con copy coherente entre si
  - Narrativa progresiva (historia, beneficios secuenciales, comparativa)
  - Copy individual por slide + titulo unificador
- [ ] **Story/Reels Ads** — Copy vertical: hook + body + CTA overlay
  - Incluir sugerencias de texto en pantalla (text overlays)
  - Duracion sugerida por escena
- [ ] **UGC Scripts** — Guiones completos estilo user-generated content
  - Intro, problema, descubrimiento, demo, resultado, CTA
  - Variantes: testimonial, POV, get ready with me, unboxing, story time
  - Notas de produccion (angulos de camara, transiciones)
- [ ] **Email Sequences** — Copy de follow-up post-click (3-5 emails):
  - Welcome / confirmacion
  - Nurture / valor
  - Oferta principal
  - Urgencia / countdown
  - Ultima oportunidad
- [ ] **Landing Page Copy** — Secciones completas:
  - Hero (headline + subheadline + CTA)
  - Beneficios (3-6 con iconos)
  - Social proof (testimonials template)
  - FAQ (5-8 preguntas)
  - CTA final con urgencia
- [ ] **Retargeting Copy** — Copy especifico para remarketing:
  - Visitaron pero no compraron
  - Abandonaron carrito
  - Clientes anteriores (upsell/cross-sell)
  - Suscriptores inactivos

#### 2.4 Plataformas Adicionales
- [ ] **LinkedIn Ads** — Sponsored Content, Message Ads, Document Ads
  - Headlines: 70 chars, Intro text: 150 chars visible, Description: 100 chars
  - Tonos B2B: thought leadership, datos, autoridad
- [ ] **Microsoft/Bing Ads** — Search, Audience, Shopping
  - Specs similares a Google con matices de la plataforma
- [ ] **Pinterest Ads** — Standard Pins, Idea Pins, Shopping
  - Titulos: 100 chars, Description: 500 chars, estilo aspiracional
- [ ] **X (Twitter) Ads** — Promoted Tweets, Follower Ads, Amplify
  - Copy: 280 chars, Headlines: 70 chars, estilo conversacional
- [ ] **Snapchat Ads** — Single Image/Video, Story, Collection
  - Headline: 34 chars, CTA predefinidos
- [ ] **Apple Search Ads** — Para apps (keyword-based)

#### 2.5 Exportacion Profesional
- [ ] **Copiar todo** — Todas las variaciones al clipboard con formato
- [ ] **Exportar CSV** — Para subir directamente a Meta Business Manager, Google Ads Editor
- [ ] **Exportar PDF** — Presentacion para clientes con branding profesional
- [ ] **Exportar Google Sheets** — Link directo o descarga compatible
- [ ] **Formato bulk upload** — Templates especificos por plataforma para importacion masiva
- [ ] **Exportar como brief** — Documento para equipos de diseno/produccion

---

### Fase 3 - Inteligencia de Marketing (Semana 6-9)

**Objetivo**: Agregar inteligencia estrategica que diferencie la herramienta de cualquier competidor.

#### 3.1 Audiencia Avanzada / Buyer Personas
- [ ] **Creador de Buyer Personas** — Crear y guardar personas detalladas:
  - **Demografia**: edad, genero, ubicacion, ingreso, educacion, ocupacion
  - **Psicografia**: intereses, valores, miedos, deseos, frustraciones
  - **Comportamiento digital**: plataformas favoritas, horarios de uso, dispositivos
  - **Puntos de dolor**: top 3-5 problemas que quieren resolver
  - **Objeciones de compra**: por que NO comprarian
  - **Trigger words**: lenguaje que resuena con ellos
  - **Influencias**: marcas que admiran, creadores que siguen
- [ ] **Generador de Personas con IA** — A partir de producto + industria, generar 3-5 personas automaticamente
- [ ] **Segmentacion automatica** — Sugerir segmentos ideales por plataforma
- [ ] **Targeting suggestions** — Sugerir intereses, lookalikes, custom audiences por plataforma
- [ ] **Persona-aware copy** — El copy generado se adapta automaticamente a la persona seleccionada

#### 3.2 Analisis Competitivo
- [ ] **Competitor Ad Analyzer** — Pegar un anuncio de la competencia y obtener:
  - Framework utilizado
  - Puntos fuertes y debiles
  - Angulo de venta principal
  - 3 versiones mejoradas que lo superen
- [ ] **Competitor Intelligence** — Ingresar URL/marca competidora y analizar:
  - Mensajes principales que usan
  - Tonos dominantes
  - CTAs mas frecuentes
  - Gaps y oportunidades que no estan cubriendo
- [ ] **Benchmark de industria** — Metricas promedio por vertical:
  - CTR, CPC, CPA, ROAS por plataforma e industria
  - Mejores practicas del sector
- [ ] **Diferenciador automatico** — Generar copy que explote los gaps de la competencia

#### 3.3 Ad Score y Prediccion de Performance
- [ ] **Ad Score (0-100)** — Puntaje predictivo de cada variacion basado en:
  - **Claridad del mensaje** (10pts) — Se entiende la oferta en 3 segundos?
  - **Power words** (10pts) — Uso de palabras que generan accion
  - **Longitud optima** (10pts) — Dentro del rango ideal para la plataforma
  - **Social proof** (10pts) — Incluye numeros, testimonios, autoridad
  - **Urgencia/escasez** (10pts) — Motivo para actuar ahora
  - **Especificidad** (10pts) — Numeros concretos vs promesas vagas
  - **Emotional trigger** (10pts) — Toca un dolor o deseo real
  - **CTA strength** (10pts) — CTA claro, especifico, con beneficio
  - **Platform fit** (10pts) — Adaptado al formato nativo
  - **Brand alignment** (10pts) — Coherente con la voz de marca
- [ ] **Sugerencias de mejora** — Tips especificos para subir el score de cada variacion
- [ ] **Comparativa A/B** — Predecir cual variacion performara mejor y por que
- [ ] **Readability score** — Nivel de lectura (simplificar si es muy complejo)
- [ ] **Headline analyzer** — Score especifico para headlines (EMV, word balance, length)

#### 3.4 Hooks Library
- [ ] **Biblioteca de 200+ hooks probados** organizados por categoria:
  - **Pregunta**: "Sabias que...?", "Y si pudieras...?", "Que harias si...?"
  - **Estadistica**: "El 87% de...", "3 de cada 5...", "Segun [fuente]..."
  - **Contrarian**: "Deja de hacer X", "Todo lo que sabes de X es falso", "X esta muerto"
  - **Storytelling**: "Hace 2 anos estaba...", "Nunca pense que...", "El dia que..."
  - **Curiosidad**: "El metodo que usan los expertos en...", "Lo que nadie te dice sobre..."
  - **Dolor**: "Cansado de...?", "Harto de...?", "Si X, esto es para ti"
  - **Resultado**: "Como consegui X en Y dias", "De 0 a X en Y meses"
  - **Autoridad**: "Despues de X anos en...", "Como [marca] logro..."
  - **FOMO**: "Mientras tu..., otros ya...", "No quieres ser el ultimo en..."
  - **Pattern interrupt**: "PARA. Lee esto.", "Esto no es lo que piensas"
- [ ] **Hooks por plataforma** — Hooks optimizados para cada red social
- [ ] **Hooks por industria** — E-commerce, SaaS, educacion, servicios, salud
- [ ] **Insercion rapida** — Click para insertar un hook en la generacion
- [ ] **Hooks trending** — Actualizar con tendencias actuales de cada plataforma

#### 3.5 Social Proof Generator
- [ ] **Crear copy basado en prueba social**:
  - **Testimonial ads** — Templates para recoger y formatear testimonios
  - **Numeros** — "10,000+ clientes", "98% satisfaccion", "$2M generados"
  - **Logos de clientes** — "Usado por [marca1], [marca2], [marca3]"
  - **Premios y prensa** — "Mencionado en [medio]", "Ganador de [premio]"
  - **Case studies** — Mini historias de exito en formato de ad
  - **User reviews** — Convertir reviews de 5 estrellas en copy publicitario
- [ ] **Social proof score** — Evaluar cuanta prueba social tiene cada variacion

#### 3.6 Calendario de Campanas y Estacionalidad
- [ ] **Calendario de marketing** con fechas clave:
  - **Q1**: Ano nuevo, San Valentin, Dia de la Mujer
  - **Q2**: Dia de la Madre, Hot Sale (LATAM), Dia del Padre
  - **Q3**: Back to School, Independencias LATAM, Dia del Nino
  - **Q4**: Halloween, Buen Fin (MX), Black Friday, Cyber Monday, Navidad
  - **Fechas LATAM especificas** por pais (Mexico, Colombia, Argentina, Chile, Peru)
- [ ] **Templates estacionales** — Copy pre-optimizado para cada fecha
- [ ] **Countdown copy** — Generar urgencia con "Quedan X dias", "Ultimas X horas"
- [ ] **Planificador visual** — Timeline de campanas en vista de calendario
- [ ] **Seasonal briefs** — Brief completo para cada temporada con angulos sugeridos

#### 3.7 Hashtag & Keywords
- [ ] **Hashtag Generator** — Por plataforma:
  - Mix de alto volumen + nicho + branded
  - Trending hashtags relevantes al producto
  - Clusters tematicos (30 para IG, 3-5 para TikTok, etc.)
- [ ] **Keyword Suggestions** — Para Google/YouTube Ads:
  - Keywords principales y long-tail
  - Negative keywords sugeridos
  - Match types recomendados (exact, phrase, broad)
  - Agrupacion por ad group

---

### Fase 4 - Multimodal y Creativos (Semana 10-13)

**Objetivo**: Ir mas alla del texto — cubrir creativos visuales, video y audio.

#### 4.1 Generacion de Imagenes para Ads
- [ ] **AI Image Generation** — Crear imagenes publicitarias:
  - Composicion para feed (1:1), stories (9:16), banner (16:9), pin (2:3)
  - Aplicar paleta de marca automaticamente
  - Text overlays con el copy generado
  - Estilos: lifestyle, producto, testimonial, estadistica, comparativa, flat lay
- [ ] **Product Photography Enhancement** — Subir foto de producto y generar:
  - Studio shot (fondo limpio profesional)
  - Floating / levitation
  - In-use / lifestyle context
  - Ingredient / exploded view
  - Seasonal background (navidad, verano, etc.)
- [ ] **Mockups automaticos** — Visualizar el anuncio final en contexto de plataforma
- [ ] **Safe zone overlay** — Verificar que texto no se corte en cada plataforma
- [ ] **Format adapter** — Generar todas las dimensiones de una imagen a la vez

#### 4.2 Video Ad Scripts Completos
- [ ] **Guiones profesionales** para video ads:
  - Estructura: hook → problema → solucion → prueba → CTA
  - Duraciones: 6s (bumper), 15s, 30s, 60s, 90s+
  - Notas de produccion (B-roll sugerido, transiciones, music mood)
  - Texto en pantalla (captions, lower thirds, supers)
  - Guion de voz en off vs texto visual
- [ ] **TikTok/Reels scripts** — Formato nativo:
  - POV scripts, trending audio cues
  - Transiciones sugeridas
  - CTA nativos de la plataforma
  - Variantes: duet, stitch, green screen
- [ ] **YouTube scripts** — Pre-roll, mid-roll, Shorts:
  - 5-second hook antes del skip
  - Companion banner copy
  - End screen CTA
  - Cards copy (links interactivos)
- [ ] **Storyboard generator** — Descripcion visual escena por escena con timing

#### 4.3 Emotional Mapping
- [ ] **Mapear emociones objetivo** por funnel stage:
  - **TOFU**: curiosidad, sorpresa, intrigue, identificacion
  - **MOFU**: confianza, aspiracion, alivio, esperanza
  - **BOFU**: urgencia, seguridad, FOMO, satisfaccion anticipada
- [ ] **Emotion selector** en el formulario — Elegir emocion primaria y secundaria
- [ ] **Copy diagnostico** — Evaluar que emocion transmite el copy actual

#### 4.4 Dynamic Copy (Personalizacion a Escala)
- [ ] **Templates con variables** para dynamic ads:
  - `{ciudad}`, `{nombre}`, `{producto_visto}`, `{descuento}`, `{dias_restantes}`
  - Compatible con dynamic ads de Meta y Google
- [ ] **Variaciones por segmento** — Generar versiones del mismo ad para diferentes audiencias
- [ ] **Geo-targeting copy** — Adaptar mensajes por ciudad/pais automaticamente

---

### Fase 5 - Plataforma SaaS + Monetizacion (Semana 14-18)

**Objetivo**: Convertir en producto SaaS completo con modelo de negocio.

#### 5.1 Autenticacion Avanzada y Onboarding
- [ ] **Onboarding wizard** (primera vez):
  1. Tipo de negocio (SaaS, e-commerce, agencia, freelancer, local, info products)
  2. Plataformas principales que usa
  3. Presupuesto mensual de ads
  4. Objetivo principal (leads, ventas, awareness, app installs)
  5. Setup de Brand DNA (URL del sitio)
- [ ] **Roles para agencias** — Admin, Editor, Viewer
- [ ] **Multi-workspace** — Separar proyectos por cliente

#### 5.2 Swipe File / Biblioteca de Anuncios
- [ ] **Guardar los mejores ads** generados:
  - Favoritos con rating
  - Colecciones por campana/cliente
  - Tags (industria, framework, emocion, performance)
  - Notas personales en cada anuncio
- [ ] **Swipe file publico** — Ads de ejemplo por industria (para onboarding)
- [ ] **Import de ads externos** — Pegar copy de ads reales para guardar como referencia

#### 5.3 Dashboard Analitico
- [ ] **Metricas de uso** — Generaciones por dia/semana/mes, distribucion de plataformas
- [ ] **Performance tracker** (si conecta sus ads):
  - Importar metricas de Meta Ads API, Google Ads API
  - Correlacionar copy generado con performance real
  - Aprendizaje: "Este tipo de copy te funciona mejor para [audiencia]"
- [ ] **ROI calculator** — Tiempo ahorrado vs costo de la herramienta
- [ ] **Reportes exportables** — PDF con metricas y recomendaciones para clientes

#### 5.4 Monetizacion
- [ ] **Planes de pricing**:
  - **Free**: 10 generaciones/mes, 1 plataforma, sin historial, sin export
  - **Pro** ($29/mes): Ilimitado, todas las plataformas, historial, export, brand DNA, frameworks, ad score
  - **Agency** ($79/mes): Multi-marca, equipo (5 users), API, white-label reports, priority generation
  - **Enterprise** (custom): SSO, SLA, dedicated support, custom integrations
- [ ] **Stripe integration** - Checkout, webhooks, portal de cliente
- [ ] **MercadoPago** como alternativa para LATAM
- [ ] **Usage tracking** - Contador de generaciones por periodo con alertas
- [ ] **Upgrade nudges** — Mensajes contextuales cuando alcanza limites

#### 5.5 Landing Page y SEO
- [ ] **Landing page publica** — Hero, features, pricing, testimonials, CTA, demo en vivo
- [ ] **Blog/Content** — SEO content para atraer trafico organico:
  - "Mejores hooks para TikTok Ads 2026"
  - "Como escribir copy para Meta Ads que convierte"
  - "Guia de Google Ads para e-commerce LATAM"
- [ ] **SEO tecnico** — Meta tags, OG images, sitemap, schema markup
- [ ] **AEO (Answer Engine Optimization)** — Optimizar para IA que responde preguntas
- [ ] **Product Hunt launch** — Preparar assets y estrategia

#### 5.6 Colaboracion
- [ ] **Compartir generaciones** — Link publico para revision de clientes
- [ ] **Workflow de aprobacion** — Pendiente → En revision → Aprobado → Publicado
- [ ] **Comentarios** — Feedback por variacion
- [ ] **Historial de cambios** — Quien edito que y cuando
- [ ] **Email transaccional** — Welcome, usage alerts, approval notifications

---

### Fase 6 - Automatizacion, Compliance y Escala (Semana 19-24)

**Objetivo**: Automatizar flujos completos, garantizar compliance y escalar.

#### 6.1 Campaign Builder End-to-End
- [ ] **Wizard de campana completo**:
  1. Seleccionar objetivo de negocio
  2. Definir audiencia (o generar personas con IA)
  3. Elegir plataformas (una o multiples)
  4. Seleccionar formatos (feed, stories, carousel, video, etc.)
  5. Generar copy + creativos para todos los formatos
  6. Revisar, editar y aprobar
  7. Exportar/publicar
- [ ] **Multi-plataforma simultaneo** — Generar para todas las plataformas a la vez
  - Adaptar automaticamente el copy a cada formato/limite
  - Mantener coherencia de mensaje entre plataformas
- [ ] **Funnel completo** — Generar copy para todo el embudo:
  - **TOFU**: awareness ads + blog post titles + social posts
  - **MOFU**: consideration ads + lead magnets copy + email nurture
  - **BOFU**: conversion ads + retargeting + urgencia + landing page
  - **Post-purchase**: upsell + review request + referral program copy

#### 6.2 UTM Builder & Tracking
- [ ] **Generador de UTMs** automatico por campana:
  - utm_source, utm_medium, utm_campaign, utm_content, utm_term
  - Nomenclatura consistente y configurable
  - Link shortener integrado
- [ ] **Conversion tracking guide** — Instrucciones paso a paso de setup por plataforma
  - Meta Pixel + CAPI
  - Google Tag Manager + GA4
  - TikTok Pixel
  - LinkedIn Insight Tag
- [ ] **QR codes** para campanas offline → online

#### 6.3 A/B Testing Planner
- [ ] **Disenar tests sistematicos**:
  - Variable a testear (headline, CTA, hook, imagen, audiencia, framework)
  - Hipotesis clara ("El framework PAS generara +15% CTR vs AIDA")
  - Tamano de muestra recomendado
  - Criterios de exito (significancia estadistica)
  - Duracion sugerida del test
- [ ] **Test matrix** — Combinaciones de headline x description x CTA
- [ ] **Winner analysis** — Analizar por que gano la variacion ganadora con IA
- [ ] **Iteracion automatica** — Generar variaciones mejoradas del ganador

#### 6.4 Compliance & Quality Assurance
- [ ] **Policy checker** automatico por plataforma:
  - **Meta**: texto en imagen <20%, claims verificables, no before/after prohibido
  - **Google**: trademark policies, editorial standards, restricted categories
  - **TikTok**: no claims medicos sin sustento, no contenido enganoso, community guidelines
  - **YouTube**: advertiser-friendly guidelines, age restrictions
  - **LinkedIn**: professional standards, no clickbait
- [ ] **Legal disclaimer generator** automatico por industria:
  - Finanzas: "Rendimientos pasados no garantizan resultados futuros"
  - Salud: "Consulte a su medico antes de..."
  - Ecommerce: "Precios sujetos a disponibilidad"
  - Suplementos: "Este producto no pretende diagnosticar..."
  - Inmobiliaria: "Imagenes referenciales"
- [ ] **Inclusive language checker** — Detectar sesgos o lenguaje excluyente
- [ ] **Fact check alerts** — Alertar si el copy hace claims no verificables
- [ ] **Regulaciones por pais** — GDPR (EU), LFPDPPP (Mexico), LGPD (Brasil)

#### 6.5 Presupuesto & Media Planning
- [ ] **Budget allocator** — Distribuir presupuesto entre plataformas:
  - Regla 70/20/10 (probado / experimental / innovacion)
  - Distribucion basada en benchmarks de la industria
  - Ajuste por estacionalidad (Q4 > Q1 tipicamente)
- [ ] **Bid strategy advisor** — Recomendar estrategia de puja:
  - Cuando usar: CPA target, ROAS target, maximize conversions, maximize clicks
  - Learning phase considerations
  - Budget minimo por plataforma para resultados significativos
- [ ] **Forecast de resultados** — Proyeccion basada en presupuesto:
  - Estimacion de impresiones, clicks, conversiones
  - Rango: optimista / esperado / conservador
  - CPM, CPC, CPA estimados por plataforma
- [ ] **Scaling playbook** — Cuando y como escalar campanas ganadoras:
  - Regla del 20% incremento gradual
  - Duplicar vs aumentar presupuesto
  - Senales de fatiga creativa (CTR cayendo, frequency alta)
  - 3x Kill Rule: si CPA > 3x target despues de spend minimo, matar campana

#### 6.6 Localizacion Inteligente
- [ ] **No solo traducir, ADAPTAR** por pais:
  - Espanol neutro vs Mexico vs Argentina vs Colombia vs Espana
  - Modismos locales ("oferton" MX, "re copado" AR, "chevere" CO)
  - Moneda y formato de precios local ($MXN, COP, ARS, USD)
  - Referencias culturales relevantes
  - Humor y tono adaptado a cada mercado
- [ ] **Multi-idioma** — Generar simultaneamente en ES, EN, PT
- [ ] **Deteccion de mercado** — Auto-detectar pais del usuario y adaptar defaults

---

### Fase 7 - AI Avanzada y Diferenciadores (Semana 25-30)

**Objetivo**: Funcionalidades de IA que ningun competidor tiene.

#### 7.1 Aprendizaje Continuo
- [ ] **Style learning** — Aprender del estilo del usuario:
  - Analizar anuncios anteriores que funcionaron
  - Replicar tono, estructura, vocabulario
  - "Generar como [mi marca]" — one-click
- [ ] **Performance learning** — Aprender de metricas reales:
  - Que hooks generan mas CTR para esta marca
  - Que CTAs generan mas conversiones en esta industria
  - Patrones por industria y audiencia
- [ ] **Feedback loop** — El usuario marca que funciono y que no → mejora futuras generaciones

#### 7.2 Copy Analyzer (Reverse Engineering)
- [ ] **Pegar un anuncio existente** y obtener:
  - Score de efectividad (0-100)
  - Framework utilizado (AIDA, PAS, etc.)
  - Emociones detectadas
  - Puntos fuertes y debiles
  - 3 versiones mejoradas
- [ ] **Competitor library analysis** — Analizar multiples ads de una marca
  - Patrones de messaging
  - Frecuencia de cambio creativo
  - Angulos mas usados
- [ ] **Industry trends** — Que esta funcionando ahora en cada vertical

#### 7.3 AI Agent para Optimizacion
- [ ] **Auto-optimizer** — Analizar campana completa y sugerir:
  - Que ads pausar (underperformers)
  - Que ads escalar (winners)
  - Nuevas variaciones basadas en los ganadores
  - Cambios de audiencia sugeridos
  - Ajustes de presupuesto
- [ ] **Creative fatigue detector** — Alertar cuando un ad esta perdiendo efectividad
- [ ] **Recomendaciones proactivas** — "Tu CTR bajo 20% esta semana. Sugiero estas 3 nuevas variaciones"

#### 7.4 Integraciones y API
- [ ] **API publica REST**:
  - `POST /api/v1/generate` — Generar copy
  - `POST /api/v1/score` — Evaluar copy
  - `POST /api/v1/improve` — Mejorar copy existente
  - `GET /api/v1/templates` — Obtener templates
  - `POST /api/v1/analyze` — Analizar ad existente
- [ ] **Webhooks** — Notificar cuando se genera/aprueba contenido
- [ ] **Integracion Meta Business Manager** — Publicar ads directamente
- [ ] **Integracion Google Ads Editor** — Export formato compatible
- [ ] **Zapier/Make** — Webhooks para automatizacion
- [ ] **Slack** — Notificaciones de generaciones y aprobaciones
- [ ] **Canva** — Enviar copy + brief de diseno al workspace
- [ ] **Google Sheets** — Sync bidireccional
- [ ] **Extension de Chrome** — Generar ads directamente en plataformas de ad managers
- [ ] **WordPress plugin** — Generar copy desde WP admin
- [ ] **White-label** — Version que agencias pueden personalizar con su marca

---

## Arquitectura / Decisiones Tecnicas

### Stack Actual (Confirmado)
| Capa | Tecnologia | Razon |
|------|-----------|-------|
| Frontend | Next.js 16 + React 19 | App Router, RSC, Server Actions |
| Styling | Tailwind v4 | Utilidad, velocidad, dark mode nativo |
| Language | TypeScript | Type safety end-to-end |
| AI | Claude Sonnet 4.6 (Anthropic SDK) | Mejor calidad de copy en español |

### Stack a Agregar
| Capa | Tecnologia | Razon |
|------|-----------|-------|
| Base de datos | Supabase (Postgres) | Auth incluido, realtime, buen free tier |
| Auth | NextAuth v5 + Supabase | Flexible, Google + magic link |
| Validacion | Zod | Runtime validation + TypeScript inference |
| Pagos | Stripe | Standard de la industria, webhooks robustos |
| UI Components | Componentes propios con Tailwind | Control total, sin dependencia pesada |
| Streaming | Anthropic SDK streaming | Mejor UX, respuesta percibida rapida |
| Analytics | PostHog | Open source, event tracking, funnels |
| Monitoring | Sentry | Error tracking en produccion |
| Deploy | Vercel | Optimizado para Next.js, edge functions |
| Email | Resend | API simple, React templates |

### Decisiones de Arquitectura

1. **Prompts por plataforma separados**: Cada plataforma tiene specs, limites y best practices muy diferentes. Mantenerlos separados permite iterar independientemente y agregar plataformas sin afectar las existentes.

2. **Streaming de respuestas**: El modelo actual espera la respuesta completa de Claude (~5-15 seg). Con streaming, el usuario ve texto aparecer en tiempo real, mejorando dramaticamente la percepcion de velocidad.

3. **Supabase sobre Prisma + DB custom**: Supabase da Auth + DB + Realtime + Storage out of the box. Para un SaaS como este, reduce tiempo de setup significativamente.

4. **Sin component library externa**: Tailwind v4 + componentes propios da mas control sobre el look & feel sin el peso de shadcn/Radix. El proyecto es UI-intensivo y necesita diferenciarse visualmente.

5. **Zod para validacion**: Permite definir schemas que funcionan tanto en cliente como servidor, con inferencia automatica de tipos TypeScript.

---

## Modelo de Datos Detallado

### Tabla: `generations`
```
id              UUID        PK
user_id         UUID        FK -> auth.users (nullable para no autenticados)
project_id      UUID        FK -> projects (nullable)
brand_id        UUID        FK -> brands (nullable)
persona_id      UUID        FK -> personas (nullable)
platform        TEXT        'meta' | 'tiktok' | 'google' | 'youtube' | 'linkedin' | 'microsoft' | 'pinterest' | 'x' | 'snapchat'
format          TEXT        'feed' | 'stories' | 'carousel' | 'ugc_script' | 'email_sequence' | 'landing_page' | 'retargeting' | 'video_script'
objective       TEXT        'awareness' | 'consideration' | 'conversion'
tone            TEXT        'profesional' | 'casual' | 'urgente' | 'emocional' | 'divertido'
framework       TEXT        'auto' | 'aida' | 'pas' | 'bab' | 'fab' | '4ps' | 'quest' | 'slap' | 'hook_story_offer' | '123'
product         TEXT        Descripcion del producto
audience        TEXT        Audiencia objetivo
extras          TEXT        Notas adicionales (nullable)
language        TEXT        'es' | 'es-mx' | 'es-ar' | 'es-co' | 'en' | 'pt-br'
variations_count INT       Numero de variaciones solicitadas
result          JSONB       Respuesta completa de Claude
ad_scores       JSONB       Scores por variacion [{score, breakdown}]
tokens_used     INT         Tokens consumidos
is_favorite     BOOLEAN     Default false
tags            TEXT[]      Tags personalizados
rating          INT         1-5 estrellas (nullable)
created_at      TIMESTAMPTZ Default now()
```

### Tabla: `brands`
```
id              UUID        PK
user_id         UUID        FK -> auth.users
name            TEXT
url             TEXT        URL del sitio web
description     TEXT
profile         JSONB       Brand DNA completo:
                            {colors, typography, tone_keywords, value_proposition,
                             do_say, dont_say, imagery_style, target_audience}
logo_url        TEXT
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

### Tabla: `personas`
```
id              UUID        PK
brand_id        UUID        FK -> brands
name            TEXT        "Maria la emprendedora"
avatar_url      TEXT        (nullable)
demographics    JSONB       {age_range, gender, location, income, education, occupation}
psychographics  JSONB       {interests, values, fears, desires, frustrations}
behavior        JSONB       {platforms, usage_hours, devices, content_types}
pain_points     TEXT[]
objections      TEXT[]      Por que NO comprarian
trigger_words   TEXT[]      Lenguaje que resuena
influences      TEXT[]      Marcas/creadores que admiran
created_at      TIMESTAMPTZ
```

### Tabla: `projects`
```
id              UUID        PK
brand_id        UUID        FK -> brands
name            TEXT
status          TEXT        'draft' | 'active' | 'archived'
brief           TEXT
platforms       TEXT[]
budget          DECIMAL
start_date      DATE
end_date        DATE
funnel_stage    TEXT        'tofu' | 'mofu' | 'bofu' | 'full'
utm_params      JSONB       {source, medium, campaign, content, term}
created_at      TIMESTAMPTZ
```

### Tabla: `templates`
```
id              UUID        PK
user_id         UUID        FK -> auth.users
name            TEXT
platform        TEXT
format          TEXT
objective       TEXT
tone            TEXT
framework       TEXT
product_template TEXT
audience_template TEXT
extras          TEXT
is_public       BOOLEAN     Default false
use_count       INT         Default 0
created_at      TIMESTAMPTZ
```

### Tabla: `swipe_file`
```
id              UUID        PK
user_id         UUID        FK -> auth.users
generation_id   UUID        FK -> generations (nullable)
title           TEXT
platform        TEXT
copy_content    JSONB       {headline, primaryText, description, cta, hook}
source          TEXT        'generated' | 'imported' | 'competitor'
source_url      TEXT        (nullable)
notes           TEXT
tags            TEXT[]
collection      TEXT
rating          INT         1-5
created_at      TIMESTAMPTZ
```

### Tabla: `campaigns`
```
id              UUID        PK
project_id      UUID        FK -> projects
name            TEXT
status          TEXT        'draft' | 'pending_review' | 'approved' | 'live' | 'paused' | 'completed'
platforms       TEXT[]
formats         TEXT[]
funnel_stages   TEXT[]
budget          DECIMAL
bid_strategy    TEXT
target_cpa      DECIMAL
target_roas     DECIMAL
ab_test_config  JSONB       {variable, hypothesis, sample_size, duration}
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

### Tabla: `usage_tracking`
```
id              UUID        PK
user_id         UUID        FK -> auth.users
period_start    DATE
period_end      DATE
generations_used INT        Default 0
exports_used    INT         Default 0
images_generated INT        Default 0
plan            TEXT        'free' | 'pro' | 'agency' | 'enterprise'
```

### Tabla: `ad_performance` (Fase 7 - conectado a APIs)
```
id              UUID        PK
generation_id   UUID        FK -> generations
platform        TEXT
impressions     INT
clicks          INT
conversions     INT
spend           DECIMAL
ctr             DECIMAL
cpc             DECIMAL
cpa             DECIMAL
roas            DECIMAL
date            DATE
synced_at       TIMESTAMPTZ
```

---

## Prompts: Estrategia de Mejora

### Problemas del prompt actual
1. Prompt unico para todas las plataformas - pierde especificidad
2. No considera el funnel stage al escribir (TOFU copy != BOFU copy)
3. No incluye formulas de copywriting probadas (PAS, AIDA, BAB, 4Ps)
4. No adapta el lenguaje por audiencia (B2B != B2C, LATAM != España)
5. JSON parsing fragil (regex)

### Estrategia mejorada
1. **System prompt base**: Rol de experto + reglas generales de copywriting
2. **Prompt por plataforma**: Specs tecnicas + mejores practicas + ejemplos
3. **Modificadores por objetivo**: TOFU enfoca en problema/curiosidad, MOFU en beneficios/prueba social, BOFU en urgencia/oferta
4. **Modificadores por tono**: Ajusta vocabulario, estructura, longitud
5. **Brand context**: Si hay brand profile, inyectar voz de marca
6. **Structured output**: Usar tool_use de Claude para JSON garantizado (sin regex)

### Formulas de copywriting a integrar
- **PAS**: Problem → Agitate → Solution (mejor para dolor/problema claro)
- **AIDA**: Attention → Interest → Desire → Action (clasica, universal)
- **BAB**: Before → After → Bridge (ideal para transformacion)
- **FAB**: Features → Advantages → Benefits (productos tecnicos)
- **4Ps**: Promise → Picture → Proof → Push (conversion directa)
- **QUEST**: Qualify → Understand → Educate → Stimulate → Transition (B2B, educacion)
- **SLAP**: Stop → Look → Act → Purchase (e-commerce, impulso)
- **Hook-Story-Offer**: Para TikTok/YouTube especialmente (video/UGC)
- **1-2-3**: Un dolor, dos consecuencias, tres beneficios (formato rapido)

### Modificadores por funnel stage
- **TOFU**: Enfoca en problema/curiosidad, pregunta abierta, estadistica impactante
- **MOFU**: Beneficios concretos, prueba social, comparativa, educacion
- **BOFU**: Urgencia, oferta, garantia, CTA directo, escasez

### Modificadores por emocion objetivo
- **Curiosidad**: "Sabias que...", datos sorprendentes, pattern interrupt
- **FOMO**: Limitado, exclusivo, countdown, "otros ya..."
- **Confianza**: Testimonios, numeros, autoridad, garantia
- **Urgencia**: Countdown, "ultimas horas", "se acaba", stock limitado
- **Aspiracion**: Resultado deseado, transformacion, "imagina si..."

---

## Notas y Decisiones

| Fecha | Decision | Razon |
|-------|----------|-------|
| 2026-03-17 | Next.js 16 + React 19 como base | Ya configurado, ultima version estable |
| 2026-03-17 | Claude Sonnet 4.6 para generacion | Balance calidad/costo/velocidad para copy en español |
| 2026-03-17 | Supabase para persistencia | Auth + DB + Storage integrado, buen free tier |
| 2026-03-17 | Componentes propios vs shadcn | Mayor control visual, el proyecto necesita UI diferenciada |
| 2026-03-17 | Streaming sobre respuesta completa | UX critica - 5-15s de espera es inaceptable |
| 2026-03-17 | Tool use de Claude para JSON | Elimina parsing fragil con regex |
| 2026-03-17 | Prompts separados por plataforma | Permite iterar y especializar independientemente |
| 2026-03-17 | 9 frameworks de copywriting incluidos | Diferenciador clave vs competidores que solo generan copy generico |
| 2026-03-17 | 9 plataformas target (Meta, TikTok, Google, YouTube, LinkedIn, Microsoft, Pinterest, X, Snapchat) | Cobertura completa del ecosistema publicitario |
| 2026-03-17 | 8 formatos de anuncio (feed, stories, carousel, UGC, email, landing, retargeting, video) | Un experto necesita todos los formatos, no solo feed |
| 2026-03-17 | Ad Score predictivo (0-100) con 10 criterios | Gamificacion + valor tangible + diferenciador |
| 2026-03-17 | Hooks Library con 200+ hooks categorizados | Los hooks son la parte mas dificil de escribir para los marketers |
| 2026-03-17 | Plan expandido a 7 fases (30 semanas) | Vision completa de producto SaaS para marketing |

---

## Metricas de Exito

### Producto
| Metrica | Fase 1-2 | Fase 3-4 | Fase 5-7 |
|---------|----------|----------|----------|
| Tiempo generacion percibido | <5s | <3s (streaming) | <2s |
| Variaciones usables sin edicion | >50% | >70% | >85% |
| Tasa copia al clipboard | >30% | >50% | >60% |
| Plataformas soportadas | 4 | 9 | 9+ Apple Search Ads |
| Frameworks disponibles | 3 | 9 | 9 + custom |
| Formatos de anuncio | 1 (feed) | 8 | 8 + dynamic |
| Ad Score accuracy | — | Basico | Calibrado con datos reales |

### Negocio
| Metrica | Mes 1 | Mes 3 | Mes 6 |
|---------|-------|-------|-------|
| Usuarios registrados | 500 | 2,000 | 10,000 |
| Conversion free → pro | 3% | 5% | 7% |
| Retention D7 | 25% | 35% | 45% |
| Retention D30 | 10% | 20% | 30% |
| MRR | $0 | $2,000 | $15,000 |
| CAC | — | <$15 | <$10 |
| NPS | 30 | 45 | 60 |

### Tecnico
- Lighthouse score > 90
- API response time p95 < 20s (streaming: first byte < 1s)
- Error rate < 1%
- Zero downtime deploys
- 99.9% uptime

---

## Modelo de Negocio

| Plan | Precio | Generaciones | Plataformas | Features |
|------|--------|-------------|-------------|----------|
| Free | $0 | 10/mes | 2 | Feed only, sin historial, sin export |
| Pro | $29/mes | Ilimitadas | Todas | Todos los formatos, frameworks, ad score, brand DNA, export, historial |
| Agency | $79/mes | Ilimitadas | Todas | Multi-marca (10), equipo (5 users), API, white-label reports, priority |
| Enterprise | Custom | Ilimitadas | Todas | SSO, SLA, dedicated support, custom integrations, 50+ marcas |

### Revenue Projections (Conservador)
- Mes 3: 2,000 users × 5% conversion × $29 avg = ~$2,900 MRR
- Mes 6: 10,000 users × 6% conversion × $35 avg (mix pro+agency) = ~$21,000 MRR
- Mes 12: 30,000 users × 7% conversion × $38 avg = ~$79,800 MRR

---

## Riesgos y Mitigaciones

| Riesgo | Impacto | Probabilidad | Mitigacion |
|--------|---------|-------------|------------|
| Costos de API Claude altos | Alto | Media | Caching de respuestas similares, limites por plan, monitoreo de tokens, negociar volume pricing |
| Copy de baja calidad | Alto | Baja | Prompts especializados por plataforma/framework, feedback loop, human-in-the-loop |
| Rate limits de Anthropic | Medio | Media | Queue de generacion, retry con backoff exponencial, plan API enterprise |
| Competencia (Jasper, Copy.ai) | Medio | Alta | Enfoque LATAM (poca competencia), ad score, frameworks, 9 plataformas |
| Abandono por UX lenta | Alto | Media | Streaming obligatorio, optimistic UI, edge deployment, skeleton states |
| Cambios en politicas de plataformas | Medio | Media | Policy checker automatizado, monitoreo de cambios, actualizacion rapida de specs |
| Churn alto en plan free | Medio | Alta | Onboarding wizard, email nurture, upgrade triggers contextuales, valor inmediato |
| Problemas de escalabilidad | Alto | Baja | Vercel auto-scaling, Supabase managed, queuing para heavy loads |

---

## Mejores Practicas de Agencias de Marketing (Investigacion 2026)

Investigacion realizada para informar el desarrollo del producto y alinearlo con las necesidades reales de las agencias.

### 1. Integracion Estrategica de IA
- Las agencias con IA + supervision humana ven **+30% ROI en ROAS** vs optimizacion manual
- Aplicaciones clave: generacion de variaciones de copy a escala, refinamiento de audiencias con first-party data, gestion predictiva de pujas, deteccion de anomalias en tiempo real
- Evolucion de workflows programados a **sistemas auto-optimizados** que ajustan campañas en tiempo real
- **Implicacion para Claude Ads**: Nuestro producto debe facilitar la generacion a escala con revision humana incorporada en el flujo

### 2. Operaciones y Escalabilidad
- **SOPs documentados** son criticos para escalar sin perder calidad (onboarding, lanzamiento de campañas)
- ~75% de agencias dependen de spreadsheets — oportunidad de ofrecer herramientas mas integradas
- 61% de lideres senior gasta 1/3 de su dia en rotacion de empleados — las herramientas que ahorran tiempo son altamente valoradas
- **Implicacion para Claude Ads**: Templates reutilizables y Brand Profiles reducen dependencia de conocimiento individual

### 3. Estrategia de Clientes
- Escalar = clientes correctos, no mas clientes. Relaciones a largo plazo > volumen
- Agencias que venden **sistemas de crecimiento** (datos + automatizacion + estrategia) retienen clientes mas tiempo
- Modelo colaborativo logra hasta **84% de retencion de clientes**
- Experiencia omnicanal: usuarios no ven canales, viven experiencias integradas
- **Implicacion para Claude Ads**: Multi-plataforma con vision unificada es un diferenciador clave. El plan Agency debe facilitar gestion multi-marca

### 4. Contenido y SEO
- Profundidad sobre volumen: 3-5 temas donde la marca aporta valor real
- **AEO (Answer Engine Optimization)**: Optimizar para IA que responde preguntas, no solo rankings
- Mobile-first obligatorio: Google usa indexacion mobile-first para todos los rankings
- **Implicacion para Claude Ads**: El copy generado debe considerar AEO ademas de CTR. Nuestra landing page debe ser mobile-first

### 5. Analitica Predictiva y Personalizacion
- Analitica predictiva se convierte en standard: anticipar tendencias, identificar oportunidades, adaptar en tiempo real
- IA recomienda triggers, delays y angulos de mensajeria tras detectar patrones en ciclos de retencion
- Personalizacion a escala manteniendo trato personal con cada cliente
- **Implicacion para Claude Ads**: Score de calidad predictivo (Fase 3) es una feature altamente demandada. Considerar recomendaciones de cuando publicar

### Fuentes
- [Adopcion de IA para agencias - ALM Corp](https://almcorp.com/blog/ai-adoption-digital-agencies-best-practices/)
- [Marketing Digital 2026 Guia Practica](https://www.eclipseexperience.net/en/guia-marketing-digital-2026/)
- [SEO Trends 2026 para Agencias](https://almcorp.com/blog/top-seo-trends-2026-guide-for-digital-agencies-and-clients/)
- [Scaling Success for Marketing Agencies - Kantata](https://www.kantata.com/blog/article/the-keys-to-scaling-success-for-marketing-agencies)
- [Marketing Operations 2026 - Monday.com](https://monday.com/blog/marketing/marketing-operations/)
- [Digital Marketing Agency Playbook 2026](https://almcorp.com/blog/digital-marketing-agency-playbook-2026/)
- [Marketing Automation Trends 2026 - Klaviyo](https://www.klaviyo.com/blog/marketing-automation-trends)
- [AI Marketing Trends 2026 - Adweek](https://www.adweek.com/brand-marketing/10-ai-marketing-trends-for-2026-agentic-ai-and-search-shifts/)
- [AI Changing Agencies 2026 - Seven Figure Agency](https://sevenfigureagency.com/ai-changing-agencies-2026/)

---

## Prioridades de Implementacion Inmediata (Proximo Sprint)

Lo que debemos construir AHORA para maximo impacto:

1. **Frameworks de copywriting** (AIDA, PAS, BAB) — diferenciador #1, bajo esfuerzo
2. **Contador de caracteres en tiempo real** — calidad de vida basica
3. **Streaming de respuestas** — UX critica, reduce percepcion de espera
4. **Componentizar page.tsx** — deuda tecnica que bloquea todo lo demas
5. **Preview visual por plataforma** — wow factor, valor percibido alto
6. **Carousel + UGC Scripts** — formatos mas demandados por marketers
7. **Ad Score basico** — gamificacion + diferenciador
8. **Exportar CSV** — utilidad practica inmediata para usuarios reales

---

## Pendientes / Preguntas Abiertas

### Decisiones Tecnicas
- Definir si el MVP se lanza solo con generacion (sin auth) para validar demanda rapido
- Evaluar si usar shadcn/ui o componentes 100% custom para la UI
- Evaluar si agregar streaming SSE o usar polling
- Investigar tool_use de Claude como alternativa a JSON regex parsing
- Definir estrategia de rate limiting: por IP (free) vs por user (auth)
- Evaluar si incorporar Stripe o MercadoPago (o ambos) para LATAM

### Decisiones de Producto
- Evaluar si agregar LinkedIn Ads en Fase 1 (alta demanda B2B en LATAM)
- Decidir dominio: claudeads.com, aicopy.la, adsgen.ai, etc.
- Definir si el blog/content marketing es parte del MVP o post-launch
- Evaluar integracion con Canva via MCP para creativos visuales
- Investigar APIs de Meta Ad Library y Google Ads para analisis competitivo
- Definir si los hooks library son curados manualmente o generados con IA
- Priorizar: mas plataformas (LinkedIn, Pinterest) vs mas formatos (carousel, UGC)
- Evaluar Product Hunt como canal de launch
