# Plan Maestro V2 - Claude Ads: De Generador a Plataforma Completa de Ads

## Estado Actual (Auditoria)

### Lo que FUNCIONA end-to-end:
- Generacion de copy con IA (Gemini/Claude) con streaming
- Analisis de competencia (/analyze)
- A/B Testing de variaciones (/ab-test)
- Score de calidad por variacion
- Refinamiento inline de variaciones
- Exportar CSV/JSON/clipboard
- Multi-idioma (ES/EN/PT/FR)
- Image prompts
- 8 plataformas de copy (Meta, Google, TikTok, YouTube, LinkedIn, Pinterest, X, Microsoft)
- Login con Supabase (Google OAuth + Magic Link)
- Dashboard basico con uso del plan
- Historial de generaciones
- Templates
- Brand profiles
- API keys
- Billing con Stripe

### Lo que esta ROTO o INCOMPLETO:
- OAuth callback para plataformas (archivo existe pero no se linkea bien)
- Metrics endpoint para campanas (existe el archivo pero no se conecta)
- Ads creation endpoint (existe el archivo pero no se conecta)
- Analytics page solo muestra datos locales, no metricas reales
- Campaign detail no jala metricas de plataformas
- Team page es solo scaffolding
- No hay agente conversacional para preguntas sobre ads
- No hay reportes diarios/semanales
- No hay dashboard de metricas de pauta real
- No hay notificaciones/alertas
- El middleware bloquea /app/* (problema si quieres usarlo sin login)

### Lo que FALTA COMPLETAMENTE:
1. **Dashboard de Pauta Real** - Metricas en vivo de campanas activas
2. **Agente IA Conversacional** - Chat para preguntar sobre tus ads
3. **Reportes Automaticos** - Diarios/semanales por email o en-app
4. **Alertas Inteligentes** - "Tu CPC subio 40%", "Campana sin impresiones"
5. **Publicacion directa** - Flow completo de generar → publicar en plataforma
6. **Metricas cross-platform** - Comparar Meta vs Google vs TikTok
7. **Recomendaciones IA** - "Pausa esta campana", "Sube budget aqui"
8. **Creative Library** - Biblioteca de ads con performance historica
9. **Audience Insights** - Datos de audiencia por plataforma
10. **Budget Optimizer** - Redistribucion automatica de presupuesto

---

## Simplificacion: Sin Auth (Uso Personal)

Dado que es para uso personal:
- Eliminar middleware de auth
- Eliminar login page requirement
- /app/* accesible directamente
- Las API routes no requieren user check
- Sidebar como navegacion principal
- Home page redirige a /app/dashboard

---

## MODULO 1: Fix Criticos + Simplificacion (Sin Auth)

### 1.1 Eliminar auth requirement
- Modificar `src/middleware.ts` - quitar redirect a login
- Modificar `src/app/app/layout.tsx` - quitar check de user
- Modificar todas las API routes de datos - quitar auth check, usar user_id fijo
- Redirigir `/` a `/app/dashboard`

### 1.2 Fix OAuth callbacks de plataformas
- Verificar que `/api/platforms/[platform]/callback/route.ts` funciona
- Verificar que tokens se encriptan/desencriptan correctamente
- Testear flow completo con Meta (ya tenemos App ID + Secret)

### 1.3 Fix endpoints faltantes
- Verificar `/api/platforms/[platform]/ads/route.ts`
- Verificar `/api/platforms/[platform]/campaigns/[campaignId]/metrics/route.ts`
- Conectar campaign detail con metricas reales

---

## MODULO 2: Dashboard de Pauta Real

### 2.1 Vista general de metricas
**Pagina:** `/app/dashboard` (reescribir)

Mostrar:
- KPIs principales: Spend total, Impressions, Clicks, CTR, CPC, Conversions, ROAS
- Grafico de spend por dia (ultimos 30 dias)
- Grafico de performance (impressions vs clicks vs conversions)
- Distribucion de spend por plataforma (pie chart)
- Top 5 campanas por ROAS
- Top 5 campanas por spend
- Alertas activas

### 2.2 API de metricas agregadas
**Route:** `/api/metrics/dashboard`
- Jala metricas de todas las plataformas conectadas
- Agrega por fecha
- Cache en Supabase (campaign_metrics)
- Parametros: dateRange, platform filter

### 2.3 Componentes de graficos
- Usar SVG nativo o instalar `recharts` (ligero)
- `LineChart` para tendencias
- `BarChart` para comparaciones
- `PieChart` para distribucion
- `KPICard` con delta vs periodo anterior

---

## MODULO 3: Agente IA Conversacional

### 3.1 Chat interface
**Pagina:** `/app/agent`

Interface de chat tipo ChatGPT donde puedes preguntar:
- "Como van mis campanas de Meta esta semana?"
- "Cual campana tiene peor ROAS?"
- "Que debo cambiar en mi campana de Google?"
- "Genera 3 variaciones de copy para mi mejor campana"
- "Compara mi performance de Meta vs TikTok"
- "Cuanto llevo gastado este mes?"

### 3.2 Arquitectura del agente
**Route:** `/api/agent/chat`

El agente tiene acceso a:
- Metricas de campanas (via platform clients)
- Historial de generaciones
- Brand profiles
- Templates
- Datos de connected accounts

Tools del agente:
1. `get_campaign_metrics` - Jala metricas por campana/plataforma/fecha
2. `list_campaigns` - Lista campanas activas
3. `generate_copy` - Genera nuevas variaciones
4. `analyze_performance` - Analiza por que una campana no performa
5. `get_spend_summary` - Resumen de gasto por periodo
6. `compare_platforms` - Compara performance entre plataformas
7. `get_recommendations` - Genera recomendaciones de optimizacion

### 3.3 Prompt del agente
```
Eres un experto en marketing digital y gestion de pauta publicitaria.
Tienes acceso a las campanas activas del usuario en Meta Ads, Google Ads, TikTok Ads y LinkedIn Ads.

Tu rol:
- Responder preguntas sobre performance de campanas
- Analizar metricas y dar recomendaciones accionables
- Generar copy optimizado basado en datos reales
- Alertar sobre problemas (CPC alto, CTR bajo, sin conversiones)
- Sugerir redistribucion de presupuesto
- Comparar performance entre plataformas

Siempre responde con datos especificos (numeros, %, tendencias).
Si no tienes datos suficientes, di que informacion necesitas.
Habla en espanol de forma directa y profesional.
```

---

## MODULO 4: Reportes Automaticos

### 4.1 Reporte diario
**Route:** `/api/reports/daily`
**Cron:** Ejecutar cada dia a las 8am (via Vercel Cron o similar)

Contenido:
- Spend de ayer vs promedio de los ultimos 7 dias
- Campanas con mayor/menor performance
- Alertas (CPC > promedio, CTR < threshold)
- Top 3 recomendaciones de optimizacion (generadas por IA)

### 4.2 Reporte semanal
**Route:** `/api/reports/weekly`

Contenido:
- Resumen de la semana: spend, impressions, clicks, conversions, ROAS
- Comparativa semana actual vs anterior (deltas %)
- Mejor y peor campana de la semana
- Distribucion de budget por plataforma
- Recomendaciones para la proxima semana

### 4.3 Pagina de reportes
**Pagina:** `/app/reports`
- Lista de reportes generados
- Vista de cada reporte en formato legible
- Opcion de exportar como PDF
- Opcion de enviar por email

### 4.4 Almacenamiento
**Tabla:** `reports`
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL, -- 'daily', 'weekly'
  period_start DATE,
  period_end DATE,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## MODULO 5: Metricas Cross-Platform + KPIs

### 5.1 Pagina de Analytics mejorada
**Pagina:** `/app/analytics` (reescribir)

Secciones:
1. **Overview** - KPIs agregados de todas las plataformas
2. **Por plataforma** - Tabs Meta | Google | TikTok | LinkedIn con metricas individuales
3. **Comparativa** - Tabla comparando CTR, CPC, ROAS por plataforma
4. **Tendencias** - Graficos de tendencia por metrica
5. **Budget allocation** - Donde va el dinero y donde da mejor retorno

### 5.2 KPIs trackeados
| Metrica | Calculo | Threshold bueno | Threshold malo |
|---------|---------|-----------------|----------------|
| CTR | clicks/impressions | > 2% | < 0.5% |
| CPC | spend/clicks | < $1.50 | > $5 |
| CPM | (spend/impressions)*1000 | < $15 | > $40 |
| ROAS | revenue/spend | > 3x | < 1x |
| Conv Rate | conversions/clicks | > 3% | < 0.5% |
| Frequency | impressions/reach | < 3 | > 7 |
| CPA | spend/conversions | Depende | Depende |

### 5.3 Alertas automaticas
**Tabla:** `alerts`
```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY,
  campaign_mapping_id UUID REFERENCES campaign_mappings(id),
  type TEXT NOT NULL, -- 'cpc_high', 'ctr_low', 'no_impressions', 'budget_exhausted'
  severity TEXT DEFAULT 'warning', -- 'info', 'warning', 'critical'
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Reglas de alertas:
- CPC > 2x promedio de los ultimos 7 dias → warning
- CTR < 0.3% en ultimas 24h → warning
- 0 impressions en 4h → critical
- Budget > 90% gastado antes de mitad del periodo → warning
- ROAS < 1x en ultimos 3 dias → critical
- Frequency > 5 → warning (fatiga de audiencia)

---

## MODULO 6: Publicacion Directa (Flow Completo)

### 6.1 Flow: Generar → Publicar
1. Usuario genera copy en /app/generate
2. Selecciona variacion ganadora
3. Click "Publicar en [Plataforma]"
4. Modal con:
   - Cuenta conectada (seleccionar)
   - Campana existente o crear nueva
   - Budget y fechas
   - Landing URL
   - Preview del ad
5. Confirmar y publicar
6. Ad se crea en la plataforma en estado PAUSED
7. Se guarda mapping en Supabase

### 6.2 Componente: Ad Publisher
**Componente:** `src/components/ads/ad-publisher.tsx`
- Modal que aparece al hacer click en "Publicar"
- Muestra preview del ad segun plataforma
- Selector de cuenta/campana/budget
- Confirmacion antes de publicar

---

## MODULO 7: Creative Library

### 7.1 Biblioteca de creativos
**Pagina:** `/app/library`

- Grid de todos los ads generados con thumbnail
- Filtrar por plataforma, fecha, performance
- Status: draft, published, paused, active
- Performance badge (si esta publicado y tiene metricas)
- Quick actions: duplicar, refinar, publicar, eliminar

### 7.2 Tabla
```sql
CREATE TABLE creatives (
  id UUID PRIMARY KEY,
  generation_id UUID REFERENCES generations(id),
  variation_index INT,
  platform TEXT,
  headline TEXT,
  primary_text TEXT,
  description TEXT,
  cta TEXT,
  hook TEXT,
  image_prompt TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'draft', -- draft, published, paused
  campaign_mapping_id UUID REFERENCES campaign_mappings(id),
  performance JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## MODULO 8: Estrategia y Recomendaciones IA

### 8.1 Pagina de estrategia
**Pagina:** `/app/strategy`

Funcionalidades:
1. **Audit automatico** - Analiza todas las campanas activas y genera un reporte de salud
2. **Budget optimizer** - Sugiere como redistribuir el presupuesto basado en ROAS
3. **Copy tester** - Sugiere nuevas variaciones basadas en los top performers
4. **Audience insights** - Sugiere segmentaciones basadas en conversion data
5. **Calendario editorial** - Sugiere cuando lanzar/pausar campanas

### 8.2 Prompts de estrategia

**Audit prompt:**
```
Analiza el siguiente portfolio de campanas publicitarias activas:
{campaigns_with_metrics}

Para cada campana indica:
1. Health score (0-100)
2. Principales problemas
3. Accion recomendada (escalar, optimizar, pausar, eliminar)
4. Prioridad (alta, media, baja)

Genera un resumen ejecutivo con las 3 acciones mas importantes.
```

**Budget optimizer prompt:**
```
Dado este presupuesto total y performance por campana:
{budget_and_metrics}

Recomienda redistribucion optima de budget para maximizar ROAS.
Reglas:
- No asignar mas de 40% a una sola campana
- Campanas con ROAS < 1x reducir o pausar
- Campanas con ROAS > 3x considerar escalar
- Mantener minimo $10/dia por campana activa
```

**Copy tester prompt:**
```
Estos son los copies de mis campanas con mejor performance:
{top_performing_copies}

Y estos los de peor performance:
{worst_performing_copies}

Analiza que patrones tienen los ganadores vs perdedores.
Genera 5 nuevas variaciones que combinen los mejores patrones.
```

---

## MODULO 9: Permisos Avanzados de Meta

### Permisos a solicitar (acceso avanzado):

| Permiso | Para que lo usamos | Prioridad |
|---------|-------------------|-----------|
| `ads_read` | Leer metricas, estadisticas, reportes de campanas | CRITICO |
| `ads_management` | Crear/editar/pausar campanas y ads | CRITICO |
| `business_management` | Gestionar cuentas publicitarias del Business Manager | CRITICO |
| `pages_read_engagement` | Leer engagement de posts/ads en paginas | ALTO |
| `pages_manage_ads` | Crear ads asociados a paginas | ALTO |
| `read_insights` | Leer insights de paginas, apps y web | ALTO |
| `leads_retrieval` | Recuperar leads de formularios de ads | ALTO |
| `page_events` | Trackear eventos de conversion (pixel server-side) | ALTO |
| `pages_show_list` | Ver lista de paginas del usuario | MEDIO |
| `instagram_basic` | Leer perfil e info de Instagram | MEDIO |
| `instagram_manage_insights` | Estadisticas de Instagram | MEDIO |
| `catalog_management` | Gestionar catalogo de productos (ecommerce) | MEDIO |
| `attribution_read` | Datos de atribucion (cross-channel) | MEDIO |
| `instagram_content_publish` | Publicar contenido en Instagram | BAJO |
| `pages_manage_posts` | Crear/editar posts organicos | BAJO |

### Acciones para conseguir acceso avanzado:
1. Completar verificacion de negocio en Business Manager
2. Aceptar terminos de la plataforma
3. Completar cuestionario de tratamiento de datos (ya hecho)
4. Enviar app para revision (despues de publicar con privacy policy)

---

## MODULO 10: Infraestructura y Performance

### 10.1 Cron jobs (via Vercel Cron)
```json
// vercel.json
{
  "crons": [
    { "path": "/api/cron/sync-metrics", "schedule": "0 */4 * * *" },
    { "path": "/api/cron/daily-report", "schedule": "0 8 * * *" },
    { "path": "/api/cron/weekly-report", "schedule": "0 8 * * 1" },
    { "path": "/api/cron/check-alerts", "schedule": "0 */2 * * *" }
  ]
}
```

### 10.2 Sync de metricas
**Route:** `/api/cron/sync-metrics`
- Cada 4 horas jala metricas de todas las campanas activas
- Actualiza campaign_metrics en Supabase
- Evalua reglas de alertas
- Genera alertas si aplica

### 10.3 Nuevas tablas SQL necesarias
```sql
-- Reports
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Alerts
CREATE TABLE alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_mapping_id UUID REFERENCES campaign_mappings(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT DEFAULT 'warning',
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_alerts_unread ON alerts(is_read, created_at DESC);

-- Creatives library
CREATE TABLE creatives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,
  variation_index INT,
  platform TEXT,
  headline TEXT,
  primary_text TEXT,
  description TEXT,
  cta TEXT,
  hook TEXT,
  image_prompt TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'draft',
  campaign_mapping_id UUID REFERENCES campaign_mappings(id) ON DELETE SET NULL,
  performance JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_creatives_status ON creatives(status, created_at DESC);

-- Agent chat history
CREATE TABLE agent_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## ORDEN DE EJECUCION (10 workstreams paralelos)

### WS1: Simplificacion (Sin Auth)
- Quitar middleware auth
- Quitar user checks de API routes
- Redirect / → /app/dashboard
- User ID fijo para queries

### WS2: Dashboard Real
- Reescribir /app/dashboard con KPIs reales
- Instalar recharts
- Componentes de graficos
- API /api/metrics/dashboard

### WS3: Meta Integration Fix
- Fix OAuth flow completo
- Verificar token encryption/decryption
- Test crear campana en Meta
- Test leer metricas de Meta
- Agregar permisos avanzados

### WS4: Google Ads Integration
- Verificar OAuth flow
- Test crear campana
- Test leer metricas
- GAQL queries para reportes

### WS5: TikTok Integration
- Verificar OAuth flow
- Test crear campana
- Test leer metricas

### WS6: Agente IA Conversacional
- Pagina /app/agent con chat UI
- API /api/agent/chat con multi-tool
- 7 tools del agente
- Streaming de respuestas

### WS7: Reportes y Alertas
- Tablas SQL
- API /api/reports/*
- API /api/cron/* (sync, daily, weekly, alerts)
- Pagina /app/reports
- Componente de alertas en dashboard
- vercel.json con crons

### WS8: Publicacion Directa
- Componente ad-publisher modal
- Flow generar → preview → publicar
- Integracion con platform clients

### WS9: Creative Library + Strategy
- Tabla creatives
- Pagina /app/library
- Pagina /app/strategy
- Prompts de audit, budget optimizer, copy tester

### WS10: Analytics Cross-Platform
- Reescribir /app/analytics
- Graficos comparativos
- KPI thresholds y health scores
- Comparativa entre plataformas

---

## Archivos a crear/modificar por modulo

### Modulo 1 (Simplificacion):
- MODIFICAR: `src/middleware.ts`
- MODIFICAR: `src/app/app/layout.tsx`
- MODIFICAR: `src/app/page.tsx`
- MODIFICAR: Todas las API routes en `src/app/api/` (quitar auth checks)

### Modulo 2 (Dashboard):
- INSTALAR: `recharts`
- CREAR: `src/components/charts/line-chart.tsx`
- CREAR: `src/components/charts/bar-chart.tsx`
- CREAR: `src/components/charts/pie-chart.tsx`
- CREAR: `src/components/dashboard/kpi-cards.tsx`
- CREAR: `src/components/dashboard/alerts-widget.tsx`
- CREAR: `src/components/dashboard/top-campaigns.tsx`
- CREAR: `src/app/api/metrics/dashboard/route.ts`
- REESCRIBIR: `src/app/app/dashboard/page.tsx`

### Modulo 3 (Agente):
- CREAR: `src/app/app/agent/page.tsx`
- CREAR: `src/app/api/agent/chat/route.ts`
- CREAR: `src/lib/agent/tools.ts`
- CREAR: `src/lib/agent/prompts.ts`
- CREAR: `src/components/agent/chat-interface.tsx`
- CREAR: `src/components/agent/message-bubble.tsx`
- CREAR: `src/hooks/use-agent-chat.ts`

### Modulo 4 (Reportes):
- CREAR: `src/app/app/reports/page.tsx`
- CREAR: `src/app/api/reports/daily/route.ts`
- CREAR: `src/app/api/reports/weekly/route.ts`
- CREAR: `src/app/api/cron/sync-metrics/route.ts`
- CREAR: `src/app/api/cron/daily-report/route.ts`
- CREAR: `src/app/api/cron/weekly-report/route.ts`
- CREAR: `src/app/api/cron/check-alerts/route.ts`
- CREAR: `src/components/reports/report-card.tsx`
- CREAR: `vercel.json` (crons)

### Modulo 5 (Analytics):
- REESCRIBIR: `src/app/app/analytics/page.tsx`
- CREAR: `src/components/analytics/platform-comparison.tsx`
- CREAR: `src/components/analytics/kpi-table.tsx`
- CREAR: `src/components/analytics/trend-chart.tsx`

### Modulo 6 (Publicacion):
- CREAR: `src/components/ads/ad-publisher.tsx`
- MODIFICAR: `src/components/ads/ad-card.tsx` (agregar boton publicar)

### Modulo 7 (Library):
- CREAR: `src/app/app/library/page.tsx`
- CREAR: `src/components/library/creative-grid.tsx`
- CREAR: `src/components/library/creative-card.tsx`
- CREAR: `src/app/api/creatives/route.ts`

### Modulo 8 (Estrategia):
- CREAR: `src/app/app/strategy/page.tsx`
- CREAR: `src/app/api/strategy/audit/route.ts`
- CREAR: `src/app/api/strategy/budget/route.ts`
- CREAR: `src/app/api/strategy/copy-test/route.ts`
- CREAR: `src/lib/prompts/strategy.ts`

### Modulo 9 (Meta permisos):
- Documentado arriba - son acciones manuales en Meta Developers

### Modulo 10 (Infra):
- CREAR: `vercel.json`
- SQL migrations para reports, alerts, creatives, agent_conversations

---

## Verificacion por modulo

### Modulo 1: / redirige a dashboard, todo accesible sin login
### Modulo 2: Dashboard muestra KPIs reales con graficos
### Modulo 3: Puedo chatear con el agente y recibe datos reales
### Modulo 4: Reporte diario se genera automaticamente
### Modulo 5: Analytics compara Meta vs Google vs TikTok con numeros
### Modulo 6: Puedo publicar un ad generado directamente a Meta
### Modulo 7: Library muestra todos mis creativos con status
### Modulo 8: Strategy genera recomendaciones basadas en datos
### Modulo 9: Meta app tiene permisos avanzados
### Modulo 10: Crons corren, metricas se sincronizan cada 4h
