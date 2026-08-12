import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { X, Loader2, Save } from 'lucide-react';

export default function SopFormModal({ isOpen, onClose, onRefresh, editData }) {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [version, setVersion] = useState('1.0');
  const [departmentId, setDepartmentId] = useState('');
  const [content, setContent] = useState('');
  const [isMandatory, setIsMandatory] = useState(true);

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load daftar departemen
  useEffect(() => {
    async function fetchDepartments() {
      const { data } = await supabase.from('departments').select('*');
      if (data) setDepartments(data);
    }
    fetchDepartments();
  }, []);

  // Set nilai awal jika mode Edit
  useEffect(() => {
    if (editData) {
      setTitle(editData.title || '');
      setCode(editData.code || '');
      setVersion(editData.version || '1.0');
      setDepartmentId(editData.department_id || '');
      setContent(editData.content || '');
      setIsMandatory(editData.is_mandatory ?? true);
    } else {
      setTitle('');
      setCode('');
      setVersion('1.0');
      setDepartmentId('');
      setContent('');
      setIsMandatory(true);
    }
  }, [editData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        title,
        code,
        version,
        department_id: departmentId || null,
        content,
        is_mandatory: isMandatory,
        updated_at: new Date().toISOString()
      };

      if (editData) {
        // Mode UPDATE
        const { error } = await supabase.from('sops').update(payload).eq('id', editData.id);
        if (error) throw error;
      } else {
        // Mode INSERT
        const { error } = await supabase.from('sops').insert([payload]);
        if (error) throw error;
      }

      await onRefresh();
      onClose();
    } catch (err) {
      alert('Gagal menyimpan SOP: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base">
            {editData ? 'Edit Dokumen SOP' : 'Tambah SOP Baru'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Kode SOP</label>
              <input
                type="text"
                required
                placeholder="SOP-OPS-003"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Versi</label>
              <input
                type="text"
                required
                placeholder="1.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Judul Dokumen SOP</label>
            <input
              type="text"
              required
              placeholder="SOP Pembukaan & Persiapan Toko"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Departemen / Divisi</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="">Pilih Departemen (Semua / Umum)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Isi Instruksi SOP</label>
            <textarea
              required
              rows={6}
              placeholder="Tuliskan langkah-langkah operasional di sini..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-emerald-500 leading-relaxed resize-none"
            ></textarea>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="mandatory"
              checked={isMandatory}
              onChange={(e) => setIsMandatory(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="mandatory" className="font-medium text-slate-700 cursor-pointer">
              Wajib ditandatangani staf (Mandatory Sign-Off)
            </label>
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Simpan SOP</>}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}