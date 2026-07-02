import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, AlertTriangle, Power, 
  CreditCard, Bell, Globe, Mail, Instagram, Loader2, Check
} from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function Configuracion() {
  const [config, setConfig] = useState({
    modoMantenimiento: false,
    mostrarBanner: false,
    textoBanner: '',
    comisionCapacitaciones: '10',
    emailSoporte: '',
    instagramUrl: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'globales'));
        if (docSnap.exists()) {
          setConfig(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error("Error cargando configuración:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'globales'), config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      console.error("Error guardando:", error);
      alert("Hubo un error al guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-[#2D6A6A]" />
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 pb-24">
      <div className="mb-8">
        <h1 className="text-[28px] font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight mb-2 flex items-center gap-3">
          <Settings className="w-8 h-8 text-[#2D6A6A]" /> Configuración Global
        </h1>
        <p className="text-[#666666] text-[15px] font-medium">
          Ajustá las variables principales y el estado general de la plataforma.
        </p>
      </div>

      <form onSubmit={handleGuardar} className="space-y-8 max-w-4xl">
        
        {/* TARJETA 1: Estado y Avisos */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-[#F4F7F7] px-8 py-5 border-b border-gray-100 flex items-center gap-3">
            <Globe className="w-5 h-5 text-[#2D6A6A]" />
            <h2 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[16px]">Estado y Avisos</h2>
          </div>
          
          <div className="p-8 space-y-8">
            <div className="flex items-center justify-between p-5 rounded-2xl border border-red-100 bg-red-50/50">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full shrink-0 ${config.modoMantenimiento ? 'bg-red-500 text-white' : 'bg-red-100 text-red-500'}`}>
                  <Power className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[#1A3D3D] font-bold text-[15px] mb-1">Modo Mantenimiento</h3>
                  <p className="text-[#666666] text-[13px] font-medium max-w-md">
                    Si activás esto, los usuarios verán una pantalla de "Volvemos pronto". Solo vos podés acceder.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input type="checkbox" name="modoMantenimiento" checked={config.modoMantenimiento} onChange={handleChange} className="sr-only peer" />
                <div className="w-14 h-7 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>

            <div className="border-t border-gray-50 pt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#1A3D3D] font-bold text-[15px] flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#4DB6AC]" /> Banner de Anuncios
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <span className="mr-3 text-[12px] font-bold uppercase tracking-widest text-[#666666]">
                    {config.mostrarBanner ? 'Activado' : 'Oculto'}
                  </span>
                  <input type="checkbox" name="mostrarBanner" checked={config.mostrarBanner} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2D6A6A]"></div>
                </label>
              </div>
              <div className={`transition-opacity duration-300 ${config.mostrarBanner ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-2">Texto del Banner</label>
                <input 
                  type="text" name="textoBanner" value={config.textoBanner} onChange={handleChange}
                  placeholder="Ej: Mantenimiento programado este domingo..."
                  className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[14px] font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white text-[#333333] transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* TARJETA 2: Comisión */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-[#F4F7F7] px-8 py-5 border-b border-gray-100 flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-[#2D6A6A]" />
            <h2 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[16px]">Comisión por Capacitación</h2>
          </div>
          <div className="p-8">
            <div className="max-w-md">
              <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-2">Porcentaje que retiene El Portal (%)</label>
              <div className="relative">
                <input 
                  type="number" name="comisionCapacitaciones" value={config.comisionCapacitaciones} onChange={handleChange} min="1" max="50"
                  className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[16px] font-black focus:outline-none focus:border-[#2D6A6A] focus:bg-white text-[#1A3D3D] transition-all"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[#666666] font-bold text-lg">%</span>
              </div>
              <p className="text-[12px] text-[#666666] mt-2 font-medium">Actualmente el organizador recibe el {100 - Number(config.comisionCapacitaciones || 10)}% del precio por cada alumno inscripto.</p>
            </div>
          </div>
        </div>

        {/* TARJETA 3: Contacto */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-[#F4F7F7] px-8 py-5 border-b border-gray-100 flex items-center gap-3">
            <Mail className="w-5 h-5 text-[#2D6A6A]" />
            <h2 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[16px]">Datos de Contacto Públicos</h2>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-2">Email de Soporte</label>
              <input type="email" name="emailSoporte" value={config.emailSoporte} onChange={handleChange}
                className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[14px] font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white text-[#333333] transition-all" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-2">Instagram</label>
              <input type="url" name="instagramUrl" value={config.instagramUrl} onChange={handleChange}
                className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[14px] font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white text-[#333333] transition-all" />
            </div>
          </div>
        </div>

        {/* Barra flotante de guardado */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-72 bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 md:p-6 flex justify-end z-40">
          <button 
            type="submit" disabled={isSaving || saved}
            className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest transition-all duration-300 shadow-xl flex items-center justify-center gap-2 ${
              saved ? 'bg-[#4DB6AC] text-white' : 'bg-[#1A3D3D] text-white hover:bg-[#2D6A6A] hover:-translate-y-1'
            } disabled:opacity-50`}
          >
            {isSaving ? <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</> : 
             saved ? <><Check className="w-5 h-5" /> ¡Guardado!</> : 
             <><Save className="w-5 h-5" /> Guardar Configuraciones</>}
          </button>
        </div>
      </form>
    </div>
  );
}