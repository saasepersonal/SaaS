'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, CheckCircle, XCircle, Trash2, Users, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ClassItem, Client, Attendance } from '@/types';

// Ayudante para días de la semana
const DAYS = [
    { id: 1, label: 'Lunes' },
    { id: 2, label: 'Martes' },
    { id: 3, label: 'Miércoles' },
    { id: 4, label: 'Jueves' },
    { id: 5, label: 'Viernes' },
    { id: 6, label: 'Sábado' },
    { id: 7, label: 'Domingo' },
];

export default function OrganizacionPage() {
    const [activeTab, setActiveTab] = useState<'schedule' | 'attendance'>('schedule');
    const [loading, setLoading] = useState(true);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [user, setUser] = useState<any>(null);

    // States para Horarios
    const [newClass, setNewClass] = useState({
        name: '',
        day_of_week: 1,
        start_time: '18:00',
        end_time: '19:00'
    });

    // States para Asistencia
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [enrolledStudents, setEnrolledStudents] = useState<Client[]>([]);
    const [attendanceRecord, setAttendanceRecord] = useState<Record<string, 'present' | 'absent' | 'late'>>({});

    // Cargar datos iniciales
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                fetchClasses(user.id);
            }
            setLoading(false);
        };
        loadInitialData();
    }, []);

    // Efecto para cargar alumnos cuando cambia la clase o fecha
    useEffect(() => {
        if (activeTab === 'attendance' && selectedClassId && user) {
            fetchEnrolledAndAttendance();
        }
    }, [selectedClassId, selectedDate, activeTab]);

    const fetchClasses = async (userId: string) => {
        const { data, error } = await supabase
            .from('classes')
            .select('*')
            .eq('business_id', userId)
            .order('day_of_week', { ascending: true })
            .order('start_time', { ascending: true });

        if (data) setClasses(data);
    };

    const fetchEnrolledAndAttendance = async () => {
        if (!selectedClassId) return;

        // 1. Obtener alumnos inscritos en esta clase
        const { data: enrollments } = await supabase
            .from('enrollments')
            .select('client:clients(*)')
            .eq('class_id', selectedClassId);

        const students = enrollments?.map((e: any) => e.client).filter((c: Client) => c.is_active !== false) || []; // Solo activos
        setEnrolledStudents(students);

        // 2. Obtener asistencia ya tomada para ese día
        const { data: attendance } = await supabase
            .from('attendance')
            .select('*')
            .eq('class_id', selectedClassId)
            .eq('date', selectedDate);

        const record: Record<string, any> = {};
        // Default a 'present' para todos si no hay registro, o cargar lo existente
        students.forEach(s => {
            const existing = attendance?.find((a: Attendance) => a.client_id === s.id);
            record[s.id] = existing ? existing.status : 'present';
        });
        setAttendanceRecord(record);
    };

    const handleAddClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('classes')
                .insert([{
                    business_id: user.id,
                    ...newClass
                }])
                .select();

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            if (data) {
                setClasses([...classes, data[0]]);
                setNewClass({ name: '', day_of_week: 1, start_time: '18:00', end_time: '19:00' });
                alert('Clase creada correctamente! 🎉');
            }
        } catch (err: any) {
            console.error('Error completo:', err);
            alert(`Error al crear la clase: ${err.message || JSON.stringify(err)}`);
        }
    };

    const handleDeleteClass = async (id: string) => {
        if (!confirm('¿Seguro que quieres eliminar esta clase?')) return;
        await supabase.from('classes').delete().eq('id', id);
        setClasses(classes.filter(c => c.id !== id));
    };

    const handleSaveAttendance = async () => {
        if (!user || !selectedClassId) return;

        try {
            // Upsert: borrar lo del día para esa clase y re-insertar (o usar upsert si configurado con unique key)
            // Simplificación: Borrar previo y crear nuevo para evitar duplicados complejos
            await supabase
                .from('attendance')
                .delete()
                .eq('class_id', selectedClassId)
                .eq('date', selectedDate);

            const inserts = Object.entries(attendanceRecord).map(([clientId, status]) => ({
                class_id: selectedClassId,
                client_id: clientId,
                date: selectedDate,
                status
            }));

            if (inserts.length > 0) {
                const { error } = await supabase.from('attendance').insert(inserts);
                if (error) throw error;
            }

            alert('Asistencia guardada correctamente ✅');
        } catch (err) {
            console.error(err);
            alert('Error al guardar asistencia');
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black tracking-tight mb-2">Organización y <span className="text-indigo-400">Turnos</span></h1>
                <p className="text-secondary text-lg">Gestiona tus horarios y lleva el control de asistencia.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('schedule')}
                    className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'schedule'
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : 'text-secondary hover:text-white hover:bg-white/5'
                        }`}
                >
                    Configuración de Horarios
                </button>
                <button
                    onClick={() => setActiveTab('attendance')}
                    className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'attendance'
                            ? 'bg-emerald-500 text-white shadow-lg'
                            : 'text-secondary hover:text-white hover:bg-white/5'
                        }`}
                >
                    Tomar Asistencia
                </button>
            </div>

            {/* Tab Content: SCHEDULE */}
            {activeTab === 'schedule' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-scale-in">
                    {/* Formulario */}
                    <div className="lg:col-span-1">
                        <div className="glass-card p-6 sticky top-8">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Plus size={20} className="text-indigo-400" />
                                Nueva Clase
                            </h2>
                            <form onSubmit={handleAddClass} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-secondary uppercase">Nombre</label>
                                    <input
                                        type="text"
                                        className="input-field w-full"
                                        placeholder="Ej: Yoga Avanzado"
                                        required
                                        value={newClass.name}
                                        onChange={e => setNewClass({ ...newClass, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-secondary uppercase">Día</label>
                                    <select
                                        className="input-field w-full appearance-none"
                                        value={newClass.day_of_week}
                                        onChange={e => setNewClass({ ...newClass, day_of_week: parseInt(e.target.value) })}
                                    >
                                        {DAYS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-secondary uppercase">Inicio</label>
                                        <input
                                            type="time"
                                            className="input-field w-full"
                                            value={newClass.start_time}
                                            onChange={e => setNewClass({ ...newClass, start_time: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-secondary uppercase">Fin</label>
                                        <input
                                            type="time"
                                            className="input-field w-full"
                                            value={newClass.end_time}
                                            onChange={e => setNewClass({ ...newClass, end_time: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary w-full py-3 mt-4">
                                    Crear Clase
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Lista de Clases */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-indigo-400" />
                            Turnos Disponibles
                        </h2>
                        {classes.length === 0 ? (
                            <p className="text-secondary italic">No hay clases configuradas aún.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {classes.map(c => (
                                    <div key={c.id} className="glass-card p-5 group hover:border-indigo-500/30 transition-all flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg text-white">{c.name}</h3>
                                            <div className="flex items-center gap-2 mt-2 text-indigo-300 font-medium">
                                                <Calendar size={14} />
                                                {DAYS.find(d => d.id === c.day_of_week)?.label}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 text-secondary text-sm">
                                                <Clock size={14} />
                                                {c.start_time.slice(0, 5)} - {c.end_time.slice(0, 5)}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteClass(c.id)}
                                            className="text-white/20 hover:text-rose-400 transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-lg"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tab Content: ATTENDANCE */}
            {activeTab === 'attendance' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-scale-in">
                    {/* Filtros */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="glass-card p-6">
                            <h3 className="font-bold mb-4 text-secondary uppercase text-xs tracking-widest">Configuración</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold mb-2">Fecha</label>
                                    <input
                                        type="date"
                                        className="input-field w-full"
                                        value={selectedDate}
                                        onChange={e => setSelectedDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2">Clase / Turno</label>
                                    {classes.length > 0 ? (
                                        <div className="space-y-2">
                                            {classes.map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => setSelectedClassId(c.id)}
                                                    className={`w-full text-left p-3 rounded-xl border transition-all ${selectedClassId === c.id
                                                        ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20'
                                                        : 'bg-white/5 border-white/5 text-secondary hover:bg-white/10'
                                                        }`}
                                                >
                                                    <div className="font-bold">{c.name}</div>
                                                    <div className="text-xs opacity-70 flex justify-between">
                                                        <span>{DAYS.find(d => d.id === c.day_of_week)?.label}</span>
                                                        <span>{c.start_time.slice(0, 5)}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-secondary">Configura tus horarios primero.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lista de Alumnos */}
                    <div className="lg:col-span-3">
                        {!selectedClassId ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-12 border border-dashed border-white/10 rounded-3xl opacity-50">
                                <Users size={48} className="mb-4" />
                                <p>Selecciona una clase para tomar asistencia</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-bold flex items-center gap-3">
                                        <Users className="text-emerald-400" />
                                        Alumnos Inscritos
                                        <span className="text-sm bg-white/10 text-white px-3 py-1 rounded-full font-normal">
                                            {enrolledStudents.length}
                                        </span>
                                    </h2>
                                    <button
                                        onClick={handleSaveAttendance}
                                        className="btn btn-primary px-6 py-2.5 flex items-center gap-2"
                                    >
                                        <Save size={18} />
                                        Guardar Asistencia
                                    </button>
                                </div>

                                {enrolledStudents.length === 0 ? (
                                    <div className="p-8 glass-card text-center">
                                        <p className="text-secondary">No hay alumnos inscritos en esta clase aún.</p>
                                        <p className="text-xs mt-2 text-indigo-300">Ve a "Clientes" y edita el perfil para asignarles un turno.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {enrolledStudents.map(student => (
                                            <div key={student.id} className="glass-card p-4 flex items-center justify-between group hover:bg-white/[0.03]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-300 font-bold border border-white/10">
                                                        {student.name.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-white">{student.name}</span>
                                                </div>

                                                <div className="flex bg-black/30 p-1 rounded-lg border border-white/5">
                                                    <button
                                                        onClick={() => setAttendanceRecord({ ...attendanceRecord, [student.id]: 'present' })}
                                                        className={`p-2 rounded-md transition-all ${attendanceRecord[student.id] === 'present' ? 'bg-emerald-500 text-white shadow-lg' : 'text-secondary hover:text-white'}`}
                                                        title="Presente"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => setAttendanceRecord({ ...attendanceRecord, [student.id]: 'absent' })}
                                                        className={`p-2 rounded-md transition-all ${attendanceRecord[student.id] === 'absent' ? 'bg-rose-500 text-white shadow-lg' : 'text-secondary hover:text-white'}`}
                                                        title="Ausente"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
