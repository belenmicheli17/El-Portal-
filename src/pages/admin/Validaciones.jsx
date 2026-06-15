import React, { useState } from 'react';
import { 
  CheckCircle, XCircle, FileText, Eye, 
  User, Building, Calendar, Mail, AlertTriangle, X 
} from 'lucide-react';

export default function Validaciones() {
  // Datos mockeados de usuarios pendientes (A futuro: getDocs donde estado == 'pendiente')
  const [pendientes, setPendientes] = useState([
    {
      id: 'req-001',
      nombre: 'Dr. Martín López',
      tipo: 'profesional',
      especialidad: 'Clínico General',
      matricula: 'MP 98765',
      provincia: 'Córdoba',
      email: 'martin.lopez@ejemplo.com',
      fechaRegistro: 'Hace 2 horas',
      // Usamos una imagen de stock simulando un carnet/documento
      comprobante: 'https://images.unsplash.com/photo-1616628188506-4bf98fb1d932?auto=format&fit=crop&w=600&q=80' 
    },
    {
      id: 'req-002',
      nombre: 'Centro Veterinario Sur',
      tipo: 'clinica',
      especialidad: 'Atención 24hs',
      matricula: 'Hab. Municipal 4452',
      provincia: 'Buenos Aires',
      email: 'contacto@cvsur.com',
      fechaRegistro: 'Hace 1 día',
      comprobante: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80'
    }
  ]);

  // Estado para el visor de imágenes (Matrículas)
  const [imagenModal, setImagenModal] = useState(null);

  // Funciones de acción
  const handleAprobar = (id, nombre) => {
    if (window.confirm(`¿Aprobar a ${nombre} y enviarle el mail de bienvenida?`)) {
      // Acá harías updateDoc() en Firebase cambiando estado a 'activo'
      setPendientes(prev => prev.filter(req => req.id !== id));
      alert(`¡${nombre} fue aprobado con éxito! Ya puede acceder a la plataforma.`);
    }
  };

  const handleRechazar = (id, nombre) => {
    const motivo = window.prompt(`Estás por rechazar a ${nombre}. Ingresá un motivo (opcional) que se le enviará por mail:`);
    if (motivo !== null) { // Si no canceló el prompt
      // Acá harías un updateDoc() a 'rechazado' o deleteDoc()
      setPendientes(prev => prev.filter(req => req.id !== id));
      alert(`La solicitud de ${nombre} fue rechazada.`);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      
      {/* Encabezado */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-black font-['Montserrat'] text-[#1A3D3D] tracking-tight mb-2 flex items-center gap-3">
            Validaciones Pendientes
            {pendientes.length > 0 && (
              <span className="bg-orange-100 text-orange-600 text-[14px] px-3 py-1 rounded-xl font-bold">
                {pendientes.length}
              </span>
            )}
          </h1>
          <p className="text-[#666666] text-[15px] font-medium">
            Revisá la documentación de los nuevos registros para mantener la seguridad de El Portal.
          </p>
        </div>
      </div>

      {/* Grid de Solicitudes */}
      {pendientes.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pendientes.map((req) => (
            <div key={req.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              
              <div className="p-6 md:p-8 flex-1">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${req.tipo === 'profesional' ? 'bg-[#2D6A6A]/10 text-[#2D6A6A]' : 'bg-[#4DB6AC]/10 text-[#4DB6AC]'}`}>
                      {req.tipo === 'profesional' ? <User className="w-7 h-7" /> : <Building className="w-7 h-7" />}
                    </div>
                    <div>
                      <h3 className="font-['Montserrat'] font-black text-[#1A3D3D] text-[18px] leading-tight mb-1">
                        {req.nombre}
                      </h3>
                      <span className="inline-block bg-[#F4F7F7] text-[#666666] text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest">
                        Nuevo {req.tipo}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[#666666] text-[12px] font-semibold flex items-center gap-1.5 justify-end mb-1">
                      <Calendar className="w-3.5 h-3.5" /> {req.fechaRegistro}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 border-b border-gray-50 pb-3">
                    <FileText className="w-4 h-4 text-[#666666]" />
                    <span className="text-[#666666] text-[13px] font-medium w-24">Matrícula:</span>
                    <span className="text-[#1A3D3D] text-[14px] font-bold">{req.matricula}</span>
                  </div>
                  <div className="flex items-center gap-3 border-b border-gray-50 pb-3">
                    <Mail className="w-4 h-4 text-[#666666]" />
                    <span className="text-[#666666] text-[13px] font-medium w-24">Email:</span>
                    <span className="text-[#1A3D3D] text-[14px] font-bold">{req.email}</span>
                  </div>
                  <div className="flex items-center gap-3 pb-2">
                    <AlertTriangle className="w-4 h-4 text-[#666666]" />
                    <span className="text-[#666666] text-[13px] font-medium w-24">Provincia:</span>
                    <span className="text-[#1A3D3D] text-[14px] font-bold">{req.provincia}</span>
                  </div>
                </div>

                {/* Botón para ver comprobante */}
                <button 
                  onClick={() => setImagenModal(req.comprobante)}
                  className="w-full bg-[#F4F7F7] border border-gray-200 text-[#1A3D3D] py-3.5 rounded-2xl font-bold text-[12px] uppercase tracking-widest hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 mb-2"
                >
                  <Eye className="w-4 h-4" /> Ver Foto de Credencial
                </button>
              </div>

              {/* Botonera de Acción */}
              <div className="bg-[#F4F7F7] p-4 flex items-center gap-3 border-t border-gray-100">
                <button 
                  onClick={() => handleRechazar(req.id, req.nombre)}
                  className="flex-1 bg-white border border-red-200 text-red-600 py-3.5 rounded-xl font-bold text-[12px] uppercase tracking-widest hover:bg-red-50 hover:border-red-300 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <XCircle className="w-4 h-4" /> Rechazar
                </button>
                <button 
                  onClick={() => handleAprobar(req.id, req.nombre)}
                  className="flex-1 bg-[#2D6A6A] text-white py-3.5 rounded-xl font-black text-[12px] uppercase tracking-[0.15em] hover:bg-[#1A3D3D] hover:-translate-y-0.5 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Aprobar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Estado Vacío */
        <div className="bg-white border border-gray-100 rounded-[32px] p-16 text-center flex flex-col items-center justify-center shadow-sm mt-6">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-[#1A3D3D] text-[22px] font-black font-['Montserrat'] mb-2">¡Todo al día!</h3>
          <p className="text-[#666666] text-[15px] font-medium max-w-md">
            No tenés registros pendientes de validación. Cuando un nuevo usuario se registre, aparecerá acá para que revises su matrícula.
          </p>
        </div>
      )}

      {/* ==========================================
          MODAL VISOR DE IMAGEN (CREDENCIAL)
          ========================================== */}
      {imagenModal && (
        <div className="fixed inset-0 bg-[#1A3D3D]/90 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl flex justify-end mb-4">
            <button 
              onClick={() => setImagenModal(null)} 
              className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors flex items-center gap-2 font-bold text-[11px] uppercase tracking-widest"
            >
              <X className="w-5 h-5" /> Cerrar Visor
            </button>
          </div>
          <div className="relative w-full max-w-4xl max-h-[80vh] flex items-center justify-center">
            <img 
              src={imagenModal} 
              alt="Comprobante de Matrícula" 
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
          <p className="text-white/60 mt-4 text-[12px] font-medium">Asegurate de que el número coincida con el declarado en la solicitud.</p>
        </div>
      )}

    </div>
  );
}