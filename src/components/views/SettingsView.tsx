'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  KeyRound,
  Youtube,
  Brain,
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Save,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { motion } from 'framer-motion';

interface ApiKeySetting {
  id: string;
  key: string;
  value: string;
  hasValue: boolean;
  category: string;
  updatedAt: string;
}

interface ApiKeyConfig {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  docsUrl: string;
  placeholder: string;
}

const apiKeyConfigs: ApiKeyConfig[] = [
  {
    key: 'YOUTUBE_API_KEY',
    label: 'YouTube Data API',
    description: 'Acceso a datos de YouTube: búsqueda de nichos, estadísticas de canales, tendencias y más. Es la API principal de NexScope.',
    icon: Youtube,
    color: 'red',
    docsUrl: 'https://console.cloud.google.com/apis/credentials',
    placeholder: 'AIzaSy...',
  },
  {
    key: 'OPENAI_API_KEY',
    label: 'OpenAI API',
    description: 'Para el asistente IA avanzado y generación de contenido con GPT-4. Opcional — la app usa un modelo alternativo por defecto.',
    icon: Brain,
    color: 'emerald',
    docsUrl: 'https://platform.openai.com/api-keys',
    placeholder: 'sk-...',
  },
  {
    key: 'STRIPE_SECRET_KEY',
    label: 'Stripe (Modo Prueba)',
    description: 'Clave secreta de Stripe para procesar pagos de suscripciones. Usa claves de prueba (sk_test_...) durante desarrollo.',
    icon: CreditCard,
    color: 'violet',
    docsUrl: 'https://dashboard.stripe.com/test/apikeys',
    placeholder: 'sk_test_...',
  },
];

const colorClasses: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
  red: { bg: 'bg-red-500/5', text: 'text-red-500', border: 'border-red-500/20', iconBg: 'bg-red-500/10' },
  emerald: { bg: 'bg-emerald-500/5', text: 'text-emerald-500', border: 'border-emerald-500/20', iconBg: 'bg-emerald-500/10' },
  violet: { bg: 'bg-violet-500/5', text: 'text-violet-500', border: 'border-violet-500/20', iconBg: 'bg-violet-500/10' },
};

export function SettingsView() {
  const { setActiveView } = useAppStore();
  const [settings, setSettings] = useState<ApiKeySetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { valid: boolean; error?: string }>>({});
  const [saveMessages, setSaveMessages] = useState<Record<string, { type: 'success' | 'error'; text: string }>>({});

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
        // Initialize edit values as empty (don't pre-fill masked values)
        const initialValues: Record<string, string> = {};
        data.settings.forEach((s: ApiKeySetting) => {
          initialValues[s.key] = '';
        });
        setEditValues(initialValues);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getSetting = (key: string): ApiKeySetting | undefined => {
    return settings.find((s) => s.key === key);
  };

  const saveKey = async (key: string) => {
    const value = editValues[key];
    setSaving((prev) => ({ ...prev, [key]: true }));
    setSaveMessages((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, category: 'api-keys' }),
      });
      const data = await res.json();

      if (data.success) {
        setSaveMessages((prev) => ({
          ...prev,
          [key]: { type: 'success', text: value ? 'API key guardada correctamente' : 'API key eliminada' },
        }));
        setEditValues((prev) => ({ ...prev, [key]: '' }));
        // Refresh settings
        await fetchSettings();
      } else {
        setSaveMessages((prev) => ({
          ...prev,
          [key]: { type: 'error', text: data.error || 'Error al guardar' },
        }));
      }
    } catch {
      setSaveMessages((prev) => ({
        ...prev,
        [key]: { type: 'error', text: 'Error de conexión' },
      }));
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const deleteKey = async (key: string) => {
    setSaving((prev) => ({ ...prev, [key]: true }));
    try {
      await fetch(`/api/settings?key=${key}`, { method: 'DELETE' });
      setSaveMessages((prev) => ({
        ...prev,
        [key]: { type: 'success', text: 'API key eliminada' },
      }));
      await fetchSettings();
    } catch {
      setSaveMessages((prev) => ({
        ...prev,
        [key]: { type: 'error', text: 'Error al eliminar' },
      }));
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const testYouTubeKey = async () => {
    setTestingKey('YOUTUBE_API_KEY');
    setTestResults((prev) => {
      const next = { ...prev };
      delete next['YOUTUBE_API_KEY'];
      return next;
    });

    try {
      const res = await fetch('/api/youtube', { method: 'POST' });
      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        YOUTUBE_API_KEY: { valid: data.valid === true, error: data.error },
      }));
    } catch {
      setTestResults((prev) => ({
        ...prev,
        YOUTUBE_API_KEY: { valid: false, error: 'Error de conexión' },
      }));
    } finally {
      setTestingKey(null);
    }
  };

  const toggleShowValue = (key: string) => {
    setShowValues((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Configuración
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Gestiona tus API keys y preferencias de NexScope
        </p>
      </div>

      {/* Security Notice */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-600">Tus claves están seguras</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Las API keys se guardan en la base de datos local del servidor y nunca se exponen al navegador.
                  Los valores mostrados están enmascarados por seguridad. Solo se envían al servidor a través de conexión cifrada.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* API Keys Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Claves API</h3>
        </div>

        <div className="space-y-4">
          {apiKeyConfigs.map((config, index) => {
            const setting = getSetting(config.key);
            const colors = colorClasses[config.color];
            const hasKey = setting?.hasValue || false;
            const isEditing = editValues[config.key] !== undefined && editValues[config.key] !== '';
            const testResult = testResults[config.key];
            const saveMsg = saveMessages[config.key];
            const IconComponent = config.icon;

            return (
              <motion.div
                key={config.key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className={`border ${hasKey ? colors.border : 'border-border/50'} ${colors.bg}`}>
                  <CardContent className="p-5">
                    {/* Key Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl ${colors.iconBg}`}>
                          <IconComponent className={`w-5 h-5 ${colors.text}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm">{config.label}</h4>
                            {hasKey ? (
                              <Badge variant="default" className="text-[10px] bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Configurada
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">
                                Sin configurar
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 max-w-md">
                            {config.description}
                          </p>
                        </div>
                      </div>
                      <a
                        href={config.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 shrink-0"
                      >
                        Obtener clave
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Current Value Display */}
                    {hasKey && !isEditing && (
                      <div className="mb-3 p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono text-muted-foreground">
                              {setting?.value || '••••••••••••'}
                            </code>
                            <span className="text-[10px] text-muted-foreground">
                              (actualizada {setting?.updatedAt ? new Date(setting.updatedAt).toLocaleDateString('es') : ''})
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => toggleShowValue(config.key)}
                          >
                            {showValues[config.key] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Input for new/edit value */}
                    <div className="space-y-2">
                      <Label htmlFor={config.key} className="text-xs text-muted-foreground">
                        {hasKey ? 'Ingresar nueva clave (dejar vacío para mantener la actual)' : 'Ingresar clave API'}
                      </Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id={config.key}
                            type={showValues[config.key] ? 'text' : 'password'}
                            placeholder={config.placeholder}
                            value={editValues[config.key] || ''}
                            onChange={(e) => setEditValues((prev) => ({ ...prev, [config.key]: e.target.value }))}
                            className="font-mono text-sm pr-10"
                            disabled={saving[config.key]}
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowValue(config.key)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showValues[config.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <Button
                          onClick={() => saveKey(config.key)}
                          disabled={saving[config.key] || (!isEditing && !hasKey)}
                          className="shrink-0"
                        >
                          {saving[config.key] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-1" />
                              Guardar
                            </>
                          )}
                        </Button>
                        {hasKey && (
                          <Button
                            variant="outline"
                            onClick={() => deleteKey(config.key)}
                            disabled={saving[config.key]}
                            className="shrink-0 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Test Button for YouTube */}
                    {config.key === 'YOUTUBE_API_KEY' && hasKey && (
                      <div className="mt-3 flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={testYouTubeKey}
                          disabled={testingKey === 'YOUTUBE_API_KEY'}
                          className="text-xs"
                        >
                          {testingKey === 'YOUTUBE_API_KEY' ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                          )}
                          Probar Conexión
                        </Button>
                        {testResult && (
                          <span className={`text-xs flex items-center gap-1 ${testResult.valid ? 'text-emerald-500' : 'text-red-500'}`}>
                            {testResult.valid ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                Conexión exitosa
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3" />
                                {testResult.error || 'Clave inválida'}
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Save message */}
                    {saveMsg && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-3 text-xs flex items-center gap-1 ${saveMsg.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}
                      >
                        {saveMsg.type === 'success' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {saveMsg.text}
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* About Section */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Acerca de NexScope</h3>
        <Card>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Versión</p>
                <p className="font-medium">1.0.0 Beta</p>
              </div>
              <div>
                <p className="text-muted-foreground">Stack</p>
                <p className="font-medium">Next.js 16 + TypeScript + SQLite</p>
              </div>
              <div>
                <p className="text-muted-foreground">IA</p>
                <p className="font-medium">z-ai-web-dev-sdk</p>
              </div>
              <div>
                <p className="text-muted-foreground">YouTube API</p>
                <p className="font-medium">Data API v3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
