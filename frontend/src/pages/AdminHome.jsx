// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { logout, getToken } from "../services/auth";
// import {
//     LogOut, Settings, Users, AlertTriangle, Trophy, Layers,
//     Lightbulb, TrendingUp, TrendingDown, RefreshCw,
// } from 'lucide-react';
// import AdminSidebar from "../components/AdminSidebar";
// import NotificationBell from "../components/NotificationBell";
// import {
//     BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
//     PieChart, Pie, Cell, Legend
// } from "recharts";

// const ADMIN_FILTERED_NOTIFICATION_TYPES = [
//     "MOOD_REMINDER_MORNING",
//     "MOOD_REMINDER_EVENING",
//     "JOURNAL_REMINDER",
//     "HABIT_REMINDER",
// ];

// const API = "http://localhost:5000/api";

// const authHeaders = () => ({
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${getToken()}`,
// });

// const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n);

// const Delta = ({ value }) => {
//     if (value === null || value === undefined) return null;
//     const up = value >= 0;
//     return (
//         <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${up ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"}`}>
//             {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
//             {up ? "+" : ""}{value}
//         </span>
//     );
// };

// const StatCard = ({ icon: Icon, iconBg, iconColor, borderHover, label, value, sub, delta, onClick, loading }) => (
//     <button
//         onClick={onClick}
//         className={`group flex items-center justify-between bg-white dark:bg-gray-800 p-6 rounded-[28px] border-2 border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl ${borderHover} transition-all duration-300 text-left w-full`}
//     >
//         <div className="flex-1">
//             <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
//                 <Icon className={`w-6 h-6 ${iconColor}`} />
//             </div>
//             <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{label}</p>
//             {loading ? (
//                 <div className="h-8 w-16 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse" />
//             ) : (
//                 <div className="flex items-end gap-2">
//                     <span className="text-3xl font-black text-gray-900 dark:text-white" style={{ fontFamily: "Brasika" }}>
//                         {fmt(value ?? 0)}
//                     </span>
//                     {delta !== undefined && <Delta value={delta} />}
//                 </div>
//             )}
//             {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
//         </div>
//         <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center ml-4 flex-shrink-0 group-hover:bg-gray-300 dark:group-hover:bg-gray-500 transition-colors">
//             <span className="font-bold text-lg text-gray-400">→</span>
//         </div>
//     </button>
// );

// const CustomTooltip = ({ active, payload, label }) => {
//     if (!active || !payload?.length) return null;
//     return (
//         <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl px-4 py-2 shadow-xl text-sm">
//             <p className="font-bold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
//             {payload.map((p, i) => (
//                 <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>
//             ))}
//         </div>
//     );
// };

// const AdminHome = () => {
//     const navigate = useNavigate();
//     const [showSettings, setShowSettings] = useState(false);
//     const [loading, setLoading] = useState(true);
//     const [refreshing, setRefreshing] = useState(false);
//     const [userStats, setUserStats] = useState(null);
//     const [reportStats, setReportStats] = useState(null);
//     const [challengeStats, setChallengeStats] = useState(null);
//     const [groupStats, setGroupStats] = useState(null);

//     const fetchAll = async (silent = false) => {
//         if (!silent) setLoading(true);
//         else setRefreshing(true);
//         try {
//             const [usersRes, reportsRes, challengesRes, groupsRes] = await Promise.all([
//                 fetch(`${API}/admin/users`, { headers: authHeaders() }),
//                 fetch(`${API}/reports/stats`, { headers: authHeaders() }),
//                 fetch(`${API}/challenges/templates`, { headers: authHeaders() }),
//                 fetch(`${API}/groups?limit=100`, { headers: authHeaders() }),
//             ]);

//             if (usersRes.ok) {
//                 const users = await usersRes.json();
//                 const active = users.filter(u => !u.disabled).length;
//                 const disabled = users.filter(u => u.disabled).length;
//                 const verified = users.filter(u => u.isVerified).length;
//                 const admins = users.filter(u => u.role === "admin").length;
//                 const now = Date.now();
//                 const weeklyGrowth = Array.from({ length: 6 }, (_, i) => {
//                     const weekStart = now - (6 - i) * 7 * 86400000;
//                     const weekEnd = weekStart + 7 * 86400000;
//                     const count = users.filter(u => {
//                         const t = new Date(u.createdAt).getTime();
//                         return t >= weekStart && t < weekEnd;
//                     }).length;
//                     const label = new Date(weekStart).toLocaleDateString("en", { month: "short", day: "numeric" });
//                     return { week: label, users: count };
//                 });
//                 setUserStats({ total: users.length, active, disabled, verified, admins, weeklyGrowth });
//             }

//             if (reportsRes.ok) {
//                 const r = await reportsRes.json();
//                 setReportStats(r);
//             }

//             if (challengesRes.ok) {
//                 const c = await challengesRes.json();
//                 const templates = c.templates || [];
//                 const active = templates.filter(t => t.status === "active").length;
//                 const diffMap = { Easy: 0, Medium: 0, Hard: 0 };
//                 templates.forEach(t => {
//                     const key = t.difficulty ? t.difficulty.charAt(0).toUpperCase() + t.difficulty.slice(1) : null;
//                     if (key && diffMap[key] !== undefined) diffMap[key]++;
//                 });
//                 const diffData = Object.entries(diffMap).map(([k, v]) => ({ name: k, value: v }));
//                 setChallengeStats({ total: templates.length, active, eligible: c.eligibleCount ?? 0, diffData });
//             }

//             if (groupsRes.ok) {
//                 const g = await groupsRes.json();
//                 const groups = g.groups || [];
//                 const totalMembers = groups.reduce((s, gr) => s + (gr.memberCount || gr.members?.length || 0), 0);
//                 const catMap = {};
//                 groups.forEach(gr => { catMap[gr.category] = (catMap[gr.category] || 0) + 1; });
//                 const catData = Object.entries(catMap).map(([k, v]) => ({ name: k, value: v }));
//                 setGroupStats({ total: g.total || groups.length, totalMembers, catData });
//             }
//         } catch (e) {
//             console.error("Admin dashboard fetch error:", e);
//         } finally {
//             setLoading(false);
//             setRefreshing(false);
//         }
//     };

//     useEffect(() => { fetchAll(); }, []);

//     const buildInsights = () => {
//         const insights = [];
//         if (reportStats?.pendingReports > 0)
//             insights.push(`🚨 ${reportStats.pendingReports} report${reportStats.pendingReports > 1 ? "s" : ""} pending review — action required.`);
//         if (userStats?.disabled > 0)
//             insights.push(`⚠️ ${userStats.disabled} user account${userStats.disabled > 1 ? "s are" : " is"} currently disabled.`);
//         if (userStats && userStats.total > 0 && (userStats.verified / userStats.total) < 0.7)
//             insights.push(`📧 Less than 70% of users have verified their email.`);
//         if (challengeStats?.eligible > 0)
//             insights.push(`🏆 ${challengeStats.eligible} challenge template${challengeStats.eligible > 1 ? "s are" : " is"} eligible to go live.`);
//         if (groupStats?.total > 0 && groupStats.total > 0 && groupStats.totalMembers / groupStats.total < 5)
//             insights.push(`👥 Average group size is low — consider promoting groups to users.`);
//         if (insights.length === 0)
//             insights.push("✅ Everything looks healthy! All systems running smoothly.");
//         return insights;
//     };

//     const ORANGE = "#f4873e";
//     const TEAL = "#89beab";
//     const PIE_COLORS = [ORANGE, TEAL, "#f8ba90", "#6fa893", "#ffd199", "#4a9e87"];

//     const reportPieData = reportStats ? [
//         { name: "Pending", value: reportStats.pendingReports || 0 },
//         { name: "Resolved", value: reportStats.resolvedReports || 0 },
//         { name: "Dismissed", value: reportStats.dismissedReports || 0 },
//     ].filter(d => d.value > 0) : [];

//     const insights = buildInsights();

//     return (
//         <div
//             className="min-h-screen bg-white dark:bg-gray-900 p-6 flex gap-6 relative"
//             onClick={() => showSettings && setShowSettings(false)}
//         >
//             <AdminSidebar />

//             <div className="flex-1 ml-28 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-[50px] p-8 shadow-[0_10px_25px_rgba(248,186,144,0.25)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)] relative overflow-y-auto max-h-[calc(100vh-48px)]">

//                 {/* Header */}
//                 <div className="flex justify-between items-center mb-6" style={{ fontFamily: "Brasika" }}>
//                     <h1 className="text-4xl font-bold">
//                         <span className="text-[#f4873e] dark:text-orange-400">Admin </span>
//                         <span className="text-[#89beab] dark:text-teal-400">Dashboard</span>
//                     </h1>
//                     <button
//                         onClick={() => fetchAll(true)}
//                         disabled={refreshing}
//                         className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all text-sm font-semibold"
//                     >
//                         <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
//                         Refresh
//                     </button>
//                 </div>

//                 {/* System Health Banner */}
//                 <div className="mb-6 bg-gradient-to-r from-[#f8ba90] to-[#f4873e] rounded-3xl p-5 shadow-lg flex flex-wrap justify-between items-center gap-4 text-white">
//                     <div className="flex items-center gap-4">
//                         <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
//                         <div>
//                             <h3 className="font-bold text-lg">All Systems Operational</h3>
//                             <p className="text-white/80 text-xs font-medium">Real-time data • Click Refresh to update</p>
//                         </div>
//                     </div>
//                     <div className="flex gap-3">
//                         {[
//                             { label: "Total Users", value: userStats?.total },
//                             { label: "Active", value: userStats?.active },
//                             { label: "Pending Reports", value: reportStats?.pendingReports },
//                         ].map(({ label, value }) => (
//                             <div key={label} className="bg-white/20 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/30 text-center min-w-[90px]">
//                                 <p className="text-[10px] uppercase tracking-wider font-bold opacity-90 mb-0.5">{label}</p>
//                                 {loading ? (
//                                     <div className="h-6 w-10 bg-white/30 rounded animate-pulse mx-auto" />
//                                 ) : (
//                                     <p className="text-xl font-black">{value ?? "—"}</p>
//                                 )}
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 {/* Insights */}
//                 {!loading && (
//                     <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-4 border-2 border-yellow-200 dark:border-yellow-800">
//                         <div className="flex items-start gap-3">
//                             <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
//                             <div>
//                                 <h3 className="text-sm font-bold text-yellow-900 dark:text-yellow-300 mb-2">Admin Insights</h3>
//                                 <div className="space-y-1">
//                                     {insights.map((ins, i) => (
//                                         <p key={i} className="text-yellow-800 dark:text-yellow-200 text-sm">• {ins}</p>
//                                     ))}
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 )}

//                 {/* Stat Cards */}
//                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//                     <StatCard
//                         icon={Users} iconBg="bg-orange-100 dark:bg-orange-900/30" iconColor="text-[#f4873e]"
//                         borderHover="hover:border-[#f4873e]"
//                         label="Total Users" value={userStats?.total}
//                         sub={`${userStats?.active ?? "—"} active · ${userStats?.disabled ?? "—"} disabled`}
//                         onClick={() => navigate("/admin/users")} loading={loading}
//                     />
//                     <StatCard
//                         icon={AlertTriangle} iconBg="bg-red-100 dark:bg-red-900/30" iconColor="text-red-500"
//                         borderHover="hover:border-red-500"
//                         label="Pending Reports" value={reportStats?.pendingReports}
//                         sub={`${reportStats?.totalReports ?? "—"} total reports`}
//                         onClick={() => navigate("/admin/reports")} loading={loading}
//                     />
//                     <StatCard
//                         icon={Trophy} iconBg="bg-yellow-100 dark:bg-yellow-900/30" iconColor="text-yellow-500"
//                         borderHover="hover:border-yellow-500"
//                         label="Challenge Templates" value={challengeStats?.total}
//                         sub={`${challengeStats?.active ?? "—"} active · ${challengeStats?.eligible ?? "—"} eligible`}
//                         onClick={() => navigate("/admin/challenges")} loading={loading}
//                     />
//                     <StatCard
//                         icon={Layers} iconBg="bg-teal-100 dark:bg-teal-900/30" iconColor="text-[#89beab]"
//                         borderHover="hover:border-[#89beab]"
//                         label="Support Groups" value={groupStats?.total}
//                         sub={`${groupStats?.totalMembers ?? "—"} total members`}
//                         onClick={() => navigate("/admin/groups")} loading={loading}
//                     />
//                 </div>

//                 {/* Charts Row 1: User Growth + Report Status Pie */}
//                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
//                     <div className="lg:col-span-2 bg-gray-50 dark:bg-gray-700/50 rounded-[28px] p-6 border border-gray-200 dark:border-gray-700">
//                         <h3 className="font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: "Brasika" }}>User Registrations</h3>
//                         <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">New sign-ups per week (last 6 weeks)</p>
//                         {loading ? (
//                             <div className="h-48 bg-gray-200 dark:bg-gray-600 rounded-2xl animate-pulse" />
//                         ) : (
//                             <ResponsiveContainer width="100%" height={180}>
//                                 <BarChart data={userStats?.weeklyGrowth || []} barSize={28}>
//                                     <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
//                                     <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={28} />
//                                     <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(244,135,62,0.08)" }} />
//                                     <Bar dataKey="users" name="New Users" fill={ORANGE} radius={[8, 8, 0, 0]} />
//                                 </BarChart>
//                             </ResponsiveContainer>
//                         )}
//                     </div>

//                     <div className="bg-gray-50 dark:bg-gray-700/50 rounded-[28px] p-6 border border-gray-200 dark:border-gray-700">
//                         <h3 className="font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: "Brasika" }}>Report Status</h3>
//                         <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">All-time breakdown</p>
//                         {loading ? (
//                             <div className="h-48 bg-gray-200 dark:bg-gray-600 rounded-2xl animate-pulse" />
//                         ) : reportPieData.length === 0 ? (
//                             <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No reports yet</div>
//                         ) : (
//                             <ResponsiveContainer width="100%" height={180}>
//                                 <PieChart>
//                                     <Pie data={reportPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={72}
//                                         dataKey="value" nameKey="name" paddingAngle={3}>
//                                         {reportPieData.map((_, i) => (
//                                             <Cell key={i} fill={[ORANGE, TEAL, "#f8ba90"][i % 3]} />
//                                         ))}
//                                     </Pie>
//                                     <Tooltip content={<CustomTooltip />} />
//                                     <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
//                                 </PieChart>
//                             </ResponsiveContainer>
//                         )}
//                     </div>
//                 </div>

//                 {/* Charts Row 2 */}
//                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
//                     {/* User breakdown progress bars */}
//                     <div className="bg-gray-50 dark:bg-gray-700/50 rounded-[28px] p-6 border border-gray-200 dark:border-gray-700">
//                         <h3 className="font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "Brasika" }}>User Breakdown</h3>
//                         {loading ? (
//                             <div className="space-y-3">
//                                 {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-gray-200 dark:bg-gray-600 rounded-xl animate-pulse" />)}
//                             </div>
//                         ) : (
//                             <div className="space-y-4">
//                                 {[
//                                     { label: "Verified", value: userStats?.verified, total: userStats?.total, color: "bg-teal-400" },
//                                     { label: "Active", value: userStats?.active, total: userStats?.total, color: "bg-orange-400" },
//                                     { label: "Disabled", value: userStats?.disabled, total: userStats?.total, color: "bg-red-400" },
//                                     { label: "Admins", value: userStats?.admins, total: userStats?.total, color: "bg-yellow-400" },
//                                 ].map(({ label, value, total, color }) => {
//                                     const pct = total > 0 ? Math.round((value / total) * 100) : 0;
//                                     return (
//                                         <div key={label}>
//                                             <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
//                                                 <span>{label}</span>
//                                                 <span>{value ?? "—"} <span className="text-gray-400">({pct}%)</span></span>
//                                             </div>
//                                             <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
//                                                 <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
//                                             </div>
//                                         </div>
//                                     );
//                                 })}
//                             </div>
//                         )}
//                     </div>

//                     {/* Challenge Difficulty */}
//                     <div className="bg-gray-50 dark:bg-gray-700/50 rounded-[28px] p-6 border border-gray-200 dark:border-gray-700">
//                         <h3 className="font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: "Brasika" }}>Challenge Difficulty</h3>
//                         <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Template breakdown</p>
//                         {loading ? (
//                             <div className="h-48 bg-gray-200 dark:bg-gray-600 rounded-2xl animate-pulse" />
//                         ) : (
//                             <ResponsiveContainer width="100%" height={170}>
//                                 <PieChart>
//                                     <Pie data={challengeStats?.diffData || []} cx="50%" cy="50%"
//                                         outerRadius={64} dataKey="value" nameKey="name" paddingAngle={3}>
//                                         {(challengeStats?.diffData || []).map((_, i) => (
//                                             <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
//                                         ))}
//                                     </Pie>
//                                     <Tooltip content={<CustomTooltip />} />
//                                     <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
//                                 </PieChart>
//                             </ResponsiveContainer>
//                         )}
//                     </div>

//                     {/* Group Categories */}
//                     <div className="bg-gray-50 dark:bg-gray-700/50 rounded-[28px] p-6 border border-gray-200 dark:border-gray-700">
//                         <h3 className="font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: "Brasika" }}>Group Categories</h3>
//                         <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Groups by category</p>
//                         {loading ? (
//                             <div className="h-48 bg-gray-200 dark:bg-gray-600 rounded-2xl animate-pulse" />
//                         ) : !groupStats?.catData?.length ? (
//                             <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No groups yet</div>
//                         ) : (
//                             <ResponsiveContainer width="100%" height={170}>
//                                 <BarChart data={groupStats.catData} layout="vertical" barSize={14}>
//                                     <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
//                                     <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={80} />
//                                     <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(137,190,171,0.08)" }} />
//                                     <Bar dataKey="value" name="Groups" fill={TEAL} radius={[0, 6, 6, 0]} />
//                                 </BarChart>
//                             </ResponsiveContainer>
//                         )}
//                     </div>
//                 </div>

//                 {/* Charts Row 3: Reports by Type + Top Reasons */}
//                 {!loading && reportStats && (
//                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//                         <div className="bg-gray-50 dark:bg-gray-700/50 rounded-[28px] p-6 border border-gray-200 dark:border-gray-700">
//                             <h3 className="font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "Brasika" }}>Reports by Type</h3>
//                             {reportStats.reportsByType?.length > 0 ? (
//                                 <ResponsiveContainer width="100%" height={140}>
//                                     <BarChart data={reportStats.reportsByType.map(r => ({ name: r._id, count: r.count }))} barSize={36}>
//                                         <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
//                                         <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={24} />
//                                         <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(244,135,62,0.08)" }} />
//                                         <Bar dataKey="count" name="Reports" fill={ORANGE} radius={[8, 8, 0, 0]} />
//                                     </BarChart>
//                                 </ResponsiveContainer>
//                             ) : (
//                                 <p className="text-gray-400 text-sm text-center py-8">No report data</p>
//                             )}
//                         </div>

//                         <div className="bg-gray-50 dark:bg-gray-700/50 rounded-[28px] p-6 border border-gray-200 dark:border-gray-700">
//                             <h3 className="font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "Brasika" }}>Top Report Reasons</h3>
//                             {reportStats.reportsByReason?.length > 0 ? (
//                                 <div className="space-y-3">
//                                     {reportStats.reportsByReason.slice(0, 5).map(({ _id, count }) => {
//                                         const max = reportStats.reportsByReason[0]?.count || 1;
//                                         const pct = Math.round((count / max) * 100);
//                                         return (
//                                             <div key={_id}>
//                                                 <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 capitalize">
//                                                     <span>{_id?.replace(/-/g, " ")}</span>
//                                                     <span className="text-gray-400">{count}</span>
//                                                 </div>
//                                                 <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
//                                                     <div className="h-full bg-red-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
//                                                 </div>
//                                             </div>
//                                         );
//                                     })}
//                                 </div>
//                             ) : (
//                                 <p className="text-gray-400 text-sm text-center py-8">No reason data</p>
//                             )}
//                         </div>
//                     </div>
//                 )}
//             </div>

//             {/* Top Right: Notifications + Settings */}
//             <div className="absolute top-6 right-6 flex items-center gap-4 z-50">
//                 <NotificationBell filterTypes={ADMIN_FILTERED_NOTIFICATION_TYPES} />
//                 <div className="relative">
//                     <button
//                         onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
//                         className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all"
//                     >
//                         <Settings className="w-6 h-6 text-gray-600 dark:text-gray-300" />
//                     </button>
//                     {showSettings && (
//                         <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
//                             <button
//                                 onClick={logout}
//                                 className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold transition-colors"
//                             >
//                                 <LogOut className="w-5 h-5" />
//                                 Log Out
//                             </button>
//                         </div>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default AdminHome;
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout, getToken } from "../services/auth";
import {
    LogOut, Settings, Users, AlertTriangle, Trophy, Layers,
    Lightbulb, TrendingUp, TrendingDown, RefreshCw, User, Lock, Palette,
} from 'lucide-react';
import AdminSidebar from "../components/AdminSidebar";
import NotificationBell from "../components/NotificationBell";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from "recharts";
import config from "../config";

const ADMIN_FILTERED_NOTIFICATION_TYPES = [
    "MOOD_REMINDER_MORNING",
    "MOOD_REMINDER_EVENING",
    "JOURNAL_REMINDER",
    "HABIT_REMINDER",
];

const API = `${config.BACKEND_URL}/api`;

const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
});

const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n);

const Delta = ({ value }) => {
    if (value === null || value === undefined) return null;
    const up = value >= 0;
    return (
        <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${up ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"}`}>
            {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {up ? "+" : ""}{value}
        </span>
    );
};

const StatCard = ({ icon: Icon, iconBg, iconColor, borderHover, label, value, sub, delta, onClick, loading }) => (
    <button
        onClick={onClick}
        className={`group flex items-center justify-between bg-white dark:bg-gray-800 p-6 rounded-[28px] border-2 border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl ${borderHover} transition-all duration-300 text-left w-full`}
    >
        <div className="flex-1">
            <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{label}</p>
            {loading ? (
                <div className="h-8 w-16 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse" />
            ) : (
                <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-gray-900 dark:text-white" style={{ fontFamily: "Brasika" }}>
                        {fmt(value ?? 0)}
                    </span>
                    {delta !== undefined && <Delta value={delta} />}
                </div>
            )}
            {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center ml-4 flex-shrink-0 group-hover:bg-gray-300 dark:group-hover:bg-gray-500 transition-colors">
            <span className="font-bold text-lg text-gray-400">→</span>
        </div>
    </button>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl px-4 py-2 shadow-xl text-sm">
            <p className="font-bold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>
            ))}
        </div>
    );
};

const AdminHome = () => {
    const navigate = useNavigate();
    // const [showSettings, setShowSettings] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userStats, setUserStats] = useState(null);
    const [reportStats, setReportStats] = useState(null);
    const [challengeStats, setChallengeStats] = useState(null);
    const [groupStats, setGroupStats] = useState(null);

    const fetchAll = async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const [usersRes, reportsRes, challengesRes, groupsRes] = await Promise.all([
                fetch(`${API}/admin/users`, { headers: authHeaders() }),
                fetch(`${API}/reports/stats`, { headers: authHeaders() }),
                fetch(`${API}/challenges/templates`, { headers: authHeaders() }),
                fetch(`${API}/groups?limit=100`, { headers: authHeaders() }),
            ]);

            if (usersRes.ok) {
                const users = await usersRes.json();
                const active = users.filter(u => !u.disabled).length;
                const disabled = users.filter(u => u.disabled).length;
                const verified = users.filter(u => u.isVerified).length;
                const admins = users.filter(u => u.role === "admin").length;
                const now = Date.now();
                const weeklyGrowth = Array.from({ length: 6 }, (_, i) => {
                    const weekStart = now - (6 - i) * 7 * 86400000;
                    const weekEnd = weekStart + 7 * 86400000;
                    const count = users.filter(u => {
                        const t = new Date(u.createdAt).getTime();
                        return t >= weekStart && t < weekEnd;
                    }).length;
                    const label = new Date(weekStart).toLocaleDateString("en", { month: "short", day: "numeric" });
                    return { week: label, users: count };
                });
                setUserStats({ total: users.length, active, disabled, verified, admins, weeklyGrowth });
            }
            if (reportsRes.ok) setReportStats(await reportsRes.json());
            if (challengesRes.ok) {
                const c = await challengesRes.json();
                const templates = c.templates || [];
                const active = templates.filter(t => t.status === "active").length;
                const diffMap = { Easy: 0, Medium: 0, Hard: 0 };
                templates.forEach(t => {
                    const key = t.difficulty ? t.difficulty.charAt(0).toUpperCase() + t.difficulty.slice(1) : null;
                    if (key && diffMap[key] !== undefined) diffMap[key]++;
                });
                const diffData = Object.entries(diffMap).map(([k, v]) => ({ name: k, value: v }));
                setChallengeStats({ total: templates.length, active, eligible: c.eligibleCount ?? 0, diffData });
            }
            if (groupsRes.ok) {
                const g = await groupsRes.json();
                const groups = g.groups || [];
                const totalMembers = groups.reduce((s, gr) => s + (gr.memberCount || gr.members?.length || 0), 0);
                const catMap = {};
                groups.forEach(gr => { catMap[gr.category] = (catMap[gr.category] || 0) + 1; });
                const catData = Object.entries(catMap).map(([k, v]) => ({ name: k, value: v }));
                setGroupStats({ total: g.total || groups.length, totalMembers, catData });
            }
        } catch (e) {
            console.error("Admin dashboard fetch error:", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const buildInsights = () => {
        const insights = [];
        if (reportStats?.pendingReports > 0)
            insights.push(`🚨 ${reportStats.pendingReports} report${reportStats.pendingReports > 1 ? "s" : ""} pending review — action required.`);
        if (userStats?.disabled > 0)
            insights.push(`⚠️ ${userStats.disabled} user account${userStats.disabled > 1 ? "s are" : " is"} currently disabled.`);
        if (userStats && userStats.total > 0 && (userStats.verified / userStats.total) < 0.7)
            insights.push(`📧 Less than 70% of users have verified their email.`);
        if (challengeStats?.eligible > 0)
            insights.push(`🏆 ${challengeStats.eligible} challenge template${challengeStats.eligible > 1 ? "s are" : " is"} eligible to go live.`);
        if (groupStats?.total > 0 && groupStats.totalMembers / groupStats.total < 5)
            insights.push(`👥 Average group size is low — consider promoting groups to users.`);
        if (insights.length === 0)
            insights.push("✅ Everything looks healthy! All systems running smoothly.");
        return insights;
    };

    const ORANGE = "#f4873e";
    const TEAL = "#89beab";
    const PIE_COLORS = [ORANGE, TEAL, "#f8ba90", "#6fa893", "#ffd199", "#4a9e87"];

    const reportPieData = reportStats ? [
        { name: "Pending", value: reportStats.pendingReports || 0 },
        { name: "Resolved", value: reportStats.resolvedReports || 0 },
        { name: "Dismissed", value: reportStats.dismissedReports || 0 },
    ].filter(d => d.value > 0) : [];

    const insights = buildInsights();

    return (
        <div
            className="min-h-screen bg-white dark:bg-gray-900 p-6 flex gap-6 relative"
            // onClick={() => showSettings && setShowSettings(false)}
        >
            <AdminSidebar />

            <div className="flex-1 ml-28 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-[50px] p-8 shadow-[0_10px_25px_rgba(248,186,144,0.25)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)] relative overflow-y-auto max-h-[calc(100vh-48px)]">

                {/* ── HEADER: Title + Refresh + Notifications + Settings all in one row ── */}
                <div className="flex justify-between items-center mb-6" style={{ fontFamily: "Brasika" }}>
                    <h1 className="text-4xl font-bold">
                        <span className="text-[#f4873e] dark:text-orange-400">Admin </span>
                        <span className="text-[#89beab] dark:text-teal-400">Dashboard</span>
                    </h1>

                    {/* Right-side controls: Refresh · Bell · Settings */}
                    <div className="flex items-center gap-3">
                        {/* Refresh */}
                        <button
                            onClick={() => fetchAll(true)}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all text-sm font-semibold"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                            Refresh
                        </button>

                        {/* Notification Bell */}
                        <NotificationBell filterTypes={ADMIN_FILTERED_NOTIFICATION_TYPES} />

                        {/* Settings button - direct navigation */}
                        <button
                            onClick={() => navigate("/admin/settings")}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-700 shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-600 transition-all"
                        >
                            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                    </div>
                </div>

                {/* System Health Banner */}
                <div className="mb-6 bg-gradient-to-r from-[#f8ba90] to-[#f4873e] rounded-3xl p-5 shadow-lg flex flex-wrap justify-between items-center gap-4 text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
                        <div>
                            <h3 className="font-bold text-lg">All Systems Operational</h3>
                            <p className="text-white/80 text-xs font-medium">Real-time data • Click Refresh to update</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {[
                            { label: "Total Users", value: userStats?.total },
                            { label: "Active", value: userStats?.active },
                            { label: "Pending Reports", value: reportStats?.pendingReports },
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-white/20 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/30 text-center min-w-[90px]">
                                <p className="text-[10px] uppercase tracking-wider font-bold opacity-90 mb-0.5">{label}</p>
                                {loading ? (
                                    <div className="h-6 w-10 bg-white/30 rounded animate-pulse mx-auto" />
                                ) : (
                                    <p className="text-xl font-black">{value ?? "—"}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Insights */}
                {!loading && (
                    <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-4 border-2 border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-start gap-3">
                            <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-bold text-yellow-900 dark:text-yellow-300 mb-2">Admin Insights</h3>
                                <div className="space-y-1">
                                    {insights.map((ins, i) => (
                                        <p key={i} className="text-yellow-800 dark:text-yellow-200 text-sm">• {ins}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        icon={Users} iconBg="bg-orange-100 dark:bg-orange-900/30" iconColor="text-[#f4873e]"
                        borderHover="hover:border-[#f4873e]"
                        label="Total Users" value={userStats?.total}
                        sub={`${userStats?.active ?? "—"} active · ${userStats?.disabled ?? "—"} disabled`}
                        onClick={() => navigate("/admin/users")} loading={loading}
                    />
                    <StatCard
                        icon={AlertTriangle} iconBg="bg-red-100 dark:bg-red-900/30" iconColor="text-red-500"
                        borderHover="hover:border-red-500"
                        label="Pending Reports" value={reportStats?.pendingReports}
                        sub={`${reportStats?.totalReports ?? "—"} total reports`}
                        onClick={() => navigate("/admin/reports")} loading={loading}
                    />
                    <StatCard
                        icon={Trophy} iconBg="bg-yellow-100 dark:bg-yellow-900/30" iconColor="text-yellow-500"
                        borderHover="hover:border-yellow-500"
                        label="Challenge Templates" value={challengeStats?.total}
                        sub={`${challengeStats?.active ?? "—"} active · ${challengeStats?.eligible ?? "—"} eligible`}
                        onClick={() => navigate("/admin/challenges")} loading={loading}
                    />
                    <StatCard
                        icon={Layers} iconBg="bg-teal-100 dark:bg-teal-900/30" iconColor="text-[#89beab]"
                        borderHover="hover:border-[#89beab]"
                        label="Support Groups" value={groupStats?.total}
                        sub={`${groupStats?.totalMembers ?? "—"} total members`}
                        onClick={() => navigate("/admin/groups")} loading={loading}
                    />
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                    <div className="lg:col-span-2 bg-gray-50 dark:bg-gray-700/50 rounded-[28px] p-6 border border-gray-200 dark:border-gray-600">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: "Brasika" }}>User Registrations</h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">New sign-ups per week (last 6 weeks)</p>
                        {loading ? (
                            <div className="h-48 bg-gray-200 dark:bg-gray-600 rounded-2xl animate-pulse" />
                        ) : (
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={userStats?.weeklyGrowth || []} barSize={28}>
                                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={28} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(244,135,62,0.08)" }} />
                                    <Bar dataKey="users" name="New Users" fill={ORANGE} radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-[28px] p-6 border border-gray-200 dark:border-gray-600">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: "Brasika" }}>Report Status</h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">All-time breakdown</p>
                        {loading ? (
                            <div className="h-48 bg-gray-200 dark:bg-gray-600 rounded-2xl animate-pulse" />
                        ) : reportPieData.length === 0 ? (
                            <div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">No reports yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie data={reportPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={72}
                                        dataKey="value" nameKey="name" paddingAngle={3}>
                                        {reportPieData.map((_, i) => (
                                            <Cell key={i} fill={[ORANGE, TEAL, "#f8ba90"][i % 3]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-[28px] p-6 border border-gray-200 dark:border-gray-600">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "Brasika" }}>User Breakdown</h3>
                        {loading ? (
                            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-gray-200 dark:bg-gray-600 rounded-xl animate-pulse" />)}</div>
                        ) : (
                            <div className="space-y-4">
                                {[
                                    { label: "Verified", value: userStats?.verified, total: userStats?.total, color: "bg-teal-400" },
                                    { label: "Active", value: userStats?.active, total: userStats?.total, color: "bg-orange-400" },
                                    { label: "Disabled", value: userStats?.disabled, total: userStats?.total, color: "bg-red-400" },
                                    { label: "Admins", value: userStats?.admins, total: userStats?.total, color: "bg-yellow-400" },
                                ].map(({ label, value, total, color }) => {
                                    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return (
                                        <div key={label}>
                                            <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                                                <span>{label}</span>
                                                <span>{value ?? "—"} <span className="text-gray-400">({pct}%)</span></span>
                                            </div>
                                            <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                                <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-[28px] p-6 border border-gray-200 dark:border-gray-600">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: "Brasika" }}>Challenge Difficulty</h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Template breakdown</p>
                        {loading ? (
                            <div className="h-48 bg-gray-200 dark:bg-gray-600 rounded-2xl animate-pulse" />
                        ) : (
                            <ResponsiveContainer width="100%" height={170}>
                                <PieChart>
                                    <Pie data={challengeStats?.diffData || []} cx="50%" cy="50%"
                                        outerRadius={64} dataKey="value" nameKey="name" paddingAngle={3}>
                                        {(challengeStats?.diffData || []).map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-[28px] p-6 border border-gray-200 dark:border-gray-600">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1" style={{ fontFamily: "Brasika" }}>Group Categories</h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Groups by category</p>
                        {loading ? (
                            <div className="h-48 bg-gray-200 dark:bg-gray-600 rounded-2xl animate-pulse" />
                        ) : !groupStats?.catData?.length ? (
                            <div className="h-48 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">No groups yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={170}>
                                <BarChart data={groupStats.catData} layout="vertical" barSize={14}>
                                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={80} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(137,190,171,0.08)" }} />
                                    <Bar dataKey="value" name="Groups" fill={TEAL} radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Charts Row 3 */}
                {!loading && reportStats && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-[28px] p-6 border border-gray-200 dark:border-gray-600">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "Brasika" }}>Reports by Type</h3>
                            {reportStats.reportsByType?.length > 0 ? (
                                <ResponsiveContainer width="100%" height={140}>
                                    <BarChart data={reportStats.reportsByType.map(r => ({ name: r._id, count: r.count }))} barSize={36}>
                                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={24} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(244,135,62,0.08)" }} />
                                        <Bar dataKey="count" name="Reports" fill={ORANGE} radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">No report data</p>
                            )}
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-[28px] p-6 border border-gray-200 dark:border-gray-600">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "Brasika" }}>Top Report Reasons</h3>
                            {reportStats.reportsByReason?.length > 0 ? (
                                <div className="space-y-3">
                                    {reportStats.reportsByReason.slice(0, 5).map(({ _id, count }) => {
                                        const max = reportStats.reportsByReason[0]?.count || 1;
                                        const pct = Math.round((count / max) * 100);
                                        return (
                                            <div key={_id}>
                                                <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 capitalize">
                                                    <span>{_id?.replace(/-/g, " ")}</span>
                                                    <span className="text-gray-400">{count}</span>
                                                </div>
                                                <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                                    <div className="h-full bg-red-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-8">No reason data</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminHome;