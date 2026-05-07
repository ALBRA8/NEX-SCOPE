'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Radar, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface RegisterModalProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterModal({ onClose, onSwitchToLogin }: RegisterModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAppStore((s) => s.register);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Por favor, completa todos los campos');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const success = await register(name, email, password);
      if (!success) {
        setError('Ya existe una cuenta con este email');
      }
    } catch {
      setError('Error al crear la cuenta. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[425px] bg-[#111111] border-white/10 text-white">
        <DialogHeader>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500 text-white">
              <Radar className="w-6 h-6" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">Crea tu cuenta</DialogTitle>
          <DialogDescription className="text-center text-gray-400">
            Comienza a encontrar nichos rentables hoy
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-2">
            <Label htmlFor="register-name" className="text-gray-300 text-sm">Nombre</Label>
            <Input
              id="register-name"
              type="text"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-emerald-500 focus:ring-emerald-500/20"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-email" className="text-gray-300 text-sm">Email</Label>
            <Input
              id="register-email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-emerald-500 focus:ring-emerald-500/20"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-password" className="text-gray-300 text-sm">Contraseña</Label>
            <div className="relative">
              <Input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-emerald-500 focus:ring-emerald-500/20 pr-10"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-confirm" className="text-gray-300 text-sm">Confirmar Contraseña</Label>
            <Input
              id="register-confirm"
              type="password"
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-emerald-500 focus:ring-emerald-500/20"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold h-11 rounded-xl"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Crear Cuenta'
            )}
          </Button>

          <p className="text-center text-sm text-gray-400">
            ¿Ya tienes cuenta?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Inicia sesión
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
