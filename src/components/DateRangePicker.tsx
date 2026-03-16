import { useState, useRef, useEffect } from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths
} from 'date-fns'
import 'react-day-picker/style.css'

export interface DateRangeValue {
  startDate: string
  endDate: string
}

interface Props {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
}

const fmt = (d: Date) => format(d, 'yyyy-MM-dd')

function getPresets(): { label: string; range: () => DateRangeValue }[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return [
    { label: 'Today', range: () => ({ startDate: fmt(today), endDate: fmt(today) }) },
    { label: 'Yesterday', range: () => ({ startDate: fmt(subDays(today, 1)), endDate: fmt(subDays(today, 1)) }) },
    { label: 'This week', range: () => ({ startDate: fmt(startOfWeek(today, { weekStartsOn: 1 })), endDate: fmt(today) }) },
    { label: 'Last 7 days', range: () => ({ startDate: fmt(subDays(today, 6)), endDate: fmt(today) }) },
    { label: 'Last week', range: () => {
      const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 })
      return { startDate: fmt(lastWeekStart), endDate: fmt(endOfWeek(lastWeekStart, { weekStartsOn: 1 })) }
    }},
    { label: 'Last 14 days', range: () => ({ startDate: fmt(subDays(today, 13)), endDate: fmt(today) }) },
    { label: 'This month', range: () => ({ startDate: fmt(startOfMonth(today)), endDate: fmt(today) }) },
    { label: 'Last 30 days', range: () => ({ startDate: fmt(subDays(today, 29)), endDate: fmt(today) }) },
    { label: 'Last month', range: () => {
      const lastMonth = subMonths(today, 1)
      return { startDate: fmt(startOfMonth(lastMonth)), endDate: fmt(endOfMonth(lastMonth)) }
    }},
    { label: 'All time', range: () => ({ startDate: '2020-01-01', endDate: fmt(today) }) },
  ]
}

export default function DateRangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarRange, setCalendarRange] = useState<DateRange | undefined>()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setShowCalendar(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const presets = getPresets()

  // Find matching preset label
  const activePreset = presets.find(p => {
    const r = p.range()
    return r.startDate === value.startDate && r.endDate === value.endDate
  })

  const displayText = activePreset
    ? activePreset.label
    : `${value.startDate} - ${value.endDate}`

  function handlePreset(preset: typeof presets[0]) {
    onChange(preset.range())
    setOpen(false)
    setShowCalendar(false)
  }

  function handleCalendarSelect(range: DateRange | undefined) {
    setCalendarRange(range)
    if (range?.from && range?.to) {
      onChange({ startDate: fmt(range.from), endDate: fmt(range.to) })
      setOpen(false)
      setShowCalendar(false)
    }
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {displayText}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
          {!showCalendar ? (
            <div className="py-2 w-48">
              {presets.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => handlePreset(preset)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    activePreset?.label === preset.label
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                <button
                  onClick={() => {
                    setShowCalendar(true)
                    setCalendarRange({
                      from: new Date(value.startDate + 'T00:00:00'),
                      to: new Date(value.endDate + 'T00:00:00')
                    })
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Custom range...
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3">
              <DayPicker
                mode="range"
                selected={calendarRange}
                onSelect={handleCalendarSelect}
                numberOfMonths={1}
                disabled={{ after: new Date() }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
