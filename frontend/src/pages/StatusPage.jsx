import React, { useState, useEffect } from 'react';
import { fetchAuthMetrics, fetchItemMetrics, fetchGatewayHealth } from '../services/api';

const ServiceCard = ({ title, status, data }) => {
  const getStatusColor = (status, data) => {
    if (status === 'unreachable') return 'bg-slate-500';
    if (status === 'healthy') {
      if (data && data.error_rate_percent > 10) return 'bg-amber-500';
      if (data && data.error_rate_percent > 50) return 'bg-red-500';
      return 'bg-emerald-500';
    }
    return 'bg-slate-500';
  };

  const getStatusText = (status, data) => {
    if (status === 'unreachable') return 'Unreachable';
    if (status === 'healthy') {
      if (data && data.error_rate_percent > 10) return 'Degraded';
      if (data && data.error_rate_percent > 50) return 'Unhealthy';
      return 'Healthy';
    }
    return 'Unknown';
  };

  const color = getStatusColor(status, data);
  const text = getStatusText(status, data);

  // Parse metrics
  const uptime = data?.uptime_seconds || 0;
  const requests = data?.total_requests || 0;
  const errors = data?.total_errors || 0;
  const errorRate = data?.error_rate_percent || 0;
  const avgLatency = data?.latency?.avg_ms || 0;
  const p95Latency = data?.latency?.p95_ms || 0;

  return (
    <div className="bg-surface-container-lowest dark:bg-[#1a1928] p-6 rounded-2xl border border-outline-variant/10 dark:border-white/5 shadow-sm flex flex-col hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-on-surface dark:text-white flex items-center gap-3">
          <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-xl">dns</span>
          {title}
        </h3>
        <div className={`px-3 py-1 rounded-full text-white text-xs font-bold uppercase flex items-center gap-1.5 ${color}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
          {text}
        </div>
      </div>

      {status === 'healthy' && data?.total_requests !== undefined ? (
        <div className="space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-low dark:bg-white/5 p-3 rounded-xl">
              <p className="text-xs text-on-surface-variant dark:text-slate-400 mb-1">Total Requests</p>
              <p className="text-xl font-bold text-on-surface dark:text-white">{requests.toLocaleString()}</p>
            </div>
            <div className="bg-surface-container-low dark:bg-white/5 p-3 rounded-xl">
              <p className="text-xs text-on-surface-variant dark:text-slate-400 mb-1">Total Errors</p>
              <p className="text-xl font-bold text-red-500">{errors.toLocaleString()}</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-on-surface-variant dark:text-slate-400">Error Rate</span>
              <span className="font-bold text-on-surface dark:text-white">{errorRate.toFixed(2)}%</span>
            </div>
            {/* Visual Chart for Error Rate */}
            <div className="w-full bg-surface-container-high dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full ${errorRate > 10 ? 'bg-red-500' : 'bg-emerald-500'} transition-all duration-500`}
                style={{ width: `${Math.min(errorRate, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-outline-variant/10 dark:border-white/5 mt-auto">
            <div>
              <p className="text-xs text-on-surface-variant dark:text-slate-400">Avg Latency</p>
              <p className="font-semibold text-on-surface dark:text-white">{avgLatency} ms</p>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant dark:text-slate-400">P95 Latency</p>
              <p className="font-semibold text-on-surface dark:text-white">{p95Latency} ms</p>
            </div>
          </div>
          
          <div className="pt-2">
            <p className="text-xs text-on-surface-variant dark:text-slate-400 font-medium">
              Uptime: {Math.floor(uptime / 3600)}h {Math.floor((uptime % 3600)/60)}m {Math.floor(uptime % 60)}s
            </p>
          </div>
        </div>
      ) : status === 'healthy' ? (
        <div className="flex-1 flex items-center justify-center py-8">
           <p className="text-emerald-500 font-medium flex items-center gap-2">
             <span className="material-symbols-outlined">check_circle</span>
             Gateway is operational
           </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-10 opacity-70">
           <span className="material-symbols-outlined text-4xl mb-2 text-slate-500">cloud_off</span>
           <p className="text-on-surface-variant dark:text-slate-500 italic font-medium">Service Unreachable</p>
        </div>
      )}
    </div>
  );
};

const StatusPage = () => {
  const [services, setServices] = useState({
    auth: { status: 'loading', data: null },
    item: { status: 'loading', data: null },
    gateway: { status: 'loading', data: null },
  });
  
  const [lastChecked, setLastChecked] = useState(null);
  const [countdown, setCountdown] = useState(10);
  
  const fetchStatus = async () => {
    const [auth, item, gateway] = await Promise.all([
      fetchAuthMetrics(),
      fetchItemMetrics(),
      fetchGatewayHealth()
    ]);
    
    setServices({ auth, item, gateway });
    setLastChecked(new Date());
    setCountdown(10);
  };

  useEffect(() => {
    fetchStatus();
    
    // Auto refresh every 10 seconds logic
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchStatus();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-surface dark:bg-[#0f0e17] text-on-surface dark:text-slate-100 p-8 pt-12 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <a href="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-4 font-semibold">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back to App
            </a>
            <h1 className="text-4xl font-black text-indigo-600 dark:text-indigo-400">System Status</h1>
            <p className="text-on-surface-variant dark:text-slate-400 mt-2">Real-time health and metrics of all microservices</p>
          </div>
          
          <div className="flex items-center gap-4 bg-surface-container-lowest dark:bg-[#1a1928] py-2 px-4 rounded-xl border border-outline-variant/10 dark:border-white/5 shadow-sm">
            <div className="text-right">
              <p className="text-xs text-on-surface-variant dark:text-slate-400">Last Checked</p>
              <p className="font-semibold text-sm">
                {lastChecked ? lastChecked.toLocaleTimeString() : '...'}
              </p>
            </div>
            <div className="w-px h-8 bg-outline-variant/20 dark:bg-white/10"></div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <span className="material-symbols-outlined">refresh</span>
              Refreshing in {countdown}s
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ServiceCard title="API Gateway" status={services.gateway.status} data={services.gateway.data} />
          <ServiceCard title="Auth Service" status={services.auth.status} data={services.auth.data} />
          <ServiceCard title="Item Service" status={services.item.status} data={services.item.data} />
        </div>
      </div>
    </div>
  );
};

export default StatusPage;
