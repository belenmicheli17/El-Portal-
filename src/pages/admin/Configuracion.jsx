import React, { useState } from 'react';
import { 
  Settings, Save, AlertTriangle, Power, 
  CreditCard, Bell, Globe, Mail, Instagram 
} from 'lucide-react';

export default function Configuracion() {
  // Estado inicial simulando los datos globales traídos de Firebase (ej: document 'globales' en collection 'settings')
  const [config, setConfig] = useState({
    modoMantenimiento: false,
    mostrarBanner: true,
    textoBanner: '🎉 ¡Bienvenidos a la nueva versión de El Portal Veterinario!',
    precioPlanPro: '15000',
    emailSoporte: 'soporte@elportalvet.com',
    instagramUrl: 'https://instagram.com/elportalvet',
  });

  const [isSaving, setIsSaving] = useState(false);

  // Manejador genérico de cambios en inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Función para guardar en la base de datos
  const handleGuardar = (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Acá iría la lógica de Firebase: await setDoc(doc(db, 'settings', 'globales'), config);
    setTimeout(() => {
      setIsSaving(false);
      alert("¡Configuraciones globales actualizadas con éxito!");
    }, 1000);
  };

  return (
    <div className="animate-in fade-in duration-500 pb-24">
      
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-[28px] font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight mb-2 flex items-center gap-3">
          <Settings className="w-8 h-8 text-[#2D6A6A]" /> Configuración Global
        </h1>
        <p className="text-[#666666] text-[15px] font-medium">
          Ajustá las variables principales, precios y el estado general de la plataforma.
        </p>
      </div>

      <form onSubmit={handleGuardar} className="space-y-8 max-w-4xl">
        
        {/* TARJETA 1: Estado del Sistema y Avisos */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-[#F4F7F7] px-8 py-5 border-b border-gray-100 flex items-center gap-3">
            <Globe className="w-5 h-5 text-[#2D6A6A]" />
            <h2 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[16px]">Estado y Avisos</h2>
          </div>
          
          <div className="p-8 space-y-8">
            {/* Toggle Mantenimiento */}
            <div className="flex items-center justify-between p-5 rounded-2xl border border-red-100 bg-red-50/50">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full shrink-0 ${config.modoMantenimiento ? 'bg-red-500 text-white' : 'bg-red-100 text-red-500'}`}>
                  <Power className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[#1A3D3D] font-bold text-[15px] mb-1">Modo Mantenimiento</h3>
                  <p className="text-[#666666] text-[13px] font-medium max-w-md">
                    Si activás esto, nadie podrá acceder a la web (salvo vos). Verán una pantalla de "Volvemos pronto". Útil para actualizaciones grandes.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  name="modoMantenimiento" 
                  checked={config.modoMantenimiento} 
                  onChange={handleChange} 
                  className="sr-only peer" 
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>

            {/* Banner de Anuncios */}
            <div className="border-t border-gray-50 pt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#1A3D3D] font-bold text-[15px] flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#4DB6AC]" /> Banner Superior de Anuncios
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <span className="mr-3 text-[12px] font-bold uppercase tracking-widest text-[#666666]">
                    {config.mostrarBanner ? 'Activado' : 'Oculto'}
                  </span>
                  <input 
                    type="checkbox" 
                    name="mostrarBanner" 
                    checked={config.mostrarBanner} 
                    onChange={handleChange} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2D6A6A]"></div>
                </label>
              </div>
              
              <div className={`transition-opacity duration-300 ${config.mostrarBanner ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-2">Texto del Banner</label>
                <input 
                  type="text" 
                  name="textoBanner"
                  value={config.textoBanner}
                  onChange={handleChange}
                  placeholder="Ej: Mantenimiento programado este domingo a las 00:00hs"
                  className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[14px] font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white text-[#333333] transition-all"
                />
                <p className="text-[#666666] text-[12px] font-medium mt-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Este mensaje aparecerá fijo en la parte superior de todas las pantallas.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* TARJETA 2: Monetización y Planes */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-[#F4F7F7] px-8 py-5 border-b border-gray-100 flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-[#2D6A6A]" />
            <h2 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[16px]">Suscripciones y Planes</h2>
          </div>
          
          <div className="p-8">
            <div className="max-w-md">
              <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-2">Valor Mensual del Plan Pro (ARS)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#666666] font-bold">$</span>
                <input 
                  type="number" 
                  name="precioPlanPro"
                  value={config.precioPlanPro}
                  onChange={handleChange}
                  className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl pl-10 pr-5 py-4 text-[16px] font-black focus:outline-none focus:border-[#2D6A6A] focus:bg-white text-[#1A3D3D] transition-all"
                />
              </div>
              <p className="text-[#666666] text-[12px] font-medium mt-2">
                Este valor se actualizará visualmente en la landing page y en la sección de cobros para los profesionales.
              </p>
            </div>
          </div>
        </div>

        {/* TARJETA 3: Contacto Público */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-[#F4F7F7] px-8 py-5 border-b border-gray-100 flex items-center gap-3">
            <Mail className="w-5 h-5 text-[#2D6A6A]" />
            <h2 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[16px]">Datos de Contacto Públicos</h2>
          </div>
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-2 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> Email de Soporte
              </label>
              <input 
                type="email" 
                name="emailSoporte"
                value={config.emailSoporte}
                onChange={handleChange}
                className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[14px] font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white text-[#333333] transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#666666] uppercase tracking-widest mb-2 flex items-center gap-2">
                <Instagram className="w-3.5 h-3.5" /> Enlace de Instagram
              </label>
              <input 
                type="url" 
                name="instagramUrl"
                value={config.instagramUrl}
                onChange={handleChange}
                className="w-full bg-[#F4F7F7] border border-gray-200 rounded-2xl px-5 py-4 text-[14px] font-medium focus:outline-none focus:border-[#2D6A6A] focus:bg-white text-[#333333] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Barra Inferior Flotante de Guardado */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-72 bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 md:p-6 flex justify-end z-40">
          <button 
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto bg-[#1A3D3D] text-white px-8 py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-[#2D6A6A] hover:-translate-y-1 transition-all duration-300 shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? 'Guardando...' : <><Save className="w-5 h-5" /> Guardar Configuraciones</>}
          </button>
        </div>

      </form>
    </div>
  );
}