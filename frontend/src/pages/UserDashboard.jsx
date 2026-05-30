import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getUsername } from "../services/auth";
import Calendar from "../components/Calendar";
import MoodCheckPopup from "../components/MoodCheckPopup";
import { shouldShowMoodCheck, saveMood, getMoodHistory, getStreaks } from "../services/moodCheckService";
import Sidebar from "../components/Sidebar";
import HabitsCard from "../components/HabitsCard";
import GoalsCard from "../components/GoalsCard";
import { Settings, Flame, Plus, Menu } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import MobileMenu from '../components/MobileMenu';
import { getJournals } from "../services/journalService";
import { getHabitHistory } from "../services/habitService";
import { Book, CheckCircle2 } from 'lucide-react';
import { getUserGroups, getGroupSessionsList, rsvpGroupSession } from "../services/communityService";
import { showError } from "../utils/uiFeedback";

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const username = getUsername();
  const [selectedDate, setSelectedDate] = useState(null);
  const [moodHistory, setMoodHistory] = useState([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [showMoodPopup, setShowMoodPopup] = useState(false);
  const [moodPeriod, setMoodPeriod] = useState(null);
  const [loading, setLoading] = useState(true);

  const [moodStreak, setMoodStreak] = useState({ current: 0, best: 0 });
  const [habitStreak, setHabitStreak] = useState({ current: 0, best: 0 });

  const [journals, setJournals] = useState([]);
  const [habitHistory, setHabitHistory] = useState([]);

  // Group sessions state
  const [groupSessions, setGroupSessions] = useState([]); // [{...session, groupName, groupId}]
  const [, setGroupMap] = useState({}); // {groupId: groupName}
  const [loadingSessions, setLoadingSessions] = useState(true);


  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    checkMoodStatus();
    fetchMoodHistory();
    fetchStreaks();
    fetchAllData();
    fetchAllGroupSessions();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dateParam = params.get("date");
    if (!dateParam) return;

    const parsed = new Date(`${dateParam}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      setSelectedDate(parsed);
    }
  }, [location.search]);

  // Fetch all user groups and their sessions
  const fetchAllGroupSessions = async () => {
    setLoadingSessions(true);
    try {
      const groupsRes = await getUserGroups();
      const groups = groupsRes.groups || [];
      const groupIdNameMap = {};
      groups.forEach(g => { groupIdNameMap[g._id] = g.name; });
      setGroupMap(groupIdNameMap);
      // Fetch sessions for all groups in parallel
      const sessionsArr = await Promise.all(
        groups.map(async g => {
          try {
            const res = await getGroupSessionsList(g._id);
            // Attach group info to each session
            return (res.sessions || []).map(s => ({ ...s, groupId: g._id, groupName: g.name }));
          } catch {
            return [];
          }
        })
      );
      // Flatten
      setGroupSessions(sessionsArr.flat());
    } catch (err) {
      setGroupSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchStreaks = async () => {
    try {
      const streaks = await getStreaks();
      setMoodStreak(streaks.moodStreak);
      setHabitStreak(streaks.habitStreak);
    } catch (error) {
      console.error("Error fetching streaks:", error);
    }
  };

  const fetchMoodHistory = async () => {
    try {
      const history = await getMoodHistory();
      setMoodHistory(history);
    } catch (error) {
      console.error("Error fetching mood history:", error);
    }
  };

  const checkMoodStatus = async () => {
    try {
      const checkMood = await shouldShowMoodCheck();
      if (checkMood.show) {
        setShowMoodPopup(true);
        setMoodPeriod(checkMood.period);
      }
    } catch (error) {
      console.error("Error checking mood:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      const [journalData, historyData] = await Promise.all([
        getJournals(),
        getHabitHistory(1, 100)
      ]);
      // console.log("journals sample:", journals[0]);
      // console.log("habitHistory sample:", habitHistory[0]);

      setJournals(journalData);
      setHabitHistory(historyData.data || []);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const getSelectedDateDetails = () => {
    if (!selectedDate) return null;

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Helper to convert any date to local YYYY-MM-DD
    const toLocalDateStr = (raw) => {
      const d = new Date(raw);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const mood = moodHistory.find(entry => toLocalDateStr(entry.date) === dateStr);

    // Use createdAt as fallback if j.date doesn't exist
    const dayJournals = journals.filter(j => toLocalDateStr(j.date || j.createdAt) === dateStr);

    const habitDay = habitHistory.find(h => toLocalDateStr(h.date || h.createdAt) === dateStr);

    return { mood, journalCount: dayJournals.length, habits: habitDay };
  };
  const details = getSelectedDateDetails();

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleMoodSelect = async (moodData) => {
    try {
      const result = await saveMood(moodData, moodPeriod);
      setShowMoodPopup(false);

      if (result.moodStreak) {
        setMoodStreak(result.moodStreak);
      }

      await fetchMoodHistory();
      await fetchStreaks();

      navigate('/journal', {
        state: {
          fromMoodCheck: true,
          mood: moodData.value,
          period: moodPeriod
        }
      });
    } catch (error) {
      console.error("Error saving mood:", error);
      showError("Failed to save mood. Please try again.");
    }
  };

  const handleCloseMoodPopup = () => {
    setShowMoodPopup(false);
  };

  const StreaksCard = () => (
    <div className="bg-[#f8ba90] dark:bg-gray-700 rounded-[40px] p-6 shadow-lg flex flex-col min-h-0 max-h-[340px] overflow-y-auto border-2 border-[#f4873e]/20">
      <div className="mb-3">
        <h3 className="text-[#1F3B36] dark:text-gray-200 text-sm uppercase tracking-wide font-bold">Check-in Streak</h3>
        <div className="flex items-center justify-center mt-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#f4873e] to-[#ff9e5e] rounded-full flex items-center justify-center shadow-md">
              <Flame className="w-5 h-5 text-white" fill="#f4873e" />
            </div>
            <div className="flex items-center">
              <span className="text-4xl font-bold text-white dark:text-orange-200">{moodStreak.current}</span>
              <span className="text-lg font-bold text-white/80 dark:text-orange-200/80 ml-2">days</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-auto ">
        <div className="bg-white/80 dark:bg-gray-600/80 rounded-xl p-3 backdrop-blur-sm border border-[#f4873e]/10"
        >
          <p className="text-[#2d6b57] dark:text-gray-300 text-xs mb-1">Best Streak</p>
          <p className="text-xl font-bold text-[#8b5a2b] dark:text-orange-300">{moodStreak.best}</p>
        </div>
        <div className="bg-white/80 dark:bg-gray-600/80 rounded-xl p-3 backdrop-blur-sm border border-[#f4873e]/10"
        >
          <p className="text-[#2d6b57] dark:text-gray-300 text-xs mb-1">Habit Streak</p>
          <p className="text-xl font-bold text-[#2d6b57] dark:text-green-400">{habitStreak.current}</p>
        </div>
      </div>
    </div>
  );

  const getSelectedDateMood = () => {
    if (!selectedDate || !moodHistory.length) return null;

    const dateStr = selectedDate.toISOString().split('T')[0];
    return moodHistory.find(entry =>
      new Date(entry.date).toISOString().split('T')[0] === dateStr
    );
  };

  const selectedDateMood = getSelectedDateMood();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <p className="text-gray-900 dark:text-white">Loading...</p>
      </div>
    );
  }

  return (
    <>
      {showMoodPopup && (
        <MoodCheckPopup
          onMoodSelect={handleMoodSelect}
          onClose={handleCloseMoodPopup}
        />
      )}

      <div className="min-h-screen bg-white dark:bg-gray-900 p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 relative">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setShowMobileMenu(true)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border-2 border-gray-200 dark:border-gray-700"
        >
          <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </button>

        <Sidebar />

        <MobileMenu isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} type="user" />

        <div className="flex-1 lg:ml-28 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-[50px] p-4 lg:p-8 shadow-[0_10px_25px_rgba(248,186,144,0.25)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)] relative max-h-[775px] overflow-y-auto">
          <div className="flex justify-between items-start mb-6"
            style={{ fontFamily: "Brasika" }}>
            <h1 className="text-3xl font-bold">
              <span className="text-[#f4873e] dark:text-orange-400">Welcome, </span>
              <span className="text-green-900 dark:text-green-400">{username || "User"}</span>
            </h1>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-x-auto">
            <div className="flex-shrink-0 w-full lg:w-auto">
              <Calendar
                onDateSelect={handleDateSelect}
                moodData={moodHistory}
                journals={journals}
                habitHistory={habitHistory}
                sessions={groupSessions}
              />
            </div>

            <div className="flex-shrink-0 w-full lg:w-[480px] h-[600px] bg-[#f4f2f0] dark:bg-gray-700 rounded-2xl p-4 lg:p-6 shadow-inner overflow-y-auto">
              {selectedDate ? (
                <div>
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    {selectedDate.toDateString()}
                  </h2>

                  {/* Mood Section */}
                  {selectedDateMood ? (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">Mood</h3>
                      <div className="space-y-3">
                        {selectedDateMood.morning && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                            <img
                              src={selectedDateMood.morning.emoji}
                              alt={selectedDateMood.morning.label}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <p className="font-medium text-gray-800 dark:text-gray-100">Morning</p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{selectedDateMood.morning.label}</p>
                            </div>
                          </div>
                        )}
                        {selectedDateMood.evening && (
                          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                            <img
                              src={selectedDateMood.evening.emoji}
                              alt={selectedDateMood.evening.label}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <p className="font-medium text-gray-800 dark:text-gray-100">Evening</p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{selectedDateMood.evening.label}</p>
                            </div>
                          </div>
                        )}
                        {!selectedDateMood.morning && !selectedDateMood.evening && (
                          <p className="text-gray-500 dark:text-gray-400 text-sm">No mood logged for this day</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">Mood</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No mood logged for this day</p>
                    </div>
                  )}

                  {/* Group Sessions Section */}
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-semibold mb-3 text-blue-700 dark:text-blue-300">Group Sessions</h3>
                    {loadingSessions ? (
                      <p className="text-gray-400 dark:text-gray-500 text-sm">Loading sessions...</p>
                    ) : null}
                    {(() => {
                      // Find sessions for this date
                      const year = selectedDate.getFullYear();
                      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                      const day = String(selectedDate.getDate()).padStart(2, '0');
                      const dateStr = `${year}-${month}-${day}`;
                      const sessionsForDay = groupSessions.filter(s => {
                        const d = new Date(s.scheduledAt);
                        const sy = d.getFullYear();
                        const sm = String(d.getMonth() + 1).padStart(2, '0');
                        const sd = String(d.getDate()).padStart(2, '0');
                        return `${sy}-${sm}-${sd}` === dateStr;
                      });
                      if (!loadingSessions && sessionsForDay.length === 0) {
                        return <p className="text-gray-400 dark:text-gray-500 text-sm">No group sessions for this day.</p>;
                      }
                      return sessionsForDay.map(session => (
                        <div key={session._id} className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-700 mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-blue-800 dark:text-blue-200">{session.groupName}</span>
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-200 dark:bg-blue-700 text-blue-900 dark:text-blue-100">{session.status}</span>
                          </div>
                          <div className="font-semibold text-gray-900 dark:text-white">{session.topic}</div>
                          {session.description && <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">{session.description}</div>}
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            {new Date(session.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          <button
                            className={`px-4 py-1 rounded-full text-sm font-semibold transition ${session.hasRsvp ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50" : "bg-[#89beab] hover:bg-[#6fa893] text-white"}`}
                            onClick={async () => {
                              try {
                                await rsvpGroupSession(session._id);
                                fetchAllGroupSessions();
                              } catch (err) {
                                showError("Failed to RSVP: " + (err.message || "Unknown error"));
                              }
                            }}
                          >
                            {session.hasRsvp ? "RSVPed" : "RSVP"}
                          </button>
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Daily Activity Section */}
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">Daily Activity</h3>
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-600 rounded-xl shadow-sm border border-gray-100 dark:border-gray-500">
                      <div className="flex items-center gap-3">
                        <Book className="w-5 h-5 text-[#f4873e]" />
                        <span className="font-medium">Journals</span>
                      </div>
                      <span className="font-bold text-[#f4873e]">{details?.journalCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-600 rounded-xl shadow-sm border border-gray-100 dark:border-gray-500">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Habits</span>
                      </div>
                      <span className="font-bold text-green-600">
                        {details?.habits ? `${details.habits.completedCount}/${details.habits.totalCount}` : "0/0"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 text-lg">
                  Select a date to view your entries
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/journal')}
            className="absolute bottom-2 right-4 bg-[#89beab] dark:bg-teal-600 text-white p-5 rounded-full shadow-lg hover:bg-[#FFA669] dark:hover:bg-teal-700 hover:shadow-xl transition-all flex items-center gap-2 group"
          >
            <Plus className="w-6 h-6" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
              New Entry
            </span>
          </button>
        </div>

        <div className="absolute top-4 lg:top-6 right-4 lg:right-6 flex items-center gap-4 lg:gap-6">
          <NotificationBell />

          <button
            onClick={() => navigate('/settings')}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg"
          >
            <Settings className="w-7 h-7 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <div className="w-full lg:w-80 flex flex-col gap-4 lg:gap-5 pt-4 lg:pt-20">
          <StreaksCard />
          <HabitsCard />
          <GoalsCard />
        </div>
      </div>
    </>
  );
};

export default UserDashboard;