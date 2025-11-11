'use client';

import { useState } from 'react';
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

interface TimeSlot {
  hour: number;
  minute: number;
  available: boolean;
}

interface SessionCalendarProps {
  onSelectDateTime: (date: Date) => void;
  selectedDate?: Date;
  disabledDates?: Date[];
}

/**
 * Basic Session Scheduling Calendar Component
 * Allows tutors and students to select date and time for sessions
 */
export default function SessionCalendar({
  onSelectDateTime,
  selectedDate,
  disabledDates = [],
}: SessionCalendarProps) {
  const [selectedDateState, setSelectedDateState] = useState<Date>(
    selectedDate || new Date()
  );
  const [selectedTime, setSelectedTime] = useState<{ hour: number; minute: number } | null>(null);

  // Generate available time slots (9 AM to 9 PM, hourly)
  const timeSlots: TimeSlot[] = [];
  for (let hour = 9; hour <= 21; hour++) {
    timeSlots.push({ hour, minute: 0, available: true });
    if (hour < 21) {
      timeSlots.push({ hour, minute: 30, available: true });
    }
  }

  // Get days in current month
  const year = selectedDateState.getFullYear();
  const month = selectedDateState.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const isDateDisabled = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    // Disable past dates
    if (checkDate < today) return true;
    
    // Check against disabled dates
    return disabledDates.some((disabledDate) => {
      const d = new Date(disabledDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === checkDate.getTime();
    });
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(year, month, day);
    if (!isDateDisabled(newDate)) {
      setSelectedDateState(newDate);
      setSelectedTime(null); // Reset time when date changes
    }
  };

  const handleTimeSelect = (hour: number, minute: number) => {
    setSelectedTime({ hour, minute });
  };

  const handleConfirm = () => {
    if (selectedTime) {
      const finalDate = new Date(selectedDateState);
      finalDate.setHours(selectedTime.hour, selectedTime.minute, 0, 0);
      onSelectDateTime(finalDate);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => {
    setSelectedDateState(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setSelectedDateState(new Date(year, month + 1, 1));
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
          <CalendarIcon className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Schedule Session</h3>
          <p className="text-sm text-gray-500">Select date and time</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="mb-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px]"
            aria-label="Previous month"
          >
            ←
          </button>
          <h4 className="text-lg font-semibold text-gray-900">
            {monthNames[month]} {year}
          </h4>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px]"
            aria-label="Next month"
          >
            →
          </button>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-gray-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const date = new Date(year, month, day);
            const isDisabled = isDateDisabled(date);
            const isSelected =
              selectedDateState.getDate() === day &&
              selectedDateState.getMonth() === month &&
              selectedDateState.getFullYear() === year;
            const isToday =
              date.toDateString() === new Date().toDateString();

            return (
              <button
                key={day}
                onClick={() => handleDateSelect(day)}
                disabled={isDisabled}
                className={`aspect-square rounded-xl font-semibold transition-all min-w-[44px] min-h-[44px] ${
                  isSelected
                    ? 'bg-primary-600 text-white shadow-md'
                    : isToday
                    ? 'bg-primary-50 text-primary-700 border-2 border-primary-300'
                    : isDisabled
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
                aria-label={`Select ${monthNames[month]} ${day}, ${year}`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Selection */}
      {selectedDateState && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <ClockIcon className="h-5 w-5 text-gray-500" />
            <h4 className="text-sm font-semibold text-gray-700">Select Time</h4>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-[200px] overflow-y-auto">
            {timeSlots.map((slot) => {
              const isSelected =
                selectedTime?.hour === slot.hour &&
                selectedTime?.minute === slot.minute;
              const timeString = `${slot.hour.toString().padStart(2, '0')}:${slot.minute.toString().padStart(2, '0')}`;

              return (
                <button
                  key={`${slot.hour}-${slot.minute}`}
                  onClick={() => handleTimeSelect(slot.hour, slot.minute)}
                  disabled={!slot.available}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-all min-w-[44px] min-h-[44px] ${
                    isSelected
                      ? 'bg-primary-600 text-white shadow-md'
                      : slot.available
                      ? 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  aria-label={`Select ${timeString}`}
                >
                  {timeString}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirm Button */}
      {selectedTime && (
        <Button
          onClick={handleConfirm}
          variant="primary"
          className="w-full"
        >
          Confirm: {selectedDateState.toLocaleDateString()} at{' '}
          {selectedTime.hour.toString().padStart(2, '0')}:
          {selectedTime.minute.toString().padStart(2, '0')}
        </Button>
      )}
    </div>
  );
}

