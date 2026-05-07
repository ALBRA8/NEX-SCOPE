'use client';

import { useState } from 'react';
import { niches, rpmByNiche } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { DollarSign, TrendingUp, Calculator, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const revenueBreakdown = [
  { name: 'Anuncios', value: 45, color: '#10b981' },
  { name: 'Patrocinios', value: 30, color: '#f59e0b' },
  { name: 'Afiliados', value: 15, color: '#8b5cf6' },
  { name: 'Membresías', value: 10, color: '#06b6d4' },
];

export function MonetizationView() {
  const [selectedNiche, setSelectedNiche] = useState(niches[0]);
  const [subscribers, setSubscribers] = useState([50000]);
  const [viewsPerMonth, setViewsPerMonth] = useState([200000]);

  const rpm = selectedNiche.estimatedRPM;
  const monthlyRevenue = (viewsPerMonth[0] / 1000) * rpm;
  const annualRevenue = monthlyRevenue * 12;
  const cpm = rpm * 0.55;

  const rpmData = rpmByNiche
    .sort((a, b) => b.rpm - a.rpm)
    .map(r => ({ ...r, niche: r.niche.length > 14 ? r.niche.substring(0, 14) + '...' : r.niche }));

  const customRevenueBreakdown = revenueBreakdown.map(item => ({
    ...item,
    value: Math.round(monthlyRevenue * item.value / 100),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Estimador de Monetización</h2>
        <p className="text-muted-foreground text-sm">Calcula los ingresos potenciales de tu canal</p>
      </div>

      {/* Calculator */}
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
                <Select
                  value={selectedNiche.id}
                  onValueChange={(v) => {
                    const n = niches.find(n => n.id === v);
                    if (n) setSelectedNiche(n);
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {niches.map(n => (
                      <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            {/* Results */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'RPM', value: `$${rpm.toFixed(2)}`, color: 'text-emerald-500' },
                { label: 'CPM', value: `$${cpm.toFixed(2)}`, color: 'text-amber-500' },
                { label: 'Ingreso Mensual', value: `$${monthlyRevenue.toLocaleString('es', { maximumFractionDigits: 0 })}`, color: 'text-primary' },
                { label: 'Ingreso Anual', value: `$${annualRevenue.toLocaleString('es', { maximumFractionDigits: 0 })}`, color: 'text-violet-500' },
              ].map((m, i) => (
                <div key={m.label} className="text-center p-4 rounded-xl bg-muted/30 border border-border/50">
                  <p className={cn('text-lg font-bold', m.color)}>{m.value}</p>
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Desglose de Ingresos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={customRevenueBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    dataKey="value"
                    label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {customRevenueBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                RPM por Nicho (Top 10)
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
        </motion.div>
      </div>
    </div>
  );
}
