'use client';

import { useState } from 'react';
import { useAIStatus } from '@/hooks/use-ai-status';
import { AIModeBanner } from '@/components/shared/AIModeBanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { DollarSign, Calculator, BarChart3, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MonetizationData {
  rpm: number;
  cpm: number;
  monthlyRevenue: number;
  annualRevenue: number;
  rpmByNiche: { niche: string; rpm: number }[];
  revenueBreakdown: { name: string; value: number; color: string }[];
}

export function MonetizationView() {
  const [niche, setNiche] = useState('');
  const [subscribers, setSubscribers] = useState([50000]);
  const [viewsPerMonth, setViewsPerMonth] = useState([200000]);
  const [data, setData] = useState<MonetizationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { status: aiStatus, check: recheckAI } = useAIStatus();

  const handleCalculate = async () => {
    const safeNiche = niche.trim();
    if (!safeNiche) return;
    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await fetch('/api/monetization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: safeNiche, subscribers: subscribers[0], viewsPerMonth: viewsPerMonth[0] }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d?.error || 'Error al calcular.');
        return;
      }
      setData(d);
    } catch (err: any) {
      setError(err?.message || 'Error de red.');
    } finally {
      setLoading(false);
    }
  };

  const rpmData = data?.rpmByNiche
    ? [...data.rpmByNiche].sort((a, b) => b.rpm - a.rpm).map(r => ({ ...r, niche: r.niche.length > 14 ? r.niche.substring(0, 14) + '...' : r.niche }))
    : [];

  const customRevenueBreakdown = data?.revenueBreakdown
    ? data.revenueBreakdown.map(item => ({
        ...item,
        value: Math.round((data.monthlyRevenue || 0) * item.value / 100),
      }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Estimador de Monetización</h2>
        <p className="text-muted-foreground text-sm">Calcula los ingresos potenciales de tu canal con IA</p>
      </div>

      <AIModeBanner available={aiStatus.available} loading={aiStatus.loading} error={aiStatus.error} onRetry={recheckAI} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Calculadora de Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Nicho</label>
                <Input
                  placeholder="Ej: Finanzas Personales"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Suscriptores: {(subscribers[0] / 1000).toFixed(0)}K
                </label>
                <Slider value={subscribers} onValueChange={setSubscribers} min={1000} max={10000000} step={1000} className="mt-3" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Vistas/mes: {(viewsPerMonth[0] / 1000).toFixed(0)}K
                </label>
                <Slider value={viewsPerMonth} onValueChange={setViewsPerMonth} min={10000} max={50000000} step={10000} className="mt-3" />
              </div>
            </div>
            <Button onClick={handleCalculate} disabled={loading || !niche.trim()}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DollarSign className="w-4 h-4 mr-2" />}
              Calcular con IA
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {error && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Error</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
              <Button variant="outline" size="sm" className="text-xs h-7 mt-2" onClick={handleCalculate}>Reintentar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'RPM', value: `$${data.rpm.toFixed(2)}`, color: 'text-emerald-500' },
              { label: 'CPM', value: `$${data.cpm.toFixed(2)}`, color: 'text-amber-500' },
              { label: 'Ingreso Mensual', value: `$${data.monthlyRevenue.toLocaleString('es', { maximumFractionDigits: 0 })}`, color: 'text-primary' },
              { label: 'Ingreso Anual', value: `$${data.annualRevenue.toLocaleString('es', { maximumFractionDigits: 0 })}`, color: 'text-violet-500' },
            ].map((m) => (
              <div key={m.label} className="text-center p-4 rounded-xl bg-muted/30 border border-border/50">
                <p className={cn('text-lg font-bold', m.color)}>{m.value}</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Desglose de Ingresos</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={customRevenueBreakdown} cx="50%" cy="50%" outerRadius={100} innerRadius={50} dataKey="value"
                      label={({ name, value }) => `${name}: $${value.toLocaleString()}`} labelLine={{ strokeWidth: 1 }}>
                      {customRevenueBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> RPM por Nicho (Top 10)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rpmData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="niche" type="category" tick={{ fontSize: 10 }} width={90} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} formatter={(v: number) => [`$${v.toFixed(2)}`, 'RPM']} />
                    <Bar dataKey="rpm" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!data && !loading && !error && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Escribe un nicho y pulsa "Calcular con IA" para ver la estimación</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
