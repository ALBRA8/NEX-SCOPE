#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NexScope - Informe Exhaustivo del Proyecto
Generado con ReportLab
"""

import os, sys, hashlib
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm, mm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, CondPageBreak, Image, Flowable
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FONT REGISTRATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
pdfmetrics.registerFont(TTFont('NotoSerifSC', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSCBold', '/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('SarasaMonoSC', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('SarasaMonoSCBold', '/usr/share/fonts/truetype/chinese/SarasaMonoSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('LiberationSerif', '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSansBody', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSansBold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSerif', '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'))

registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSCBold')
registerFontFamily('SarasaMonoSC', normal='SarasaMonoSC', bold='SarasaMonoSCBold')
registerFontFamily('DejaVuSans', normal='DejaVuSansBody', bold='DejaVuSansBold')
registerFontFamily('DejaVuSerif', normal='DejaVuSerif', bold='DejaVuSerif')
registerFontFamily('LiberationSerif', normal='LiberationSerif', bold='LiberationSerif')

# Font fallback
PDF_SKILL_DIR = "/home/z/my-project/skills/pdf"
_scripts = os.path.join(PDF_SKILL_DIR, "scripts")
if _scripts not in sys.path:
    sys.path.insert(0, _scripts)
from pdf import install_font_fallback
install_font_fallback()

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PALETTE (from palette.cascade)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE_BG       = colors.HexColor('#f1f0ef')
CARD_BG       = colors.HexColor('#ecebe9')
TABLE_STRIPE  = colors.HexColor('#f0efed')
HEADER_FILL   = colors.HexColor('#655b40')
BORDER        = colors.HexColor('#d5ceba')
ACCENT        = colors.HexColor('#2b6f86')
ACCENT_2      = colors.HexColor('#58c658')
TEXT_PRIMARY   = colors.HexColor('#161514')
TEXT_MUTED     = colors.HexColor('#8a8780')
SEM_SUCCESS   = colors.HexColor('#428c5b')
SEM_WARNING   = colors.HexColor('#8e7645')
SEM_ERROR     = colors.HexColor('#9f544d')
SEM_INFO      = colors.HexColor('#4b77a4')

TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = colors.HexColor('#f0efed')

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PAGE DIMENSIONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE_W, PAGE_H = A4
LEFT_MARGIN = 1.0 * inch
RIGHT_MARGIN = 1.0 * inch
TOP_MARGIN = 0.8 * inch
BOTTOM_MARGIN = 0.8 * inch
CONTENT_W = PAGE_W - LEFT_MARGIN - RIGHT_MARGIN

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STYLES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FONT_BODY = 'NotoSerifSC'
FONT_HEAD = 'NotoSerifSCBold'
FONT_EN   = 'LiberationSerif'

styles = getSampleStyleSheet()

s_title = ParagraphStyle('STitle', fontName=FONT_HEAD, fontSize=26, leading=34,
    alignment=TA_LEFT, textColor=ACCENT, spaceAfter=6, wordWrap='CJK')

s_h1 = ParagraphStyle('SH1', fontName=FONT_HEAD, fontSize=20, leading=28,
    alignment=TA_LEFT, textColor=ACCENT, spaceBefore=18, spaceAfter=10, wordWrap='CJK')

s_h2 = ParagraphStyle('SH2', fontName=FONT_HEAD, fontSize=14, leading=20,
    alignment=TA_LEFT, textColor=colors.HexColor('#2b6f86'), spaceBefore=12, spaceAfter=6, wordWrap='CJK')

s_h3 = ParagraphStyle('SH3', fontName=FONT_HEAD, fontSize=12, leading=17,
    alignment=TA_LEFT, textColor=colors.HexColor('#655b40'), spaceBefore=8, spaceAfter=4, wordWrap='CJK')

s_body = ParagraphStyle('SBody', fontName=FONT_BODY, fontSize=10.5, leading=18,
    alignment=TA_LEFT, textColor=TEXT_PRIMARY, spaceAfter=6, wordWrap='CJK', firstLineIndent=21)

s_body_no_indent = ParagraphStyle('SBodyNoIndent', fontName=FONT_BODY, fontSize=10.5, leading=18,
    alignment=TA_LEFT, textColor=TEXT_PRIMARY, spaceAfter=6, wordWrap='CJK')

s_bullet = ParagraphStyle('SBullet', fontName=FONT_BODY, fontSize=10.5, leading=18,
    alignment=TA_LEFT, textColor=TEXT_PRIMARY, spaceAfter=3, wordWrap='CJK',
    leftIndent=20, bulletIndent=8)

s_th = ParagraphStyle('STH', fontName=FONT_BODY, fontSize=10, leading=14,
    alignment=TA_CENTER, textColor=TABLE_HEADER_TEXT, wordWrap='CJK')

s_td = ParagraphStyle('STD', fontName=FONT_BODY, fontSize=9.5, leading=14,
    alignment=TA_LEFT, textColor=TEXT_PRIMARY, wordWrap='CJK')

s_td_c = ParagraphStyle('STDC', fontName=FONT_BODY, fontSize=9.5, leading=14,
    alignment=TA_CENTER, textColor=TEXT_PRIMARY, wordWrap='CJK')

s_caption = ParagraphStyle('SCaption', fontName=FONT_BODY, fontSize=9, leading=13,
    alignment=TA_CENTER, textColor=TEXT_MUTED, spaceAfter=6, wordWrap='CJK')

s_muted = ParagraphStyle('SMuted', fontName=FONT_BODY, fontSize=9.5, leading=15,
    alignment=TA_LEFT, textColor=TEXT_MUTED, spaceAfter=4, wordWrap='CJK')

s_toc1 = ParagraphStyle('STOC1', fontName=FONT_HEAD, fontSize=13, leading=22,
    leftIndent=20, wordWrap='CJK', textColor=TEXT_PRIMARY)

s_toc2 = ParagraphStyle('STOC2', fontName=FONT_BODY, fontSize=11, leading=18,
    leftIndent=40, wordWrap='CJK', textColor=TEXT_MUTED)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# HELPER FUNCTIONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

H1_ORPHAN_THRESHOLD = (PAGE_H - TOP_MARGIN - BOTTOM_MARGIN) * 0.15

class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

def add_heading(text, style, level=0):
    key = 'h_%s' % hashlib.md5(text.encode('utf-8')).hexdigest()[:8]
    p = Paragraph('<a name="%s"/>%s' % (key, text), style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

def add_major_section(text):
    return [
        CondPageBreak(H1_ORPHAN_THRESHOLD),
        add_heading(text, s_h1, level=0),
    ]

def make_table(data, col_widths, caption=None):
    """Create a styled table with standard formatting."""
    t = Table(data, colWidths=col_widths, hAlign='CENTER')
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('GRID', (0, 0), (-1, -1), 0.5, TEXT_MUTED),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]
    # Alternate row colors
    for i in range(1, len(data)):
        bg = TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    elements = [Spacer(1, 12), t]
    if caption:
        elements.append(Spacer(1, 4))
        elements.append(Paragraph(caption, s_caption))
    elements.append(Spacer(1, 12))
    return elements

def p(text, style=s_body):
    return Paragraph(text, style)

def h2(text):
    return add_heading(text, s_h2, level=1)

def h3(text):
    return add_heading(text, s_h3, level=2)

def bullet(text):
    return Paragraph(text, s_bullet)

def hr():
    """Thin horizontal rule."""
    class HRFlowable(Flowable):
        def __init__(self):
            Flowable.__init__(self)
            self.width = CONTENT_W
            self.height = 8
        def draw(self):
            self.canv.setStrokeColor(ACCENT)
            self.canv.setLineWidth(0.3)
            self.canv.line(0, 4, self.width, 4)
    return HRFlowable()

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# BUILD DOCUMENT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

output_path = "/home/z/my-project/download/NexScope_Informe_Exhaustivo.pdf"
body_path = "/home/z/my-project/download/nexscope_body.pdf"

doc = TocDocTemplate(
    body_path,
    pagesize=A4,
    leftMargin=LEFT_MARGIN,
    rightMargin=RIGHT_MARGIN,
    topMargin=TOP_MARGIN,
    bottomMargin=BOTTOM_MARGIN,
)

story = []

# ━━━ TABLE OF CONTENTS ━━━
toc = TableOfContents()
toc.levelStyles = [s_toc1, s_toc2]

story.append(Paragraph('<b>Contenido</b>', s_title))
story.append(Spacer(1, 12))
story.append(toc)
story.append(PageBreak())

# ═══════════════════════════════════════════════════════════════════
# SECTION 1: IDENTIDAD Y PROPOSITO
# ═══════════════════════════════════════════════════════════════════
story.extend(add_major_section('1. Identidad y Proposito'))

story.append(p(
    'NexScope es una plataforma web integral disenada para creadores de contenido que buscan identificar, '
    'analizar y explotar nichos rentables en YouTube, con un enfoque especial en canales "faceless" (sin mostrar '
    'el rostro del creador). La herramienta combina datos reales de la YouTube Data API v3 con capacidades de '
    'inteligencia artificial para ofrecer un ecosistema completo de descubrimiento y planificacion de contenido. '
    'Su nombre, NexScope, refleja la vision de ser el proximo nivel (Next) en la observacion y analisis (Scope) '
    'de oportunidades digitales en la economia de creadores.'
))

story.append(h2('1.1 Mision y Objetivo Principal'))
story.append(p(
    'La mision de NexScope es democratizar el acceso a herramientas de analisis avanzadas para creadores de '
    'contenido, permitiendo que tanto principiantes como creadores experimentados tomen decisiones basadas en datos '
    'reales en lugar de intuicion. El objetivo principal es reducir la friccion entre la idea de crear un canal '
    'de YouTube y la ejecucion exitosa del mismo, proporcionando inteligencia accionable sobre que nichos son '
    'rentables, que brechas de contenido existen, como monetizar eficazmente y como planificar una estrategia '
    'de contenido coherente y sostenible en el tiempo.'
))

story.append(h2('1.2 Problema que Resuelve y Audiencia'))
story.append(p(
    'El principal problema que NexScope aborda es la falta de herramientas accesibles y en espanol para el '
    'analisis de nichos de YouTube. La mayoria de herramientas existentes como VidIQ, TubeBuddy o NexLev.io '
    'estan disenadas para audiencias angloparlantes y resultan costosas para creadores de habla hispana. '
    'Los creadores novatos frecuentemente invierten meses produciendo contenido en nichos saturados o con bajo '
    'potencial de monetizacion, desconociendo metricas criticas como el RPM (Revenue Per Mille), la velocidad '
    'de crecimiento o el nivel de competencia real. NexScope centraliza toda esta informacion en una interfaz '
    'intuitiva, en espanol, con un modelo de precios accesible.'
))

story.append(p(
    'La audiencia objetivo de NexScope incluye: creadores de contenido novatos que quieren iniciar su primer '
    'canal de YouTube de forma estrategica; creadores intermedios que buscan diversificar o pivotar hacia nichos '
    'mas rentables; emprendedores digitales interesados en la economia de creadores y canales faceless como '
    'fuente de ingresos pasivos; y agencias de marketing digital que gestionan multiples canales y necesitan '
    'herramientas de analisis masivas. El foco principal es el mercado hispanohablante, con expansion planificada '
    'hacia ingles y portugues en futuras versiones.'
))

story.append(h2('1.3 Propuesta de Valor Diferencial'))
story.append(p(
    'NexScope se diferencia de sus competidores en varios aspectos fundamentales. Primero, ofrece una interfaz '
    'completamente en espanol, algo que ninguna de las herramientas principales del mercado proporciona nativamente. '
    'Segundo, integra un asistente de IA conversacional especializado en YouTube que no solo responde preguntas '
    'sino que genera planes de contenido completos y analisis de brechas de forma proactiva. Tercero, el enfoque '
    'en canales faceless es unico: mientras que otras herramientas son genericas para cualquier tipo de canal, '
    'NexScope optimiza sus metricas y recomendaciones especificamente para el modelo de contenido sin rostro, '
    'donde factores como la automatizacion, el RPM por categoria y la escalabilidad del contenido son criticos. '
    'Cuarto, el modelo de precios empieza con un plan gratuito funcional (no limitado a trial) y un plan Pro '
    'a $10 USD/mes, significativamente mas accesible que las alternativas que cobran entre $20 y $50 USD mensuales.'
))

# ═══════════════════════════════════════════════════════════════════
# SECTION 2: STACK TECNOLOGICO COMPLETO
# ═══════════════════════════════════════════════════════════════════
story.extend(add_major_section('2. Stack Tecnologico Completo'))

story.append(p(
    'NexScope esta construido sobre un stack moderno y robusto que prioriza la experiencia de desarrollo, '
    'el rendimiento y la escalabilidad. La arquitectura sigue el paradigma de aplicacion de pagina unica (SPA) '
    'con Next.js como framework fullstack, donde tanto el frontend como el backend (API routes) coexisten '
    'en el mismo proyecto. A continuacion se detalla cada componente tecnologico del ecosistema.'
))

story.append(h2('2.1 Framework Frontend'))
story.append(p(
    'El frontend esta construido con <b>Next.js 16.1.1</b> sobre <b>React 19</b> y <b>TypeScript 5</b>. '
    'Se utiliza el patron de App Router con una unica pagina raiz (SPA) que gestiona la navegacion internamente '
    'a traves de estado global con Zustand. El sistema de estilos emplea <b>Tailwind CSS 4</b> con el plugin '
    '<b>tailwindcss-animate</b> para transiciones fluidas. La biblioteca de componentes UI es <b>shadcn/ui</b> '
    'en su variante "new-york", con 44 primitivos instalados que cubren desde botones y dialogos hasta tablas '
    'y formularios complejos. Las animaciones avanzadas se implementan con <b>Framer Motion 12.23.2</b>, y las '
    'visualizaciones graficas utilizan <b>Recharts 2.15.4</b> para graficos de barras, lineas, torta, radar y dispersion.'
))

story.append(h2('2.2 Backend / API'))
story.append(p(
    'El backend funciona completamente a traves de <b>Next.js Route Handlers</b> (API routes), sin necesidad '
    'de un servidor Express separado. Todas las rutas API estan ubicadas en <b>src/app/api/</b> e incluyen: '
    'autenticacion de usuarios (login, registro, verificacion), proxy de YouTube Data API v3, gestion de '
    'configuracion (settings CRUD), chat con IA, generacion de brechas de contenido, y planes de contenido. '
    'La comunicacion con la IA se realiza mediante el SDK <b>z-ai-web-dev-sdk v0.0.17</b>, que abstrae las '
    'llamadas a modelos de lenguaje para completions de chat y generacion de contenido estructurado.'
))

story.append(h2('2.3 Base de Datos y ORM'))
story.append(p(
    'La base de datos es <b>SQLite</b>, gestionada a traves de <b>Prisma ORM 6.11.1</b>. El archivo de base '
    'de datos se encuentra en <b>db/custom.db</b>. El esquema incluye 6 modelos: User (autenticacion), SavedNiche '
    '(nichos guardados), SavedChannel (canales guardados), ChatMessage (mensajes de chat), ContentPlan (planes '
    'de contenido) y Setting (configuracion de API keys). La configuracion de Prisma utiliza el proveedor SQLite '
    'con la URL de conexion almacenada en la variable de entorno DATABASE_URL. Los comandos disponibles incluyen '
    'db:push, db:generate, db:migrate y db:reset para gestion del esquema.'
))

story.append(h2('2.4 Paquetes Principales'))

pkgs = [
    ['next', '16.1.1', 'Framework fullstack React'],
    ['react', '19.0.0', 'Libreria de UI reactiva'],
    ['typescript', '5.x', 'Tipado estatico'],
    ['tailwindcss', '4.x', 'Framework CSS utilitario'],
    ['prisma', '6.11.1', 'ORM para SQLite'],
    ['zustand', '5.0.6', 'Gestion de estado global'],
    ['recharts', '2.15.4', 'Graficos y visualizaciones'],
    ['framer-motion', '12.23.2', 'Animaciones avanzadas'],
    ['z-ai-web-dev-sdk', '0.0.17', 'SDK de IA (chat, imagenes, busqueda)'],
    ['lucide-react', '0.525.0', 'Iconos SVG'],
    ['next-themes', '0.4.6', 'Cambiar tema claro/oscuro'],
    ['react-hook-form', '7.60.0', 'Gestion de formularios'],
    ['zod', '4.0.2', 'Validacion de esquemas'],
    ['next-auth', '4.24.11', 'Autenticacion (instalado, no configurado)'],
    ['next-intl', '4.3.4', 'Internacionalizacion (instalado, no configurado)'],
    ['sonner', '2.0.6', 'Notificaciones toast'],
    ['cmdk', '1.1.1', 'Command palette'],
    ['sharp', '0.34.3', 'Procesamiento de imagenes'],
    ['uuid', '11.1.0', 'Generacion de IDs unicos'],
    ['date-fns', '4.1.0', 'Utilidades de fechas'],
]

pkg_data = [[Paragraph('<b>Paquete</b>', s_th), Paragraph('<b>Version</b>', s_th), Paragraph('<b>Proposito</b>', s_th)]]
for row in pkgs:
    pkg_data.append([Paragraph(row[0], s_td), Paragraph(row[1], s_td_c), Paragraph(row[2], s_td)])

col_w_pkg = [CONTENT_W*0.30, CONTENT_W*0.18, CONTENT_W*0.52]
story.extend(make_table(pkg_data, col_w_pkg, 'Tabla 1: Paquetes principales del proyecto'))

story.append(h2('2.5 Servicios de IA Integrados'))
story.append(p(
    'NexScope integra capacidades de inteligencia artificial a traves del SDK <b>z-ai-web-dev-sdk</b>, '
    'que proporciona acceso a modelos de lenguaje grande (LLM) para completions de chat. Actualmente se utiliza '
    'para tres funcionalidades principales: (1) el Asistente de IA conversacional que responde preguntas sobre '
    'YouTube y nichos de contenido con un prompt de sistema especializado en YouTube en espanol; (2) la generacion '
    'automatica de analisis de brechas de contenido (content gaps), donde el modelo analiza un nicho y genera '
    'oportunidades de contenido no explotadas; y (3) la generacion de planes de contenido de 30 videos con '
    'titulos, descripciones y estrategias de palabras clave. El SDK tambien ofrece capacidades de generacion '
    'de imagenes y busqueda web que aun no han sido integradas en la interfaz del usuario.'
))

story.append(h2('2.6 APIs Externas Conectadas'))
story.append(p(
    'La unica API externa completamente integrada es la <b>YouTube Data API v3</b>, que se conecta a traves '
    'de un proxy en el backend (src/app/api/youtube/route.ts). Este proxy soporta 6 acciones: busqueda de '
    'videos, estadisticas de canales, videos de un canal, categorias de video, videos trending y busqueda '
    'especializada de nichos. La API key se almacena de forma segura en la base de datos (tabla Setting) en '
    'lugar de variables de entorno, permitiendo su gestion desde la interfaz de configuracion del dashboard. '
    'Ademas, existen campos de configuracion preparados para OpenAI API y Stripe API que aun no estan conectados '
    'funcionalmente. No existen integraciones con TikTok, Instagram, RapidAPI ni otras plataformas en el estado actual.'
))

# ═══════════════════════════════════════════════════════════════════
# SECTION 3: FUNCIONALIDADES IMPLEMENTADAS
# ═══════════════════════════════════════════════════════════════════
story.extend(add_major_section('3. Funcionalidades Implementadas'))

story.append(p(
    'A continuacion se detalla cada funcionalidad del sistema con su estado actual de implementacion. '
    'Se clasifican en tres estados: Funcional (opera completamente con datos reales), Parcial (opera con '
    'datos reales pero con fallbacks a datos simulados) y Pendiente (solo datos simulados o no implementada). '
    'Es importante notar que de las 11 vistas principales, solo 2 operan completamente con datos reales, '
    '4 funcionan en modo hibrido y 5 dependen exclusivamente de datos simulados.'
))

features = [
    ['Dashboard / Panel Principal', 'Muestra estadisticas generales: nichos guardados, canales monitoreados, nichos trending, canales trending. Incluye graficos de barras (puntuacion de nichos) y lineas (tendencias de crecimiento).', 'DashboardView.tsx', 'N/A', 'Pendiente'],
    ['Buscador de Nichos', 'Busca nichos en YouTube usando la Data API v3. Permite alternar entre datos Demo (simulados) y YouTube Live (reales). Convierte datos de canales en formato de nicho con puntuaciones calculadas.', 'NicheFinderView.tsx', '/api/youtube?action=niche-search', 'Parcial'],
    ['Tendencias', 'Muestra nichos trending por categoria con sparklines y barras de velocidad. Filtrado por pestanas de categoria.', 'TrendsView.tsx', 'N/A', 'Pendiente'],
    ['Analisis de Canal', 'Busca canales de YouTube y muestra perfil, metricas (suscriptores, vistas, videos), grafico de crecimiento y analisis FODA. Datos reales de YouTube con crecimiento simulado.', 'ChannelAnalyzerView.tsx', '/api/youtube?action=channel-stats', 'Parcial'],
    ['Brechas de Contenido', 'Genera analisis de oportunidades de contenido usando IA. Muestra scatter plot de volumen vs competencia. Fallback a 8 brechas predefinidas si la IA falla.', 'ContentGapView.tsx', '/api/content-gaps', 'Parcial'],
    ['Estimador de Monetizacion', 'Calculadora de ingresos estimados con sliders de suscriptores y vistas. Desglose por fuente (AdSense, sponsors, etc.) en grafico de torta. Comparativa de RPM por nicho.', 'MonetizationView.tsx', 'N/A', 'Pendiente'],
    ['Matriz de Competencia', 'Comparacion de hasta 4 canales en grafico radar con metricas de calidad, consistencia, crecimiento, engagement y monetizacion. Tabla comparativa con indicador de ganador.', 'CompetitorMatrixView.tsx', 'N/A', 'Pendiente'],
    ['Plan de Contenido', 'Genera un plan de 30 videos usando IA con titulos, descripciones y estrategias. Filtro por semana. Fallback a 30 videos predefinidos. Boton de exportacion no funcional.', 'ContentPlanView.tsx', '/api/content-plan', 'Parcial'],
    ['Explorador de Keywords', 'Tabla de 30 keywords con volumen, competencia, CPC y grafico de tendencia. Busqueda y filtros. Panel de detalle con grafico de linea y keywords relacionadas.', 'KeywordExplorerView.tsx', 'N/A', 'Pendiente'],
    ['Asistente de IA', 'Chat conversacional con IA especializada en YouTube. Preguntas sugeridas predefinidas. Historial de conversacion en la sesion actual.', 'AIChatView.tsx', '/api/chat', 'Funcional'],
    ['Configuracion de APIs', 'Gestion CRUD de API keys (YouTube, OpenAI, Stripe). Test de conexion para YouTube. Valores enmascarados para seguridad.', 'SettingsView.tsx', '/api/settings', 'Funcional'],
    ['Landing Page', 'Pagina de marketing completa con hero, social proof, features, como funciona, precios (Free/Pro), testimonios y CTA.', 'LandingPage.tsx', 'N/A', 'Funcional'],
    ['Autenticacion', 'Registro e inicio de sesion con email/password. Boton de "Inicio Rapido" para acceso sin registro (modo invitado).', 'auth/LoginModal.tsx, auth/RegisterModal.tsx', '/api/auth/login, /api/auth/register', 'Parcial'],
    ['Tema Claro/Oscuro', 'Cambio entre temas claro y oscuro con persistencia en localStorage.', 'ThemeToggle.tsx', 'N/A', 'Funcional'],
    ['Sidebar de Navegacion', 'Menu lateral colapsable con 10 herramientas + configuracion. Avatar de usuario con logout.', 'AppSidebar.tsx', 'N/A', 'Funcional'],
]

feat_data = [[
    Paragraph('<b>Funcion</b>', s_th),
    Paragraph('<b>Descripcion</b>', s_th),
    Paragraph('<b>Componente</b>', s_th),
    Paragraph('<b>API</b>', s_th),
    Paragraph('<b>Estado</b>', s_th),
]]

status_colors = {
    'Funcional': SEM_SUCCESS,
    'Parcial': SEM_WARNING,
    'Pendiente': SEM_ERROR,
}

s_td_status = {}
for status_name, status_color in status_colors.items():
    s_td_status[status_name] = ParagraphStyle(
        f'STD_{status_name}', fontName=FONT_BODY, fontSize=9.5, leading=14,
        alignment=TA_CENTER, textColor=status_color, wordWrap='CJK'
    )

for row in features:
    st = row[4]
    feat_data.append([
        Paragraph(row[0], s_td),
        Paragraph(row[1], s_td),
        Paragraph(row[2], s_td),
        Paragraph(row[3], s_td),
        Paragraph(f'<b>{st}</b>', s_td_status.get(st, s_td_c)),
    ])

col_w_feat = [CONTENT_W*0.14, CONTENT_W*0.32, CONTENT_W*0.20, CONTENT_W*0.22, CONTENT_W*0.12]
story.extend(make_table(feat_data, col_w_feat, 'Tabla 2: Estado de funcionalidades implementadas'))

# ═══════════════════════════════════════════════════════════════════
# SECTION 4: ARQUITECTURA DE COMPONENTES
# ═══════════════════════════════════════════════════════════════════
story.extend(add_major_section('4. Arquitectura de Componentes'))

story.append(p(
    'La arquitectura de NexScope sigue un patron de aplicacion de pagina unica (SPA) donde toda la navegacion '
    'se gestiona del lado del cliente a traves del estado global de Zustand. No existen rutas de archivo '
    'adicionales mas alla de la raiz (/); todas las vistas se renderizan condicionalmente segun la variable '
    'activeView del store. Esta seccion detalla la estructura completa de componentes, rutas API, modelos de '
    'datos y librerias utilitarias que conforman el sistema.'
))

story.append(h2('4.1 Componentes en /src/components/'))

comp_data = [[Paragraph('<b>Archivo</b>', s_th), Paragraph('<b>Descripcion</b>', s_th), Paragraph('<b>Lineas</b>', s_th)]]
comps = [
    ['ApiKeyStatus.tsx', 'Indicador de estado de conexion de API key YouTube', '~40'],
    ['AppSidebar.tsx', 'Sidebar principal con navegacion y perfil de usuario', '187'],
    ['ErrorBoundary.tsx', 'Boundary de errores React con boton de reintento', '~30'],
    ['LandingPage.tsx', 'Pagina de aterrizaje con marketing completo', '841'],
    ['ThemeToggle.tsx', 'Toggle de tema claro/oscuro', '~20'],
    ['auth/LoginModal.tsx', 'Modal de inicio de sesion', '~100'],
    ['auth/RegisterModal.tsx', 'Modal de registro', '~120'],
    ['shared/ChannelCard.tsx', 'Tarjeta reutilizable de canal', '~50'],
    ['shared/NicheCard.tsx', 'Tarjeta reutilizable de nicho con score, RPM, crecimiento', '~60'],
    ['shared/ScoreIndicator.tsx', 'Indicador circular SVG de puntuacion (0-100)', '~40'],
    ['shared/StatCard.tsx', 'Tarjeta de estadistica con icono, valor y tendencia', '~40'],
    ['shared/TrendSparkline.tsx', 'Mini grafico de linea sparkline con Recharts', '~30'],
    ['views/DashboardView.tsx', 'Panel principal con estadisticas y graficos', '225'],
    ['views/NicheFinderView.tsx', 'Buscador de nichos con datos YouTube', '415'],
    ['views/TrendsView.tsx', 'Vista de tendencias por categoria', '145'],
    ['views/ChannelAnalyzerView.tsx', 'Analisis detallado de canal', '453'],
    ['views/ContentGapView.tsx', 'Brechas de contenido con scatter plot', '198'],
    ['views/ContentPlanView.tsx', 'Generador de plan de contenido', '191'],
    ['views/KeywordExplorerView.tsx', 'Explorador de palabras clave', '211'],
    ['views/MonetizationView.tsx', 'Calculadora de monetizacion', '168'],
    ['views/CompetitorMatrixView.tsx', 'Matriz de competencia con radar', '201'],
    ['views/AIChatView.tsx', 'Chat con asistente IA', '176'],
    ['views/SettingsView.tsx', 'Panel de configuracion de APIs', '484'],
]
for row in comps:
    comp_data.append([Paragraph(row[0], s_td), Paragraph(row[1], s_td), Paragraph(row[2], s_td_c)])

col_w_comp = [CONTENT_W*0.35, CONTENT_W*0.50, CONTENT_W*0.15]
story.extend(make_table(comp_data, col_w_comp, 'Tabla 3: Componentes del proyecto'))

story.append(h2('4.2 API Routes en /src/app/api/'))

api_data = [[Paragraph('<b>Ruta</b>', s_th), Paragraph('<b>Metodo</b>', s_th), Paragraph('<b>Funcion</b>', s_th)]]
apis = [
    ['/api/', 'GET', 'Health check del servidor'],
    ['/api/auth/login', 'POST', 'Autenticacion de usuario (email + password)'],
    ['/api/auth/register', 'POST', 'Registro de nuevo usuario'],
    ['/api/auth/me', 'GET', 'Obtener datos del usuario autenticado'],
    ['/api/youtube', 'GET', 'Proxy YouTube Data API v3 (6 acciones: search, channel-stats, channel-videos, video-categories, trending, niche-search)'],
    ['/api/youtube', 'POST', 'Validacion de API key YouTube'],
    ['/api/chat', 'POST', 'Chat con IA usando z-ai-web-dev-sdk'],
    ['/api/content-gaps', 'POST', 'Generacion de brechas de contenido con IA'],
    ['/api/content-plan', 'POST', 'Generacion de plan de 30 videos con IA'],
    ['/api/settings', 'GET', 'Listar configuraciones (valores enmascarados)'],
    ['/api/settings', 'POST', 'Crear/actualizar configuracion de API key'],
    ['/api/settings', 'DELETE', 'Eliminar configuracion de API key'],
]
for row in apis:
    api_data.append([Paragraph(row[0], s_td), Paragraph(row[1], s_td_c), Paragraph(row[2], s_td)])

col_w_api = [CONTENT_W*0.30, CONTENT_W*0.15, CONTENT_W*0.55]
story.extend(make_table(api_data, col_w_api, 'Tabla 4: Rutas API del backend'))

story.append(h2('4.3 Estructura de Base de Datos (Prisma Schema)'))

db_data = [[Paragraph('<b>Modelo</b>', s_th), Paragraph('<b>Campos</b>', s_th), Paragraph('<b>Uso Actual</b>', s_th)]]
models = [
    ['User', 'id, email, name, password, createdAt, updatedAt', 'Funcional - autenticacion basica'],
    ['SavedNiche', 'id, nicheId, nicheName, category, nicheScore, userId, createdAt, updatedAt', 'Definido pero NO persistido (solo Zustand)'],
    ['SavedChannel', 'id, channelId, channelName, subscribers, userId, createdAt, updatedAt', 'Definido pero NO persistido (solo Zustand)'],
    ['ChatMessage', 'id, role, content, userId, createdAt', 'Definido pero NO persistido (solo Zustand)'],
    ['ContentPlan', 'id, niche, audience, planData, userId, createdAt, updatedAt', 'Definido pero NO persistido'],
    ['Setting', 'id, key, value, category, createdAt, updatedAt', 'Funcional - almacenamiento de API keys'],
]
for row in models:
    db_data.append([Paragraph(row[0], s_td), Paragraph(row[1], s_td), Paragraph(row[2], s_td)])

col_w_db = [CONTENT_W*0.15, CONTENT_W*0.50, CONTENT_W*0.35]
story.extend(make_table(db_data, col_w_db, 'Tabla 5: Modelos de la base de datos'))

story.append(h2('4.4 Librerias Utilitarias en /src/lib/'))

lib_data = [[Paragraph('<b>Archivo</b>', s_th), Paragraph('<b>Funcion</b>', s_th), Paragraph('<b>Detalle</b>', s_th)]]
libs = [
    ['db.ts', 'Cliente Prisma singleton', 'Configuracion con query logging para desarrollo'],
    ['mock-data.ts', 'Datos simulados', '20 nichos, 15 canales, 30 keywords, datos de tendencia, RPM, categorias'],
    ['store.ts', 'Estado global (Zustand)', 'activeView, savedNiches, savedChannels, chatMessages, auth state, sidebar'],
    ['types.ts', 'Interfaces TypeScript', 'ViewType, CompetitionLevel, CategoryType, Niche, Channel, TopVideo, Keyword, ContentGap, VideoIdea, ChatMessage, TrendData, MonthlyRevenue'],
    ['utils.ts', 'Utilidades CSS', 'Funcion cn() para combinacion de clases (clsx + tailwind-merge)'],
]
for row in libs:
    lib_data.append([Paragraph(row[0], s_td), Paragraph(row[1], s_td), Paragraph(row[2], s_td)])

col_w_lib = [CONTENT_W*0.20, CONTENT_W*0.25, CONTENT_W*0.55]
story.extend(make_table(lib_data, col_w_lib, 'Tabla 6: Librerias utilitarias'))

# ═══════════════════════════════════════════════════════════════════
# SECTION 5: CAPACIDADES DE IA
# ═══════════════════════════════════════════════════════════════════
story.extend(add_major_section('5. Capacidades de IA'))

story.append(p(
    'NexScope integra capacidades de inteligencia artificial a traves del SDK z-ai-web-dev-sdk, que proporciona '
    'acceso a modelos de lenguaje grande para chat y generacion de contenido. A continuacion se detallan todas '
    'las capacidades de IA actuales y planificadas del sistema, incluyendo modelos utilizados, funcionalidades '
    'implementadas y aquellas que aun se encuentran en estado pendiente de desarrollo.'
))

story.append(h2('5.1 Modelos de IA Utilizados'))
story.append(p(
    'Actualmente, NexScope utiliza un unico modelo de IA a traves del SDK z-ai-web-dev-sdk para completions '
    'de chat. El modelo se invoca con un system prompt especializado que le da la identidad de un experto en '
    'YouTube y nichos de contenido en espanol. Este modelo se utiliza para tres funcionalidades: el chat '
    'conversacional del Asistente de IA, la generacion de brechas de contenido (content gaps) y la generacion '
    'de planes de contenido de 30 videos. Las respuestas del modelo se solicitan en formato JSON estructurado '
    'para las funcionalidades de brechas y planes, mientras que el chat utiliza formato de texto libre. No se '
    'utiliza ningun modelo propio o fine-tuned; todo depende del modelo base proporcionado por el SDK.'
))

ai_cap_data = [[Paragraph('<b>Capacidad</b>', s_th), Paragraph('<b>Modelo/API</b>', s_th), Paragraph('<b>Estado</b>', s_th), Paragraph('<b>Detalle</b>', s_th)]]
ai_caps = [
    ['Chat conversacional', 'z-ai-web-dev-sdk (LLM)', 'Funcional', 'Asistente experto en YouTube con contexto en espanol'],
    ['Generacion de contenido', 'z-ai-web-dev-sdk (LLM)', 'Funcional', 'Brechas de contenido y planes de 30 videos en JSON'],
    ['Generacion de imagenes', 'z-ai-web-dev-sdk (images)', 'Pendiente', 'SDK lo soporta pero no integrado en la UI'],
    ['Busqueda web', 'z-ai-web-dev-sdk (search)', 'Pendiente', 'SDK lo soporta pero no integrado en la UI'],
    ['Generacion de video', 'Ninguno', 'Pendiente', 'No hay integracion con ninguna API de video'],
    ['Text-to-Speech', 'Ninguno', 'Pendiente', 'No hay integracion con APIs de voz'],
    ['Lip-sync / Avatares', 'Ninguno', 'Pendiente', 'No hay integracion con servicios de avatar'],
    ['Vision / Analisis de imagen', 'Ninguno', 'Pendiente', 'No hay integracion con modelos VLM'],
]
for row in ai_caps:
    st = row[2]
    ai_cap_data.append([
        Paragraph(row[0], s_td),
        Paragraph(row[1], s_td),
        Paragraph(f'<b>{st}</b>', s_td_status.get(st, s_td_c)),
        Paragraph(row[3], s_td),
    ])

col_w_ai = [CONTENT_W*0.18, CONTENT_W*0.22, CONTENT_W*0.12, CONTENT_W*0.48]
story.extend(make_table(ai_cap_data, col_w_ai, 'Tabla 7: Capacidades de inteligencia artificial'))

story.append(h2('5.2 Identidades del Chat'))
story.append(p(
    'El asistente de IA opera con una unica identidad: un experto en YouTube y estrategia de contenido para '
    'canales faceless. El system prompt esta configurado en espanol y le indica al modelo que debe actuar como '
    'un consultor especializado en nichos, tendencias y estrategias de crecimiento de canales. No existen '
    'multiples personalidades ni identidades configurables. Las preguntas sugeridas en la interfaz del chat '
    'incluyen temas como encontrar nichos rentables, estrategias para canales faceless, como aumentar el RPM, '
    'y tendencias actuales de contenido en YouTube.'
))

# ═══════════════════════════════════════════════════════════════════
# SECTION 6: PIPELINE DE CONTENIDO
# ═══════════════════════════════════════════════════════════════════
story.extend(add_major_section('6. Pipeline de Contenido'))

story.append(p(
    'El pipeline de contenido se refiere al flujo automatizado (o semiautomatizado) que permite ir desde '
    'el descubrimiento de un nicho hasta la creacion y publicacion de contenido. En el estado actual, '
    'NexScope cubre parcialmente las primeras etapas del pipeline (descubrimiento y planificacion) pero '
    'no tiene capacidades de creacion automatizada ni publicacion directa a plataformas.'
))

pipe_data = [[Paragraph('<b>Etapa del Pipeline</b>', s_th), Paragraph('<b>Estado</b>', s_th), Paragraph('<b>Descripcion</b>', s_th)]]
pipes = [
    ['Descubrimiento de nichos', 'Parcial', 'Busqueda en YouTube Data API con puntuaciones calculadas. Faltan fuentes de datos adicionales (TikTok, Instagram, Google Trends).'],
    ['Analisis de tendencias', 'Pendiente', 'Vista de tendencias existe pero usa solo datos simulados. No hay scraping de tendencias reales ni de multiples plataformas.'],
    ['Analisis de brechas', 'Parcial', 'Generacion de brechas con IA funcional, pero depende de que el nicho este bien definido. Fallback a datos estaticos si la IA falla.'],
    ['Generacion de scripts/guiones', 'Parcial', 'El plan de contenido incluye descripciones de video, pero no scripts detallados con guiones narrativos completos.'],
    ['Generacion de imagenes', 'Pendiente', 'El SDK soporta generacion de imagenes pero no hay integracion en la UI. No se generan thumbnails ni assets visuales.'],
    ['Generacion de video', 'Pendiente', 'No hay integracion con APIs de generacion de video. No se crean videos automaticamente.'],
    ['Text-to-Speech / voz', 'Pendiente', 'No hay integracion con APIs de voz. No se generan narraciones automaticas.'],
    ['Publicacion a redes', 'Pendiente', 'No hay integracion con YouTube, TikTok ni Instagram APIs para publicacion. El boton de exportacion no funciona.'],
    ['Cola de publicacion programada', 'Pendiente', 'No existe sistema de scheduling ni cola de publicacion.'],
    ['Scraping de tendencias virales', 'Pendiente', 'No hay scraping de plataformas externas. Solo YouTube Data API para busqueda basica.'],
]
for row in pipes:
    st = row[1]
    pipe_data.append([
        Paragraph(row[0], s_td),
        Paragraph(f'<b>{st}</b>', s_td_status.get(st, s_td_c)),
        Paragraph(row[2], s_td),
    ])

col_w_pipe = [CONTENT_W*0.22, CONTENT_W*0.10, CONTENT_W*0.68]
story.extend(make_table(pipe_data, col_w_pipe, 'Tabla 8: Estado del pipeline de contenido'))

story.append(p(
    'En resumen, NexScope funciona actualmente como una herramienta de inteligencia y planificacion, no como '
    'un pipeline de creacion automatizada. El flujo recomendado es: usar el Buscador de Nichos para encontrar '
    'oportunidades, analizar brechas de contenido con IA, generar un plan de contenido de 30 videos, y luego '
    'usar el asistente de IA para refinar la estrategia. Las etapas de creacion y publicacion son completamente '
    'manuales y dependen del usuario.'
))

# ═══════════════════════════════════════════════════════════════════
# SECTION 7: GESTION DE AVATARES/PERSONAJES
# ═══════════════════════════════════════════════════════════════════
story.extend(add_major_section('7. Gestion de Avatares/Personajes'))

story.append(p(
    'NexScope no incluye actualmente ningun sistema de gestion de avatares o personajes virtuales. Aunque '
    'la plataforma esta disenada para creadores de canales faceless (sin mostrar rostro), el concepto de '
    '"avatar" en este contexto se refiere a la identidad visual del canal (logo, estilo, voz narrativa) '
    'mas que a un personaje 3D o animacion generada por IA. No existe un modelo de datos para avatares, '
    'no hay interfaz de creacion o edicion de personajes, y no se mantiene consistencia de personaje entre '
    'diferentes generaciones de contenido.'
))

story.append(p(
    'Esta funcionalidad esta planificada para futuras versiones, donde se implementaria un sistema de '
    '"Perfil de Canal" que incluiria: nombre del canal, descripcion, estilo visual (paleta de colores, '
    'tipo de thumbnails), tono narrativo (formal, casual, educativo), categoria principal, y preferencias '
    'de contenido. Este perfil serviria como contexto para la generacion de planes de contenido y scripts '
    'mas personalizados y consistentes. Sin embargo, en el estado actual del proyecto, no hay ningun '
    'campo ni componente dedicado a la gestion de avatares o personajes.'
))

# ═══════════════════════════════════════════════════════════════════
# SECTION 8: ANALITICA Y DATOS
# ═══════════════════════════════════════════════════════════════════
story.extend(add_major_section('8. Analitica y Datos'))

story.append(p(
    'El sistema de analitica de NexScope se encuentra en un estado inicial donde la mayoria de los datos '
    'presentados son simulados. El dashboard principal muestra metricas generales, pero todas provienen del '
    'archivo mock-data.ts y no reflejan datos reales de ningun canal o nicho. Las unicas metricas reales '
    'provienen de la YouTube Data API v3, que se utiliza en el Buscador de Nichos y el Analisis de Canal, '
    'pero incluso en estos casos, algunos datos derivados (como la tasa de crecimiento) se calculan con '
    'formulas aproximadas o valores aleatorios.'
))

story.append(h2('8.1 Dashboard de Analytics'))
story.append(p(
    'El Dashboard actual es mas una vista de resumen que un analytics completo. Muestra cuatro tarjetas de '
    'estadisticas (Nichos Guardados, Canales Monitoreados, Nichos Trending, Canales Trending) que reflejan '
    'los datos almacenados en el store de Zustand, no en la base de datos. Incluye un grafico de barras que '
    'muestra las puntuaciones de los primeros 6 nichos, un grafico de lineas con tendencias de crecimiento '
    'simuladas, y una lista de nichos recientes. No hay filtros de fecha, comparativas temporales, ni '
    'capacidad de exportar datos.'
))

story.append(h2('8.2 Fuentes de Datos'))

data_src = [[Paragraph('<b>Fuente</b>', s_th), Paragraph('<b>Tipo</b>', s_th), Paragraph('<b>Usada en</b>', s_th), Paragraph('<b>Estado</b>', s_th)]]
srcs = [
    ['mock-data.ts', 'Simulado', 'Dashboard, Trends, Monetization, Competitor, Keywords', 'Pendiente'],
    ['YouTube Data API v3', 'Real', 'NicheFinder, ChannelAnalyzer', 'Funcional'],
    ['z-ai-web-dev-sdk (LLM)', 'Real', 'AIChat, ContentGaps, ContentPlan', 'Funcional'],
    ['Base de datos (Prisma/SQLite)', 'Real', 'Settings, Auth', 'Funcional'],
]
for row in srcs:
    st = row[3]
    data_src.append([
        Paragraph(row[0], s_td),
        Paragraph(row[1], s_td_c),
        Paragraph(row[2], s_td),
        Paragraph(f'<b>{st}</b>', s_td_status.get(st, s_td_c)),
    ])

col_w_src = [CONTENT_W*0.22, CONTENT_W*0.12, CONTENT_W*0.48, CONTENT_W*0.18]
story.extend(make_table(data_src, col_w_src, 'Tabla 9: Fuentes de datos del sistema'))

story.append(h2('8.3 Metricas Mostradas'))
story.append(p(
    'Las metricas que se muestran en las diferentes vistas incluyen: Niche Score (puntuacion compuesta de '
    '0-100 que evalua rentabilidad), RPM estimado (Revenue Per Mille en USD), tasa de crecimiento (porcentaje '
    'de crecimiento mensual), nivel de competencia (bajo, medio, alto), volumen de busqueda, CPC (Cost Per '
    'Click estimado), suscriptores de canales, vistas totales, numero de videos, y tendencia temporal (array '
    'de valores para sparklines). Sin embargo, muchas de estas metricas son estimaciones aproximadas o '
    'valores aleatorios, especialmente el RPM, la tasa de crecimiento y el volumen de busqueda, ya que la '
    'YouTube Data API no proporciona directamente estos datos para todos los nichos.'
))

# ═══════════════════════════════════════════════════════════════════
# SECTION 9: INTEGRACIONES EXTERNAS
# ═══════════════════════════════════════════════════════════════════
story.extend(add_major_section('9. Integraciones Externas'))

story.append(p(
    'Las integraciones externas de NexScope son limitadas en su estado actual. La unica integracion '
    'completamente funcional es con la YouTube Data API v3, que permite obtener datos reales de videos, '
    'canales y categorias. Las demas integraciones estan preparadas a nivel de interfaz (campos de '
    'configuracion en SettingsView) pero no estan conectadas funcionalmente en el backend.'
))

int_data = [[Paragraph('<b>Integracion</b>', s_th), Paragraph('<b>Estado</b>', s_th), Paragraph('<b>Detalle</b>', s_th)]]
ints = [
    ['YouTube Data API v3', 'Funcional', 'Proxy completo con 6 acciones: search, channel-stats, channel-videos, video-categories, trending, niche-search. API key almacenada en DB.'],
    ['OpenAI API', 'Pendiente', 'Campo de configuracion en SettingsView. No hay endpoints que la consuman. La IA actual usa z-ai-web-dev-sdk.'],
    ['Stripe API', 'Pendiente', 'Campos de configuracion (secret + publishable key) en SettingsView. No hay logica de pagos ni suscripciones.'],
    ['Google Drive / Cloud Storage', 'Pendiente', 'No hay integracion. No se pueden exportar ni guardar archivos en la nube.'],
    ['TikTok API', 'Pendiente', 'No hay integracion. No se obtienen datos de tendencias de TikTok.'],
    ['Instagram API', 'Pendiente', 'No hay integracion. No se obtienen datos de tendencias de Instagram.'],
    ['RapidAPI', 'Pendiente', 'No hay integracion con ningun endpoint de RapidAPI.'],
    ['Webhooks', 'Pendiente', 'No hay sistema de webhooks ni sincronizacion automatica.'],
    ['Google AI API', 'Pendiente', 'Campo de configuracion (GOOGLE_AI_API_KEY) en SettingsView. No utilizado.'],
]
for row in ints:
    st = row[1]
    int_data.append([
        Paragraph(row[0], s_td),
        Paragraph(f'<b>{st}</b>', s_td_status.get(st, s_td_c)),
        Paragraph(row[2], s_td),
    ])

col_w_int = [CONTENT_W*0.20, CONTENT_W*0.12, CONTENT_W*0.68]
story.extend(make_table(int_data, col_w_int, 'Tabla 10: Integraciones externas'))

# ═══════════════════════════════════════════════════════════════════
# SECTION 10: PROBLEMAS CONOCIDOS Y PENDIENTES
# ═══════════════════════════════════════════════════════════════════
story.extend(add_major_section('10. Problemas Conocidos y Pendientes'))

story.append(p(
    'A continuacion se documentan los bugs actuales, funciones incompletas y mejoras planificadas que '
    'aun no han sido implementadas en NexScope. Esta seccion es critica para entender el estado real '
    'del proyecto y priorizar el trabajo futuro de desarrollo.'
))

story.append(h2('10.1 Bugs Actuales'))

bug_data = [[Paragraph('<b>Bug</b>', s_th), Paragraph('<b>Severidad</b>', s_th), Paragraph('<b>Descripcion</b>', s_th)]]
bugs = [
    ['Autenticacion insegura', 'Alta', 'Las contrasenas se codifican en base64 en lugar de hashearse con bcrypt/argon2. No hay tokens JWT ni sesiones seguras. Cualquier acceso a la DB revela contrasenas.'],
    ['Auth en localStorage', 'Alta', 'El estado de autenticacion se almacena solo en localStorage. Al limpiar el navegador se pierde la sesion. No hay verificacion del lado del servidor en cada request.'],
    ['QuickStart sin persistencia', 'Media', 'El boton "INICIAR" crea un usuario temporal en localStorage que no existe en la base de datos. Los datos guardados se pierden al limpiar el navegador.'],
    ['Crecimiento simulado en canales', 'Media', 'La tasa de crecimiento de canales se calcula con Math.random(), produciendo valores inconsistentes en cada carga.'],
    ['RPM estimado no confiable', 'Media', 'El RPM por nicho se obtiene de un lookup estatico en mock-data.ts, no de datos reales de YouTube.'],
    ['Exportacion no funcional', 'Baja', 'El boton de exportar en ContentPlanView no tiene funcionalidad implementada.'],
    ['Top videos con placeholder', 'Baja', 'En ChannelAnalyzerView, la seccion de top videos muestra texto placeholder en lugar de datos reales.'],
]
for row in bugs:
    bug_data.append([Paragraph(row[0], s_td), Paragraph(row[1], s_td_c), Paragraph(row[2], s_td)])

col_w_bug = [CONTENT_W*0.22, CONTENT_W*0.12, CONTENT_W*0.66]
story.extend(make_table(bug_data, col_w_bug, 'Tabla 11: Bugs actuales del sistema'))

story.append(h2('10.2 Funciones Incompletas'))

inc_data = [[Paragraph('<b>Funcion</b>', s_th), Paragraph('<b>Estado</b>', s_th), Paragraph('<b>Que Falta</b>', s_th)]]
incs = [
    ['Dashboard con datos reales', 'Pendiente', 'Conectar con YouTube API para mostrar estadisticas reales de nichos guardados y canales monitoreados.'],
    ['Tendencias reales', 'Pendiente', 'Integrar YouTube trending endpoint y agregar fuentes como Google Trends o TikTok.'],
    ['Explorador de Keywords', 'Pendiente', 'Conectar con API de keywords reales (YouTube suggestions, Google Ads API, etc.).'],
    ['Matriz de Competencia', 'Pendiente', 'Permitir seleccion de canales reales y calcular metricas desde YouTube Data API.'],
    ['Monetizacion real', 'Pendiente', 'Integrar datos reales de RPM y CPM. Conectar con YouTube Analytics API para canales propios.'],
    ['Persistencia de datos', 'Pendiente', 'Implementar guardado real de nichos, canales y mensajes en la base de datos (modelos Prisma ya existen).'],
    ['Sistema de pagos', 'Pendiente', 'Integrar Stripe para suscripciones Pro. Campos de API key existen pero no hay logica de cobro.'],
    ['Internacionalizacion', 'Pendiente', 'next-intl esta instalado pero no configurado. La UI esta solo en espanol.'],
    ['Autenticacion real', 'Pendiente', 'next-auth esta instalado pero no configurado. Implementar JWT, OAuth (Google), y hash de contrasenas.'],
]
for row in incs:
    inc_data.append([
        Paragraph(row[0], s_td),
        Paragraph('Pendiente', s_td_status['Pendiente']),
        Paragraph(row[2], s_td),
    ])

col_w_inc = [CONTENT_W*0.22, CONTENT_W*0.12, CONTENT_W*0.66]
story.extend(make_table(inc_data, col_w_inc, 'Tabla 12: Funciones incompletas'))

story.append(h2('10.3 Mejoras Planificadas'))

mej_data = [[Paragraph('<b>Mejora</b>', s_th), Paragraph('<b>Prioridad</b>', s_th), Paragraph('<b>Descripcion</b>', s_th)]]
mejs = [
    ['Hashing de contrasenas', 'Alta', 'Implementar bcrypt o argon2 para almacenamiento seguro de contrasenas en la base de datos.'],
    ['JWT + sesiones seguras', 'Alta', 'Reemplazar localStorage por tokens JWT con refresh tokens y verificacion en cada request del servidor.'],
    ['Persistencia en DB', 'Alta', 'Conectar los modelos SavedNiche, SavedChannel, ChatMessage y ContentPlan de Prisma con la UI actual.'],
    ['YouTube Analytics API', 'Media', 'Agregar integracion con YouTube Analytics para metricas reales de canales propios del usuario.'],
    ['Busqueda web con IA', 'Media', 'Utilizar la capacidad de web search del z-ai-web-dev-sdk para tendencias en tiempo real.'],
    ['Generacion de imagenes', 'Media', 'Integrar la capacidad de generacion de imagenes del SDK para thumbnails y assets de canal.'],
    ['Soporte multiidioma', 'Media', 'Configurar next-intl para espanol, ingles y portugues con diccionarios de traduccion.'],
    ['Extension Chrome', 'Baja', 'Crear extension de navegador para analizar nichos directamente desde YouTube.'],
    ['Scraping de TikTok/Instagram', 'Baja', 'Agregar fuentes de datos de tendencias de multiples plataformas sociales.'],
    ['Notificaciones push', 'Baja', 'Sistema de alertas para cambios en nichos monitoreados y nuevas oportunidades.'],
]
for row in mejs:
    mej_data.append([Paragraph(row[0], s_td), Paragraph(row[1], s_td_c), Paragraph(row[2], s_td)])

col_w_mej = [CONTENT_W*0.22, CONTENT_W*0.12, CONTENT_W*0.66]
story.extend(make_table(mej_data, col_w_mej, 'Tabla 13: Mejoras planificadas'))

# ═══════════════════════════════════════════════════════════════════
# SECTION 11: ESTRUCTURA DE ARCHIVOS
# ═══════════════════════════════════════════════════════════════════
story.extend(add_major_section('11. Estructura de Archivos'))

story.append(p(
    'A continuacion se presenta el arbol de directorios completo del proyecto NexScope, excluyendo las '
    'carpetas node_modules, .next y .git que contienen dependencias y artefactos de compilacion. Esta '
    'estructura refleja el estado actual del proyecto con todos los componentes, rutas API, librerias '
    'y archivos de configuracion que han sido creados durante el desarrollo.'
))

# Use a monospace table for the tree
tree_text = """\
.
+-- .env
+-- .gitignore
+-- Caddyfile
+-- components.json
+-- db/
|   +-- custom.db
+-- eslint.config.mjs
+-- next-env.d.ts
+-- next.config.ts
+-- package.json
+-- postcss.config.mjs
+-- prisma/
|   +-- schema.prisma
+-- public/
|   +-- logo.svg
|   +-- robots.txt
+-- src/
|   +-- app/
|   |   +-- api/
|   |   |   +-- route.ts (health check)
|   |   |   +-- auth/
|   |   |   |   +-- login/route.ts
|   |   |   |   +-- me/route.ts
|   |   |   |   +-- register/route.ts
|   |   |   +-- chat/route.ts
|   |   |   +-- content-gaps/route.ts
|   |   |   +-- content-plan/route.ts
|   |   |   +-- settings/route.ts
|   |   |   +-- youtube/route.ts
|   |   +-- globals.css
|   |   +-- layout.tsx
|   |   +-- page.tsx
|   +-- components/
|   |   +-- ApiKeyStatus.tsx
|   |   +-- AppSidebar.tsx
|   |   +-- ErrorBoundary.tsx
|   |   +-- LandingPage.tsx
|   |   +-- ThemeToggle.tsx
|   |   +-- auth/
|   |   |   +-- LoginModal.tsx
|   |   |   +-- RegisterModal.tsx
|   |   +-- shared/
|   |   |   +-- ChannelCard.tsx
|   |   |   +-- NicheCard.tsx
|   |   |   +-- ScoreIndicator.tsx
|   |   |   +-- StatCard.tsx
|   |   |   +-- TrendSparkline.tsx
|   |   +-- ui/ (44 componentes shadcn/ui)
|   |   +-- views/
|   |       +-- AIChatView.tsx
|   |       +-- ChannelAnalyzerView.tsx
|   |       +-- CompetitorMatrixView.tsx
|   |       +-- ContentGapView.tsx
|   |       +-- ContentPlanView.tsx
|   |       +-- DashboardView.tsx
|   |       +-- KeywordExplorerView.tsx
|   |       +-- MonetizationView.tsx
|   |       +-- NicheFinderView.tsx
|   |       +-- SettingsView.tsx
|   |       +-- TrendsView.tsx
|   +-- hooks/
|   |   +-- use-mobile.ts
|   |   +-- use-toast.ts
|   |   +-- use-youtube-api.ts
|   +-- lib/
|       +-- db.ts
|       +-- mock-data.ts
|       +-- store.ts
|       +-- types.ts
|       +-- utils.ts
+-- start-server.sh
+-- tailwind.config.ts
+-- tsconfig.json"""

s_tree = ParagraphStyle('STree', fontName='DejaVuSans', fontSize=7.5, leading=11,
    alignment=TA_LEFT, textColor=TEXT_PRIMARY, wordWrap='CJK')

# Split tree into lines and format
tree_lines = tree_text.strip().split('\n')
tree_formatted = '<br/>'.join(tree_lines)
story.append(Spacer(1, 6))

# Use a table with code-like styling for the tree
tree_para = Paragraph(tree_formatted.replace(' ', '&nbsp;').replace('<', '&lt;').replace('>', '&gt;'), s_tree)
tree_table = Table([[tree_para]], colWidths=[CONTENT_W*0.95], hAlign='CENTER')
tree_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f5f5f3')),
    ('BOX', (0, 0), (-1, -1), 0.5, BORDER),
    ('LEFTPADDING', (0, 0), (-1, -1), 12),
    ('RIGHTPADDING', (0, 0), (-1, -1), 12),
    ('TOPPADDING', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
]))
story.append(tree_table)
story.append(Spacer(1, 6))
story.append(Paragraph('Estructura de directorios del proyecto NexScope (sin node_modules, .next, .git)', s_caption))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# BUILD
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
doc.multiBuild(story)

print(f"Body PDF generated: {body_path}")
