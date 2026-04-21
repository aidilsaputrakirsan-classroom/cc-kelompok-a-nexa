import { useState, useEffect } from "react"
import { getTeam } from "../services/api"

function TeamInfo() {
  const [team, setTeam] = useState(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (isOpen && !team) {
      getTeam().then(setTeam).catch(console.error)
    }
  }, [isOpen])

  const avatarColors = [
    'from-indigo-500 to-purple-600',
    'from-blue-500 to-cyan-600', 
    'from-violet-500 to-pink-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
  ]

  return (
    <>
      {/* FAB Button */}
      <button 
        onClick={() => setIsOpen(true)} 
        className="fixed bottom-6 right-6 flex items-center gap-2 primary-gradient text-on-primary py-3 px-5 rounded-full font-semibold text-sm shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all z-50"
      >
        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
        Tim Kami
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false) }}
        >
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in">
            {/* Modal Header */}
            <div className="relative h-28 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-end px-6 pb-4">
              <div className="absolute inset-0 opacity-20">
                <span className="material-symbols-outlined text-white absolute right-4 top-2 text-[80px]" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
              </div>
              <div className="relative z-10 flex-1">
                <h2 className="text-xl font-bold text-white">Tim Pengembang</h2>
                {team && <p className="text-indigo-100 text-sm font-medium">{team.team}</p>}
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="relative z-10 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Member List */}
            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              {!team ? (
                <div className="flex items-center justify-center py-8">
                  <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                </div>
              ) : (
                team?.members?.map((m, i) => (
                  <div 
                    key={i} 
                    className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant/5 hover:border-primary/20 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} text-white flex items-center justify-center font-bold text-base flex-shrink-0`}>
                      {m.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-on-surface text-sm truncate">{m.name}</p>
                      <p className="text-on-surface-variant text-xs">{m.nim}</p>
                    </div>
                    <span className="bg-primary/10 text-primary text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
                      {m.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default TeamInfo
