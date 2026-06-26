'use client';

import { useState, useRef, useSyncExternalStore } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LoginModal } from '@/components/auth/LoginModal';
import { RegisterModal } from '@/components/auth/RegisterModal';
import { useAppStore } from '@/lib/store';

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
import {
  Radar,
  Search,
  TrendingUp,
  Puzzle,
  DollarSign,
  Bot,
  CalendarDays,
  ArrowRight,
  Check,
  Star,
  Sparkles,
  BarChart3,
  Zap,
  Globe,
  Users,
  ChevronRight,
  Play,
} from 'lucide-react';

function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function FloatingBadge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className={`absolute px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="relative mx-auto mt-12 max-w-5xl"
    >
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-2xl blur-3xl" />

      {/* Dashboard card */}
      <div className="relative rounded-xl border border-white/10 bg-gray-950/80 backdrop-blur-xl p-6 shadow-2xl">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <div className="flex-1 h-7 rounded-md bg-white/5 flex items-center px-3">
            <span className="text-[10px] text-gray-500">nexscope.app/dashboard</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Nichos Analizados', value: '12,847', change: '+23%', icon: Search },
            { label: 'Oportunidades', value: '384', change: '+12%', icon: TrendingUp },
            { label: 'RPM Promedio', value: '$14.50', change: '+8%', icon: DollarSign },
            { label: 'Tendencias', value: '56', change: '+31%', icon: Zap },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + i * 0.1, duration: 0.5 }}
              className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-medium">{stat.change}</span>
              </div>
              <p className="text-lg font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-gray-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Chart placeholder */}
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium text-gray-400">Tendencias de Nichos</p>
            <div className="flex gap-2">
              <span className="text-[10px] text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10">7D</span>
              <span className="text-[10px] text-gray-500 px-2 py-0.5 rounded-full bg-white/5">30D</span>
              <span className="text-[10px] text-gray-500 px-2 py-0.5 rounded-full bg-white/5">90D</span>
            </div>
          </div>
          <div className="flex items-end gap-1.5 h-24">
            {[40, 55, 35, 65, 50, 75, 60, 85, 70, 90, 80, 95].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: 1.3 + i * 0.05, duration: 0.6, ease: 'easeOut' }}
                className="flex-1 rounded-sm bg-gradient-to-t from-emerald-500 to-emerald-400/60 min-w-0"
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const features = [
  {
    icon: Search,
    title: 'Buscador de Nichos IA',
    description: 'Encuentra nichos rentables con puntuaciones de oportunidad basadas en datos reales',
    color: 'emerald',
    span: 'col-span-1 sm:col-span-2',
    visual: 'chart',
  },
  {
    icon: TrendingUp,
    title: 'Detector de Tendencias',
    description: 'Identifica nichos en crecimiento antes de que se saturan',
    color: 'cyan',
    span: 'col-span-1',
    visual: 'trend',
  },
  {
    icon: Puzzle,
    title: 'Brechas de Contenido',
    description: 'Descubre temas sin cubrir que tu audiencia está buscando',
    color: 'violet',
    span: 'col-span-1',
    visual: 'gap',
  },
  {
    icon: DollarSign,
    title: 'Estimador de Monetización',
    description: 'Calcula ingresos potenciales con datos de RPM y CPM por nicho',
    color: 'amber',
    span: 'col-span-1 sm:col-span-2',
    visual: 'money',
  },
  {
    icon: Bot,
    title: 'Asistente IA',
    description: 'Pregunta en lenguaje natural y obtén respuestas expertas sobre nichos',
    color: 'rose',
    span: 'col-span-1',
    visual: 'ai',
  },
  {
    icon: CalendarDays,
    title: 'Plan de Contenido',
    description: 'Genera un plan de 30 videos personalizado para tu nicho',
    color: 'sky',
    span: 'col-span-1',
    visual: 'plan',
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'from-emerald-500/20' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', glow: 'from-cyan-500/20' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', glow: 'from-violet-500/20' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', glow: 'from-amber-500/20' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', glow: 'from-rose-500/20' },
  sky: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20', glow: 'from-sky-500/20' },
};

function MiniVisual({ type }: { type: string }) {
  switch (type) {
    case 'chart':
      return (
        <div className="flex items-end gap-1 h-8 mt-3">
          {[30, 50, 40, 70, 60, 80, 75, 90].map((h, i) => (
            <div key={i} className="flex-1 rounded-sm bg-emerald-500/40 min-w-0" style={{ height: `${h}%` }} />
          ))}
        </div>
      );
    case 'trend':
      return (
        <div className="flex items-center gap-1 mt-3">
          <svg className="w-full h-8" viewBox="0 0 100 30" fill="none">
            <path d="M0 25 Q 25 20, 30 15 T 60 10 T 100 5" stroke="rgb(34 211 238 / 0.6)" strokeWidth="2" fill="none" />
            <path d="M0 25 Q 25 20, 30 15 T 60 10 T 100 5 V 30 H 0 Z" fill="rgb(34 211 238 / 0.1)" />
          </svg>
        </div>
      );
    case 'gap':
      return (
        <div className="flex gap-1 mt-3">
          <div className="w-8 h-8 rounded bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-[8px] text-violet-400">✓</div>
          <div className="w-8 h-8 rounded bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-[8px] text-violet-400">✓</div>
          <div className="w-8 h-8 rounded bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-[8px] text-gray-600">?</div>
          <div className="w-8 h-8 rounded bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-[8px] text-gray-600">?</div>
        </div>
      );
    case 'money':
      return (
        <div className="flex items-baseline gap-3 mt-3">
          <span className="text-2xl font-bold text-amber-400">$14.50</span>
          <span className="text-xs text-amber-400/60">RPM</span>
          <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-amber-500 to-amber-400" />
          </div>
        </div>
      );
    case 'ai':
      return (
        <div className="mt-3 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-rose-400" />
          </div>
          <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: '85%' }}
              transition={{ delay: 0.5, duration: 1 }}
              className="h-full rounded-full bg-gradient-to-r from-rose-500 to-rose-400"
            />
          </div>
        </div>
      );
    case 'plan':
      return (
        <div className="mt-3 grid grid-cols-5 gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-2 rounded-sm bg-sky-500/30" style={{ opacity: 0.4 + (i / 10) * 0.6 }} />
          ))}
        </div>
      );
    default:
      return null;
  }
}

const steps = [
  {
    number: '01',
    title: 'Elige tu área de interés',
    description: 'Selecciona una categoría o escribe tu idea',
    icon: Search,
  },
  {
    number: '02',
    title: 'La IA analiza el mercado',
    description: 'Nuestro algoritmo escanea YouTube completo',
    icon: Bot,
  },
  {
    number: '03',
    title: 'Recibe oportunidades reales',
    description: 'Nichos rentables, brechas de contenido y planes de acción',
    icon: Sparkles,
  },
];

const testimonials = [
  {
    quote: 'Encontré un nicho con RPM de $18.50 que no sabía que existía. En 3 meses mi canal ya monetiza.',
    name: 'Carlos M.',
    niche: 'Canal de Finanzas',
    initials: 'CM',
  },
  {
    quote: 'El Content Gap Finder es increíble. Encontré temas que nadie cubría y mi primer video tuvo 50K views.',
    name: 'Laura P.',
    niche: 'Canal de Tecnología',
    initials: 'LP',
  },
  {
    quote: 'Dejé de perder tiempo investigando nichos manualmente. NexScope lo hace en segundos.',
    name: 'Diego R.',
    niche: 'Canal de Gaming',
    initials: 'DR',
  },
];

export function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [quickStartLoading, setQuickStartLoading] = useState(false);
  const quickStart = useAppStore((s) => s.quickStart);
  const mounted = useMounted();

  const handleQuickStart = async () => {
    if (quickStartLoading) return;
    setQuickStartLoading(true);
    try {
      await quickStart();
    } catch (err) {
      console.error('Quick start failed:', err);
    } finally {
      setQuickStartLoading(false);
    }
  };

  const switchToRegister = () => {
    setShowLogin(false);
    setTimeout(() => setShowRegister(true), 200);
  };

  const switchToLogin = () => {
    setShowRegister(false);
    setTimeout(() => setShowLogin(true), 200);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Navbar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500 text-white">
                  <Radar className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg">NexScope</span>
              </div>
              <div className="hidden md:flex items-center gap-6">
                <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Funcionalidades</a>
                <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Precios</a>
                <a href="#testimonials" className="text-sm text-gray-400 hover:text-white transition-colors">Testimonios</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white hover:bg-white/5"
                onClick={() => setShowLogin(true)}
              >
                Iniciar Sesión
              </Button>
              <Button
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium"
                onClick={() => setShowRegister(true)}
              >
                Comenzar Gratis
              </Button>
              <Button
                className="bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20"
                onClick={handleQuickStart}
                disabled={quickStartLoading}
              >
                {quickStartLoading ? 'Cargando...' : 'INICIAR'}
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 sm:pt-32 sm:pb-24">
        {/* Background gradients */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-medium mb-8">
                <Sparkles className="w-3 h-3" />
                Potenciado por Inteligencia Artificial
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
            >
              Descubre los nichos más{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                rentables
              </span>{' '}
              de YouTube antes que nadie
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
            >
              Potenciado por inteligencia artificial, NexScope analiza millones de datos para encontrar oportunidades ocultas que otros creadores no ven.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base px-8 h-12 rounded-xl group"
                onClick={() => setShowRegister(true)}
              >
                Comenzar Gratis
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                className="bg-white/10 hover:bg-white/20 text-white font-semibold text-base px-8 h-12 rounded-xl border border-white/20"
                onClick={handleQuickStart}
                disabled={quickStartLoading}
              >
                {quickStartLoading ? 'Cargando...' : 'INICIAR'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/10 hover:bg-white/5 text-white font-medium text-base px-8 h-12 rounded-xl group"
              >
                <Play className="w-4 h-4 mr-2" />
                Ver Demo
              </Button>
            </motion.div>

            {/* Floating badges */}
            <div className="relative mt-8 hidden sm:block">
              <FloatingBadge className="left-[10%] top-0 animate-bounce" style={{ animationDuration: '3s' }}>
                <Zap className="w-3 h-3 mr-1 inline" />
                +10,000 nichos analizados
              </FloatingBadge>
              <FloatingBadge className="right-[10%] top-4 animate-bounce" style={{ animationDuration: '3.5s' }}>
                <Bot className="w-3 h-3 mr-1 inline" />
                IA de última generación
              </FloatingBadge>
              <FloatingBadge className="left-[30%] -top-2 animate-bounce" style={{ animationDuration: '4s' }}>
                <TrendingUp className="w-3 h-3 mr-1 inline" />
                Actualización en tiempo real
              </FloatingBadge>
            </div>
          </div>

          {/* Dashboard Mockup */}
          <DashboardMockup />
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="relative py-16 border-y border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <p className="text-center text-sm text-gray-500 mb-8">
              Usado por creadores en 41+ países
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
              {/* Avatar row */}
              <div className="flex -space-x-2">
                {['🇪🇸', '🇲🇽', '🇦🇷', '🇨🇴', '🇨🇱', '🇵🇪', '🇪🇨'].map((flag, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-[#0a0a0a] bg-gray-800 flex items-center justify-center text-sm"
                  >
                    {flag}
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-[#0a0a0a] bg-emerald-500/20 flex items-center justify-center text-[10px] text-emerald-400 font-medium">
                  +34
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8 sm:gap-12">
                {[
                  { value: '10K+', label: 'creadores' },
                  { value: '500K+', label: 'nichos analizados' },
                  { value: '95%', label: 'satisfacción' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Todo lo que necesitas para{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                dominar YouTube
              </span>
            </h2>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              Herramientas potenciadas por IA para cada etapa de tu estrategia de contenido
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {features.map((feature, i) => {
              const colors = colorMap[feature.color];
              return (
                <AnimatedSection key={feature.title} className={feature.span} delay={i * 0.1}>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className={`relative group h-full rounded-2xl border border-white/5 bg-white/[0.02] p-6 overflow-hidden transition-colors hover:border-emerald-500/20`}
                  >
                    {/* Glow on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${colors.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                    <div className="relative z-10">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${colors.bg} ${colors.text} mb-4`}>
                        <feature.icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                      <MiniVisual type={feature.visual} />
                    </div>
                  </motion.div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.02] to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Cómo funciona
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Tres pasos para encontrar tu nicho perfecto
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-emerald-500/20 via-emerald-500/40 to-emerald-500/20" />

            {steps.map((step, i) => (
              <AnimatedSection key={step.number} delay={i * 0.15}>
                <div className="text-center relative">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-6 relative z-10">
                    <step.icon className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div className="text-xs text-emerald-400 font-mono mb-2">{step.number}</div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-400">{step.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Precios simples,{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                sin sorpresas
              </span>
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Comienza gratis y escala cuando estés listo
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free plan */}
            <AnimatedSection delay={0.1}>
              <motion.div
                whileHover={{ y: -4 }}
                className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-8 h-full"
              >
                <h3 className="text-xl font-semibold mb-1">Gratis</h3>
                <p className="text-sm text-gray-400 mb-6">Para explorar y comenzar</p>
                <div className="mb-6">
                  <span className="text-5xl font-bold">$0</span>
                  <span className="text-gray-500 ml-1">/mes</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    '5 búsquedas de nichos al día',
                    'Tendencias básicas',
                    'Asistente IA (limitado)',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="w-full border-white/10 hover:bg-white/5 text-white h-11 rounded-xl"
                  onClick={() => setShowRegister(true)}
                >
                  Comenzar Gratis
                </Button>
              </motion.div>
            </AnimatedSection>

            {/* Pro plan */}
            <AnimatedSection delay={0.2}>
              <motion.div
                whileHover={{ y: -4 }}
                className="relative rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.03] p-8 h-full"
              >
                {/* Popular badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-semibold">
                    ⭐ Más Popular
                  </span>
                </div>

                <h3 className="text-xl font-semibold mb-1">Pro</h3>
                <p className="text-sm text-gray-400 mb-6">Para creadores serios</p>
                <div className="mb-2">
                  <span className="text-5xl font-bold">$10</span>
                  <span className="text-gray-500 ml-1">/mes</span>
                </div>
                <p className="text-xs text-emerald-400 mb-6">o $99/año (ahorra 17%)</p>
                <ul className="space-y-3 mb-8">
                  {[
                    'Búsquedas ilimitadas',
                    'Brechas de contenido con IA',
                    'Plan de contenido personalizado',
                    'Estimador de monetización',
                    'Matriz de competencia',
                    'Asistente IA sin límites',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-11 rounded-xl font-semibold"
                  onClick={() => setShowRegister(true)}
                >
                  Comenzar Prueba Gratis
                </Button>
              </motion.div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.02] to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Lo que dicen los{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                creadores
              </span>
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <AnimatedSection key={t.name} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 h-full"
                >
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                    ))}
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm font-medium text-emerald-400">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.niche}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="relative rounded-3xl overflow-hidden">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500" />
              {/* Pattern overlay */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '40px 40px',
              }} />

              <div className="relative text-center py-16 sm:py-20 px-6">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                  Empieza a encontrar nichos rentables hoy
                </h2>
                <p className="text-lg text-emerald-100/80 mb-8">
                  No necesitas tarjeta de crédito
                </p>
                <Button
                  size="lg"
                  className="bg-white text-emerald-700 hover:bg-gray-100 font-semibold text-base px-8 h-12 rounded-xl group"
                  onClick={() => setShowRegister(true)}
                >
                  Comenzar Gratis
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500 text-white">
                  <Radar className="w-5 h-5" />
                </div>
                <span className="font-bold text-lg">NexScope</span>
              </div>
              <p className="text-sm text-gray-500">
                Encuentra nichos rentables de YouTube con IA
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Producto</h4>
              <ul className="space-y-2">
                {['Funcionalidades', 'Precios', 'Demo'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2">
                {['Acerca de', 'Blog', 'Contacto'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                {['Privacidad', 'Términos'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-xs text-gray-600">
              © 2026 NexScope. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modals */}
      <AnimatePresence>
        {showLogin && (
          <LoginModal
            onClose={() => setShowLogin(false)}
            onSwitchToRegister={switchToRegister}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showRegister && (
          <RegisterModal
            onClose={() => setShowRegister(false)}
            onSwitchToLogin={switchToLogin}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
