// src/pages/Checkout.jsx
import React, { useState } from 'react';
import { ChevronLeft, Lock, CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import { procesarPagoPublicacion } from '../services/servicio-pago';

export default function Checkout({ checkoutData, onCancel, onSuccess }) {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setIsProcessingPayment(true);

    try {
      // Acá llamamos al archivo de servicio separado
      await procesarPagoPublicacion({}, checkoutData);
      
      setIsProcessingPayment(false);
      // Si todo sale bien, avisamos al componente padre para que muestre el Success
      if (onSuccess) onSuccess(); 
    } catch (error) {
      console.error("Error al procesar el pago", error);
      setIsProcessingPayment(false);
    }
  };

  // Si por algún motivo no llegan los datos del checkout, mostramos un fallback
  if (!checkoutData) return null;

  return (
    <section className="max-w-[1000px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <button 
          onClick={onCancel} 
          className="flex items-center gap-2 text-gray-400 hover:text-[#1A3D3D] font-bold text-xs md:text-[10px] uppercase tracking-[0.3em] transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al Formulario
        </button>
        <div className="flex items-center gap-2 text-[#2D6A6A] bg-[#2D6A6A]/10 px-4 py-2 rounded-full self-start md:self-auto">
          <Lock className="w-4 h-4" />
          <span className="text-[11px] font-bold uppercase tracking-widest">Pago 100% Seguro</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[32px] p-8 md:p-10 border border-gray-100 shadow-xl relative overflow-hidden">
            <h2 className="text-2xl font-black font-['Montserrat'] text-[#1A3D3D] mb-6">Detalles de Facturación</h2>
            
            <form onSubmit={handlePaymentSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Número de Tarjeta</label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" required
                      placeholder="0000 0000 0000 0000" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-base font-medium focus:outline-none focus:bg-white focus:border-[#2D6A6A] transition-all text-[#1A3D3D]" 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Vencimiento</label>
                    <input 
                      type="text" required
                      placeholder="MM/AA" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base font-medium focus:outline-none focus:bg-white focus:border-[#2D6A6A] transition-all text-[#1A3D3D]" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">CVC</label>
                    <input 
                      type="text" required
                      placeholder="123" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base font-medium focus:outline-none focus:bg-white focus:border-[#2D6A6A] transition-all text-[#1A3D3D]" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Nombre en la tarjeta</label>
                  <input 
                    type="text" required
                    placeholder="TITULAR DE LA TARJETA" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base font-medium focus:outline-none focus:bg-white focus:border-[#2D6A6A] transition-all text-[#1A3D3D]" 
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <button 
                  type="submit"
                  disabled={isProcessingPayment}
                  className="w-full py-4 bg-[#1A3D3D] text-white font-black text-sm uppercase tracking-widest hover:bg-[#2D6A6A] rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isProcessingPayment ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Procesando el pago...</>
                  ) : (
                    <><Lock className="w-5 h-5" /> Pagar ${checkoutData?.precioPublicacion.toLocaleString('es-AR')}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-[#1A3D3D] text-white rounded-[32px] p-8 shadow-xl sticky top-28 overflow-hidden">
            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-white/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/3"></div>
            
            <h3 className="text-xl font-black font-['Montserrat'] mb-6 relative z-10 border-b border-white/10 pb-4">Resumen de Publicación</h3>
            
            <div className="space-y-4 relative z-10 mb-8">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-widest font-bold mb-1">Producto a publicar</p>
                  <p className="font-medium text-lg leading-tight">{checkoutData?.title}</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <p className="text-white/60 text-xs uppercase tracking-widest font-bold">Empresa</p>
                <p className="font-bold">{checkoutData?.empresa}</p>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <p className="text-white/60 text-xs uppercase tracking-widest font-bold">Duración</p>
                <p className="font-bold">Anual</p>
              </div>
            </div>

            <div className="relative z-10 bg-white/10 rounded-2xl p-6 border border-white/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-white/80">Subtotal</span>
                <span className="text-sm font-bold">${checkoutData?.precioPublicacion.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
                <span className="text-sm font-medium text-white/80">Impuestos (IVA)</span>
                <span className="text-sm font-bold">Incluido</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-xs uppercase tracking-widest font-bold text-white/80">Total a pagar</span>
                <span className="text-3xl font-black font-['Montserrat']">${checkoutData?.precioPublicacion.toLocaleString('es-AR')}</span>
              </div>
            </div>
            
            <div className="mt-6 flex items-start gap-3 relative z-10">
              <ShieldCheck className="w-5 h-5 text-[#4DB6AC] shrink-0" />
              <p className="text-[11px] text-white/60 leading-tight">Al procesar el pago, tu producto entrará en fase de verificación (24hs). Si no cumple los requisitos, el dinero será devuelto automáticamente.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}