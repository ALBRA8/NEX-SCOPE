'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExportToAutomationButton } from '@/components/shared/ExportToAutomationButton';
import { AIModeBanner } from '@/components/shared/AIModeBanner';
import { useToast } from '@/hooks/use-toast';
import {
  Target,
  DollarSign,
  Flame,
  Zap,
  TrendingUp,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Layers,
  Filter,
  ArrowUpRight,
  Loader2,
  CheckCircle2,
  ShoppingBag
} from 'lucide-react';
import { motion } from 'framer-motion';

export interface AffiliateOffer {
  id: string;
  title: string;
  network: 'JVZoo' | 'ClickBank' | 'Hotmart' | 'Digistore24';
  niche: string;
  price: string;
  payout_avg: string;
  commission_pct: number;
  gravity_score: number;
  units_sold: number;
  epc: string;
  vendor: string;
  affiliate_page_url: string;
  sales_page_url: string;
  target_rpm: number;
  hook: string;
  angles: string[];
  product_summary: string;
}

export function AffiliateOffersView() {
  const { toast } = useToast();
  const [offers, setOffers] = useState<AffiliateOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [network, setNetwork] = useState('all');
  const [niche, setNiche] = useState('all');
  const [sort, setSort] = useState('gravity');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeAngleTab, setActiveAngleTab] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({ avg_gravity: '0', avg_commission: '0%', max_payout: '$0' });

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        network,
        niche,
        sort,
        search,
      });
      const res = await fetch(`/api/affiliate-offers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOffers(data.offers || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error('Error fetching affiliate offers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOffers();
  }, [network, niche, sort]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOffers();
  };

  const copyToClipboard = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: `${label} copiado`,
      description: 'Listo para pegar en tu campaña o navegador.',
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getNetworkBadge = (net: string) => {
    switch (net.toLowerCase()) {
      case 'jvzoo':
        return <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30">JVZoo Marketplace</Badge>;
      case 'clickbank':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">ClickBank</Badge>;
      case 'hotmart':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Hotmart</Badge>;
      default:
        return <Badge variant="outline">{net}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-1 sm:p-2">
      <AIModeBanner available={false} loading={false} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-red-600 rounded-lg text-white shadow-md shadow-amber-500/10">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Radar de Ofertas de Afiliados (Top Affiliate Scout)
              </h1>
              <p className="text-xs text-muted-foreground">
                Monitorea ofertas ganadoras con alta gravedad en JVZoo, ClickBank y Hotmart. Listo para enviar a YouTube Automation en 1 clic.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOffers}
            disabled={loading}
            className="text-xs gap-1.5"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
            Refrescar Radar
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-neutral-900/60 border-neutral-800">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Ofertas Monitoreadas</span>
              <ShoppingBag className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl font-bold text-white">{offers.length}</div>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3" /> Verificadas con enlaces directos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900/60 border-neutral-800">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Gravedad Promedio</span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-amber-400">{stats.avg_gravity}</div>
            <p className="text-[10px] text-neutral-400 mt-0.5">Volumen alto de afiliados cobrando</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900/60 border-neutral-800">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Comisión Promedio</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400">{stats.avg_commission}</div>
            <p className="text-[10px] text-neutral-400 mt-0.5">Reparto 50% - 75% directo al creador</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900/60 border-neutral-800">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Payout Máximo / Embudo</span>
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-purple-400">{stats.max_payout}</div>
            <p className="text-[10px] text-neutral-400 mt-0.5">Incluye upsells & recurrentes (OTOs)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-neutral-900/40 border-neutral-800">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <Tabs value={network} onValueChange={setNetwork} className="w-full md:w-auto">
              <TabsList className="bg-neutral-950 border border-neutral-800">
                <TabsTrigger value="all" className="text-xs">Todas las Redes</TabsTrigger>
                <TabsTrigger value="jvzoo" className="text-xs">JVZoo</TabsTrigger>
                <TabsTrigger value="clickbank" className="text-xs">ClickBank</TabsTrigger>
                <TabsTrigger value="hotmart" className="text-xs">Hotmart</TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-80">
              <Input
                placeholder="Buscar por software, nicho o palabra..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 text-xs bg-neutral-950 border-neutral-800"
              />
              <Button type="submit" size="sm" variant="secondary" className="h-8 text-xs">
                Buscar
              </Button>
            </form>
          </div>

          <div className="flex flex-wrap gap-3 items-center pt-2 border-t border-neutral-800/60 text-xs">
            <div className="flex items-center gap-1.5 text-neutral-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Nicho:</span>
            </div>
            <Select value={niche} onValueChange={setNiche}>
              <SelectTrigger className="w-[180px] h-7 text-xs bg-neutral-950 border-neutral-800">
                <SelectValue placeholder="Nicho" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                <SelectItem value="all">Todos los Nichos</SelectItem>
                <SelectItem value="AI & Software">AI & Software</SelectItem>
                <SelectItem value="E-Commerce & Marketing">E-Commerce & Marketing</SelectItem>
                <SelectItem value="Desarrollo Personal">Desarrollo Personal</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1.5 text-neutral-400 ml-auto">
              <span>Ordenar por:</span>
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[160px] h-7 text-xs bg-neutral-950 border-neutral-800">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                <SelectItem value="gravity">Mayor Gravedad</SelectItem>
                <SelectItem value="payout">Mayor Payout</SelectItem>
                <SelectItem value="commission">Mayor % Comisión</SelectItem>
                <SelectItem value="sales">Más Vendidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Offers Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <span className="ml-2 text-sm text-neutral-400">Escaneando red de afiliados...</span>
        </div>
      ) : offers.length === 0 ? (
        <Card className="bg-neutral-900/30 border-neutral-800 text-center py-12">
          <CardContent className="space-y-2">
            <ShoppingBag className="w-10 h-10 text-neutral-600 mx-auto" />
            <p className="text-sm font-semibold text-neutral-300">No se encontraron ofertas con estos filtros</p>
            <p className="text-xs text-neutral-500">Prueba cambiando la red o limpiando el término de búsqueda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {offers.map((offer, idx) => {
            const currentAngleIdx = activeAngleTab[offer.id] || 0;
            return (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.04 }}
              >
                <Card className="bg-neutral-900/80 border-neutral-800 hover:border-neutral-700 transition-colors flex flex-col justify-between h-full">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {getNetworkBadge(offer.network)}
                          <Badge variant="outline" className="text-[10px] text-neutral-400 border-neutral-800">
                            {offer.niche}
                          </Badge>
                          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] gap-1">
                            <Flame className="w-3 h-3" /> Gravedad: {offer.gravity_score}
                          </Badge>
                        </div>
                        <CardTitle className="text-base font-bold text-white leading-snug">
                          {offer.title}
                        </CardTitle>
                        <CardDescription className="text-xs text-neutral-400 line-clamp-2">
                          {offer.product_summary}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 space-y-3 flex-1 flex flex-col justify-between">
                    {/* Financial Metrics Strip */}
                    <div className="grid grid-cols-4 gap-2 p-2.5 rounded-lg bg-neutral-950/70 border border-neutral-800/80 text-center">
                      <div>
                        <div className="text-[10px] text-neutral-500 uppercase">Precio Base</div>
                        <div className="text-xs font-bold text-neutral-200">{offer.price}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-neutral-500 uppercase">Comisión</div>
                        <div className="text-xs font-bold text-emerald-400">{offer.commission_pct}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-neutral-500 uppercase">Payout Prom.</div>
                        <div className="text-xs font-bold text-purple-400">{offer.payout_avg}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-neutral-500 uppercase">EPC Est.</div>
                        <div className="text-xs font-bold text-amber-400">{offer.epc}</div>
                      </div>
                    </div>

                    {/* Viral Hook Box */}
                    <div className="p-2.5 rounded-lg bg-neutral-950 border border-amber-500/20 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-amber-400">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Gancho Viral para Video Review (0-5s):
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-[10px] text-neutral-400 hover:text-white"
                          onClick={() => copyToClipboard(offer.hook, `hook-${offer.id}`, 'Gancho')}
                        >
                          {copiedId === `hook-${offer.id}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs italic text-neutral-300">
                        &ldquo;{offer.hook}&rdquo;
                      </p>
                    </div>

                    {/* Angle Selector */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] uppercase font-bold text-neutral-400 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-sky-400" /> Ángulos de Producción:
                        </span>
                        <span className="text-neutral-500">Ángulo {currentAngleIdx + 1} de {offer.angles.length}</span>
                      </div>
                      <div className="flex gap-1.5">
                        {offer.angles.map((ang, aIdx) => (
                          <Button
                            key={aIdx}
                            variant={currentAngleIdx === aIdx ? 'default' : 'secondary'}
                            size="sm"
                            className={`h-6 text-[10px] px-2 flex-1 justify-start truncate ${
                              currentAngleIdx === aIdx
                                ? 'bg-sky-600 text-white font-medium'
                                : 'bg-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                            onClick={() =>
                              setActiveAngleTab((prev) => ({ ...prev, [offer.id]: aIdx }))
                            }
                          >
                            {aIdx + 1}. {ang}
                          </Button>
                        ))}
                      </div>
                      <p className="text-xs text-neutral-300 bg-neutral-950 p-2 rounded border border-neutral-800/80">
                        🎯 {offer.angles[currentAngleIdx]}
                      </p>
                    </div>

                    {/* Action Buttons & 1-Click Export to Automation */}
                    <div className="pt-2 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] gap-1 bg-neutral-950 border-neutral-800 text-neutral-300 hover:text-white"
                          onClick={() => window.open(offer.affiliate_page_url, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3" /> Carta / Ficha
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[11px] gap-1 text-neutral-400 hover:text-white"
                          onClick={() => copyToClipboard(offer.affiliate_page_url, `url-${offer.id}`, 'Link de Afiliado')}
                        >
                          {copiedId === `url-${offer.id}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          Copiar Link
                        </Button>
                      </div>

                      <ExportToAutomationButton
                        buttonSize="sm"
                        label="🚀 Enviar a Fábrica de Video"
                        payload={{
                          title: `Review Honesto: ${offer.title}`,
                          hook: offer.hook,
                          idea_summary: `Análisis y demostración de producto de afiliado en nicho ${offer.niche}. Ángulo clave: ${offer.angles[currentAngleIdx]}. Payout promedio: ${offer.payout_avg}.`,
                          target_rpm: offer.target_rpm,
                          reference_url: offer.affiliate_page_url,
                          recommended_mode: 'idea',
                          target_format: 'long',
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
