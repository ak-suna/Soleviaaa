import React, { useRef } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Smile } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const MoodDistribution = ({ data, selectedMood, onMoodSelect, range, onRangeChange }) => {
    const chartRef = useRef(null);

    const moodImages = {
        happy: '/emojis/happy.png',
        excited: '/emojis/excited.png',
        neutral: '/emojis/neutral.png',
        sad: '/emojis/sad.png',
        angry: '/emojis/angry.png',
        anxious: '/emojis/anxious.png',
        tired: '/emojis/tired.png',
    };

    const moodColors = {
        happy: '#fda9dd',
        excited: '#fac3c7',
        neutral: '#d5e6e5',
        sad: '#92b1e7',
        angry: '#eb6577',
        anxious: '#bfa8e6',
        tired: '#94a6d1'
    };

    const moodKeys = Object.keys(data || {});

    const chartData = {
        labels: moodKeys.map(mood => `${mood.charAt(0).toUpperCase() + mood.slice(1)}`),
        datasets: [
            {
                data: Object.values(data || {}),
                backgroundColor: moodKeys.map(mood =>
                    selectedMood && selectedMood !== mood
                        ? moodColors[mood] + '55' // fade non-selected
                        : moodColors[mood]
                ),
                borderColor: '#ffffff',
                borderWidth: 2,
                hoverOffset: 6
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, elements) => {
            if (elements.length > 0) {
                const index = elements[0].index;
                const clickedMood = moodKeys[index];
                // Toggle off if already selected
                onMoodSelect && onMoodSelect(selectedMood === clickedMood ? null : clickedMood);
            }
        },
        plugins: {
            legend: {
                display: false // we build a custom legend below
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleFont: { size: 13 },
                bodyFont: { size: 12 },
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: function (context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        return `${label}: ${value}%`;
                    }
                }
            }
        },
        cutout: '62%'
    };

    const maxMood = Object.entries(data || {}).reduce((a, b) => a[1] > b[1] ? a : b, ['neutral', 0]);

    return (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-3xl p-6 border-2 border-gray-200 dark:border-gray-600 h-full flex flex-col">

            {/* Main Component Heading with integrated Context Filter */}
            <div className="flex justify-between items-center mb-4 gap-2">
                <div className="flex items-center gap-2">
                    <Smile className="w-5 h-5 text-[#f4873e] dark:text-orange-400" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white" style={{ fontFamily: "Brasika" }}>
                        Mood Distribution
                    </h3>
                </div>

                <div className="flex items-center gap-3">
                    {/* Local inline filter controls */}
                    {onRangeChange && (
                        <div className="flex items-center bg-gray-200/70 dark:bg-gray-600 p-1 rounded-xl shadow-inner">
                            {[7, 30, 90].map((days) => (
                                <button
                                    key={days}
                                    onClick={() => onRangeChange(days)}
                                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all duration-200 ${range === days
                                            ? 'bg-white dark:bg-gray-500 text-[#f4873e] dark:text-orange-400 shadow-sm'
                                            : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'
                                        }`}
                                >
                                    {days}D
                                </button>
                            ))}
                        </div>
                    )}

                    {selectedMood && (
                        <button
                            onClick={() => onMoodSelect && onMoodSelect(null)}
                            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline whitespace-nowrap"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Chart — taller now */}
            <div className="relative flex-1" style={{ minHeight: '220px' }}>
                <Doughnut ref={chartRef} data={chartData} options={options} />
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <img
                        src={selectedMood ? moodImages[selectedMood] : moodImages[maxMood[0]]}
                        alt={selectedMood ? selectedMood : maxMood[0]}
                        className="w-10 h-10 mb-1"
                        draggable="false"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {selectedMood ? selectedMood.charAt(0).toUpperCase() + selectedMood.slice(1) : 'Most Common'}
                    </span>
                </div>
            </div>

            {/* Custom legend — clickable */}
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                {moodKeys.map(mood => (
                    <button
                        key={mood}
                        onClick={() => onMoodSelect && onMoodSelect(selectedMood === mood ? null : mood)}
                        className={`flex items-center gap-2 text-left transition-opacity ${selectedMood && selectedMood !== mood ? 'opacity-40' : 'opacity-100'}`}
                    >
                        <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ background: moodColors[mood] }}
                        />
                        <img
                            src={moodImages[mood]}
                            alt={mood}
                            className="w-5 h-5"
                            draggable="false"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                            {mood.charAt(0).toUpperCase() + mood.slice(1)}
                        </span>
                        <span className="text-xs text-gray-400 ml-auto">{(data && data[mood]) || 0}%</span>
                    </button>
                ))}
            </div>

            {selectedMood && (
                <p className="mt-3 text-xs text-center text-[#89beab] dark:text-teal-400">
                    Highlighted days in the mood trend above show when you felt {selectedMood}
                </p>
            )}
        </div>
    );
};

export default MoodDistribution;