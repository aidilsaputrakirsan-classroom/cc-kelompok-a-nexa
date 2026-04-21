import React from 'react';

const ClassList = ({ 
  classes, 
  loading, 
  onSelect, 
  onEdit, 
  onDelete, 
  onArchive, 
  onUnarchive,
  isArchivePage = false,
  currentUser, 
  filters = { semester: "", instructor_id: "" }, 
  onFilterChange 
}) => {
  if (loading && (!classes || classes.length === 0)) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
          <p className="text-on-surface-variant font-medium">Memuat kelas...</p>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="mt-2">
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-4 bg-surface-container-lowest p-4 rounded-xl mb-6 border border-outline-variant/5 shadow-sm items-center">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-on-surface-variant whitespace-nowrap">Semester:</label>
          <input 
            type="number" 
            placeholder="Filter semester..."
            value={filters?.semester || ""} 
            onChange={(e) => onFilterChange({ ...filters, semester: e.target.value })}
            className="w-32 px-3 py-2 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            min="1"
          />
        </div>
        {isAdmin && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-on-surface-variant whitespace-nowrap">ID Guru:</label>
            <input 
              type="number" 
              placeholder="Filter ID guru..." 
              value={filters?.instructor_id || ""} 
              onChange={(e) => onFilterChange({ ...filters, instructor_id: e.target.value })}
              className="w-36 px-3 py-2 bg-surface-container-low border border-outline-variant/20 rounded-xl text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        )}
        {(filters?.semester || filters?.instructor_id) && (
          <button 
            onClick={() => onFilterChange({ semester: "", instructor_id: "" })}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-50 text-red-500 text-sm font-semibold hover:bg-red-100 transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
            Reset Filter
          </button>
        )}
        {loading && (
          <span className="material-symbols-outlined text-primary animate-spin ml-auto">progress_activity</span>
        )}
      </div>

      {!classes || classes.length === 0 ? (
        <div className="bg-surface-container-lowest p-16 rounded-xl border-2 border-dashed border-outline-variant/20 flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">inbox</span>
          <p className="text-on-surface font-bold text-xl mb-2">Tidak ada kelas ditemukan</p>
          <p className="text-on-surface-variant text-sm">Coba ubah filter atau tambahkan kelas baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {classes.map((cls, idx) => {
            const colors = [
              { banner: 'from-indigo-500 to-purple-600', badge: 'bg-indigo-50 text-indigo-600' },
              { banner: 'from-blue-500 to-cyan-600', badge: 'bg-blue-50 text-blue-600' },
              { banner: 'from-violet-500 to-pink-600', badge: 'bg-violet-50 text-violet-600' },
              { banner: 'from-emerald-500 to-teal-600', badge: 'bg-emerald-50 text-emerald-600' },
            ]
            const color = colors[idx % colors.length]
            return (
              <div 
                key={cls.id} 
                className="group bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/5 hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* Card Banner */}
                <div className={`relative h-28 bg-gradient-to-br ${color.banner} flex items-center justify-center overflow-hidden`}>
                  <span className="material-symbols-outlined text-white/50 text-6xl group-hover:scale-110 transition-transform duration-500" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-primary uppercase tracking-tight shadow-sm">
                    Sem. {cls.semester}
                  </div>
                  {/* Admin Action Buttons */}
                  {isAdmin && (
                    <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {!isArchivePage && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onEdit(cls); }} 
                          title="Edit"
                          className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-indigo-600 hover:bg-white transition-colors shadow-sm"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                      )}
                      {isArchivePage ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onUnarchive(cls.id); }} 
                          title="Keluarkan dari Arsip"
                          className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-green-600 hover:bg-white transition-colors shadow-sm"
                        >
                          <span className="material-symbols-outlined text-base">unarchive</span>
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onArchive(cls.id); }} 
                          title="Arsip"
                          className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-amber-600 hover:bg-white transition-colors shadow-sm"
                        >
                          <span className="material-symbols-outlined text-base">inventory_2</span>
                        </button>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(cls.id); }} 
                        title="Hapus Permanen"
                        className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-red-500 hover:bg-white transition-colors shadow-sm"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-5 flex flex-col flex-1">
                  <span className={`inline-block ${color.badge} px-2 py-0.5 rounded text-[11px] font-bold mb-2 self-start`}>{cls.code}</span>
                  <h4 className="text-base font-bold text-on-surface mb-1 leading-tight">{cls.name}</h4>
                  {cls.description && (
                    <p className="text-on-surface-variant text-xs mb-3 line-clamp-2 flex-1">{cls.description}</p>
                  )}
                  
                  <div className="mt-auto pt-3 border-t border-outline-variant/10">
                    <div className="flex items-center justify-between text-xs text-on-surface-variant mb-3">
                      <span className="flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                        {cls.academic_year}
                      </span>
                      {cls.max_students && (
                        <span className="flex items-center gap-1 font-medium">
                          <span className="material-symbols-outlined text-sm">group</span>
                          Max {cls.max_students}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => onSelect(cls)} 
                      className="w-full primary-gradient text-on-primary py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm shadow-primary/20"
                    >
                      <span>Lihat Detail</span>
                      <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
};

export default ClassList;
