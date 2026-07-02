import { useState, useEffect } from 'react';
import { Briefcase, User, BookOpen, Store } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

// Calcula el tiempo relativo desde un Firestore Timestamp
const calcularTiempo = (timestamp) => {
  if (!timestamp) return 'Reciente';
  const ahora = Date.now();
  const fecha = timestamp.toMillis ? timestamp.toMillis() : timestamp;
  const diffMinutos = Math.floor((ahora - fecha) / 60000);
  if (diffMinutos < 60) return `Hace ${diffMinutos} min`;
  const diffHoras = Math.floor(diffMinutos / 60);
  if (diffHoras < 24) return `Hace ${diffHoras}h`;
  const diffDias = Math.floor(diffHoras / 24);
  return `Hace ${diffDias}d`;
};

export default function useNotifications(userRole, userId) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!userRole || userRole === 'visitante') {
      setCargando(false);
      return;
    }

    const obtenerNotificacionesReales = async () => {
      setCargando(true);
      try {
        // Notificaciones globales por rol
        const qGlobal = query(
          collection(db, 'notificaciones'),
          where('rolDestino', 'array-contains', userRole),
          orderBy('fecha', 'desc'),
          limit(10)
        );

        // Notificaciones personales por userId
        const qPersonal = userId ? query(
          collection(db, 'notificaciones'),
          where('userId', '==', userId),
          orderBy('fecha', 'desc'),
          limit(10)
        ) : null;

        const [snapGlobal, snapPersonal] = await Promise.all([
          getDocs(qGlobal),
          qPersonal ? getDocs(qPersonal) : Promise.resolve({ docs: [] })
        ]);

        // Mergear y deduplicar
        const idsVistos = new Set();
        const docs = [...snapGlobal.docs, ...snapPersonal.docs]
          .filter(d => { if (idsVistos.has(d.id)) return false; idsVistos.add(d.id); return true; })
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => {
            const fa = a.fecha?.toMillis ? a.fecha.toMillis() : a.fecha || 0;
            const fb = b.fecha?.toMillis ? b.fecha.toMillis() : b.fecha || 0;
            return fb - fa;
          })
          .slice(0, 10);

        const formateadas = docs.map((item) => {

          if (item.tipo === 'empleo') {
            return {
              id: item.id,
              etiqueta: 'Empleo',
              colorEtiq: 'text-[#2D6A6A]',
              Icono: Briefcase,
              tiempo: calcularTiempo(item.fecha),
              texto: `${item.clinica} busca ${item.puesto} en ${item.ciudad}, ${item.provincia}`,
              accion: 'Ver oferta',
              colorHover: 'group-hover:text-[#2D6A6A]',
              link: '/bolsa-de-trabajo'
            };
          }

          if (item.tipo === 'profesional_disponible') {
            const especialidades = Array.isArray(item.especialidad) 
              ? item.especialidad.join(', ') 
              : item.especialidad;
            return {
              id: item.id,
              etiqueta: 'Profesional disponible',
              colorEtiq: 'text-[#4DB6AC]',
              Icono: User,
              tiempo: calcularTiempo(item.fecha),
              texto: `${item.nombre} está disponible · ${especialidades}`,
              accion: 'Ver perfil',
              colorHover: 'group-hover:text-[#4DB6AC]',
              link: '/bolsa-de-trabajo'
            };
          }

          if (item.tipo === 'capacitacion') {
            return {
              id: item.id,
              etiqueta: 'Capacitación',
              colorEtiq: 'text-[#EAB308]',
              Icono: BookOpen,
              tiempo: calcularTiempo(item.fecha),
              texto: item.texto,
              accion: 'Ver curso',
              colorHover: 'group-hover:text-[#EAB308]',
              link: '/capacitaciones'
            };
          }

if (item.tipo === 'curso_aprobado') {
            return {
              id: item.id,
              etiqueta: 'Curso aprobado',
              colorEtiq: 'text-green-600',
              Icono: BookOpen,
              tiempo: calcularTiempo(item.fecha),
              texto: item.texto,
              accion: 'Ver mis cursos',
              colorHover: 'group-hover:text-green-600',
              link: '/capacitaciones'
            };
          }

          if (item.tipo === 'curso_rechazado') {
            return {
              id: item.id,
              etiqueta: 'Curso con ajustes',
              colorEtiq: 'text-red-500',
              Icono: BookOpen,
              tiempo: calcularTiempo(item.fecha),
              texto: item.texto,
              accion: 'Ver mis cursos',
              colorHover: 'group-hover:text-red-500',
              link: '/capacitaciones'
            };
          }

          if (item.tipo === 'nueva_inscripcion') {
            return {
              id: item.id,
              etiqueta: 'Nueva inscripción',
              colorEtiq: 'text-[#2D6A6A]',
              Icono: User,
              tiempo: calcularTiempo(item.fecha),
              texto: item.texto,
              accion: 'Ver mis cursos',
              colorHover: 'group-hover:text-[#2D6A6A]',
              link: '/capacitaciones'
            };
          }

          if (item.tipo === 'proveedor') {
            return {
              id: item.id,
              etiqueta: 'Nuevo proveedor',
              colorEtiq: 'text-[#1A3D3D]',
              Icono: Store,
              tiempo: calcularTiempo(item.fecha),
              texto: item.texto,
              accion: 'Ver proveedor',
              colorHover: 'group-hover:text-[#1A3D3D]',
              link: '/cartilla-proveedores'
            };
          }

          return null;
        }).filter(Boolean);

        setNotificaciones(formateadas);

      } catch (error) {
        console.error("Error al traer notificaciones:", error);
      } finally {
        setCargando(false);
      }
    };

    obtenerNotificacionesReales();
  }, [userRole]);

  return { notificaciones, cargando };
}