"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, MapPin, Navigation, Coffee, Users, Target, Laptop, Lightbulb, Settings, Info, Utensils, Plane, Award, List } from "lucide-react";

type EventItem = {
  time: string;
  title: string;
  description?: string;
  location?: string;
  icon: any;
  type: string;
};

export default function SchedulePage() {
  const [view, setView] = useState<'list' | 'week'>('week');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const days = [
    {
      id: "day0",
      shortLabel: "Mon 30",
      label: "Mon, Mar 30",
      date: "Monday, March 30th",
      isoDate: "2026-03-30",
      events: [
        { time: "All Day", title: "Travel", description: "Safe travels to the venue!", icon: Plane, type: "travel" }
      ]
    },
    {
      id: "day1",
      shortLabel: "Tue 31",
      label: "Tue, Mar 31",
      date: "Tuesday, March 31st",
      isoDate: "2026-03-31",
      events: [
        { time: "8:00 AM", title: "Breakfast", description: "Arrive no later than 8:30.", icon: Coffee, type: "food" },
        { time: "9:00 AM", title: "Welcome!", description: "Overview of workshop and objectives", icon: Users, type: "keynote" },
        { time: "9:30 AM", title: "GenStudio overview", description: "Key features, functions & applications.", icon: Target, type: "session" },
        { time: "11:00 AM", title: "Architecture", description: "Deep dive into GenStudio architecture, data flow and how to phase a rollout.", icon: Laptop, type: "technical" },
        { time: "1:15 PM", title: "Demo", description: "End to end demo of a complete GenStudio environment and Q&A.", icon: Laptop, type: "demo" },
        { time: "3:30 PM", title: "Org readiness", description: "Change management and value realisation.", icon: Settings, type: "business" },
        { time: "4:30 PM", title: "Wrap up & QA", description: "Review of today's learning and Q&A.", icon: Lightbulb, type: "qa" },
        { time: "6:30 PM", title: "OAP Team Dinner", location: "Bona Vita Italian Bistro", description: "Join us for dinner and networking!", icon: Utensils, type: "social" }
      ]
    },
    {
      id: "day2",
      shortLabel: "Wed 01",
      label: "Wed, Apr 1",
      date: "Wednesday, April 1st",
      isoDate: "2026-04-01",
      events: [
        { time: "8:00 AM", title: "Breakfast", description: "Fuel up for day 2!", icon: Coffee, type: "food" },
        { time: "9:00 AM", title: "Day 1 recap", description: "Review of day 1 plus housekeeping", icon: Info, type: "session" },
        { time: "9:15 AM", title: "WIP, R&A and Enterprise Storage", description: "Overview of Work in Progress, Review & Approval and Enterprise Storage.", icon: Target, type: "technical" },
        { time: "10:45 AM", title: "Metadata Strategy", description: "Important considerations for a customer's metadata.", icon: Settings, type: "technical" },
        { time: "1:00 PM", title: "Use Cases", description: "Fireside chat exploring real-life customer use cases.", icon: Users, type: "business" },
        { time: "3:15 PM", title: "Extensibility & Automation", description: "Overview of technical skills required to use App Builder.", icon: Laptop, type: "technical" },
        { time: "4:30 PM", title: "Wrap up & QA", description: "Review of today's learning and Q&A.", icon: Lightbulb, type: "qa" }
      ]
    },
    {
      id: "day3",
      shortLabel: "Thu 02",
      label: "Thu, Apr 2",
      date: "Thursday, April 2nd",
      isoDate: "2026-04-02",
      events: [
        { time: "8:00 AM", title: "Breakfast", description: "Final breakfast together.", icon: Coffee, type: "food" },
        { time: "9:00 AM", title: "Day 2 recap", description: "Review of day 2 plus housekeeping", icon: Info, type: "session" },
        { time: "9:15 AM", title: "IMS & Permissions", description: "Discussion on Identity Management and Permissions strategy.", icon: Settings, type: "technical" },
        { time: "10:00 AM", title: "Implementation Guidance", description: "Recommendations on how best to staff an engagement.", icon: MapPin, type: "business" },
        { time: "11:15 AM", title: "Roadmap and leadership POV", description: "What's coming in the year ahead.", icon: Navigation, type: "keynote" },
        { time: "12:15 PM", title: "Close", description: "Key takeaways from the last three days.", icon: Award, type: "qa" },
        { time: "Afternoon", title: "Travel", description: "Travel home (Thu PM or Fri AM)", icon: Plane, type: "travel" }
      ]
    }
  ];

  // Helper to parse "8:00 AM" and "2026-03-31" into a Date object
  const getEventDate = (isoDate: string, timeString: string) => {
    if (timeString === "All Day" || timeString === "Afternoon") {
      return new Date(`${isoDate}T12:00:00`);
    }
    const [time, modifier] = timeString.split(' ');
    const timeParts = time.split(':');
    let hours = Number(timeParts[0]);
    const minutes = Number(timeParts[1]);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    
    const hh = hours.toString().padStart(2, '0');
    const mm = minutes.toString().padStart(2, '0');
    return new Date(`${isoDate}T${hh}:${mm}:00`);
  };

  const getDayTotalMinutes = (timeString: string) => {
    const d = getEventDate("2026-01-01", timeString);
    return d.getHours() * 60 + d.getMinutes();
  };

  // Find the exact "next" event out of ALL events
  const findNextEvent = (): EventItem | null => {
    let nextEvent: EventItem | null = null;
    let closestTimeDiff = Infinity;

    days.forEach(day => {
      day.events.forEach((event: any) => {
        const eventDate = getEventDate(day.isoDate, event.time);
        const diff = eventDate.getTime() - currentTime.getTime();
        
        if (diff > 0 && diff < closestTimeDiff) {
          closestTimeDiff = diff;
          nextEvent = event as EventItem;
        }
      });
    });
    
    return nextEvent;
  };

  const nextUpcomingEvent = findNextEvent();

  const renderEventList = (events: EventItem[]) => (
    <div className="space-y-4 pt-4 pb-12">
      {events.map((event, index) => {
        const isNext = nextUpcomingEvent?.title === event.title && nextUpcomingEvent?.time === event.time;
        
        return (
          <div key={index} className={`relative bg-white dark:bg-[#18181b] border ${isNext ? 'border-adobe-red shadow-lg shadow-adobe-red/10 scale-[1.02]' : 'border-gray-100 dark:border-white/5'} rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden`}>
            {isNext && <div className="absolute inset-0 bg-adobe-red/5 pointer-events-none" />}
            {event.type === 'food' && <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-400" />}
            {event.type === 'keynote' && <div className="absolute top-0 left-0 w-1.5 h-full bg-adobe-red" />}
            {event.type === 'technical' && <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />}
            {event.type === 'social' && <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500" />}
            
            <div className="flex items-start md:items-center flex-col md:flex-row gap-4 md:gap-6 ml-2 relative z-10">
              <div className="flex items-center space-x-2 text-sm font-semibold text-gray-500 dark:text-gray-400 md:w-28 shrink-0">
                <Clock size={16} className={`text-gray-400 ${isNext ? 'text-adobe-red animate-pulse' : ''}`} />
                <span className={isNext ? 'text-adobe-red' : ''}>{event.time}</span>
              </div>
              <div className="flex-1">
                {isNext && (
                  <span className="inline-block px-2 py-0.5 bg-adobe-red text-white text-[10px] font-bold tracking-widest uppercase rounded mb-2 animate-bounce">
                    Up Next
                  </span>
                )}
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{event.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">{event.description}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Week View Logic
  const HOURS_START = 8; // 8 AM
  const HOURS_END = 20; // 8 PM
  const totalHours = HOURS_END - HOURS_START;
  const HOUR_HEIGHT = 80; // pixels per hour
  
  const bgColors: Record<string, string> = {
    food: "bg-orange-100 border-orange-200 text-orange-900 dark:bg-orange-900/40 dark:border-orange-800/50 dark:text-orange-100",
    keynote: "bg-red-100 border-red-200 text-red-900 dark:bg-red-900/40 dark:border-red-800/50 dark:text-red-100",
    technical: "bg-blue-100 border-blue-200 text-blue-900 dark:bg-blue-900/40 dark:border-blue-800/50 dark:text-blue-100",
    social: "bg-purple-100 border-purple-200 text-purple-900 dark:bg-purple-900/40 dark:border-purple-800/50 dark:text-purple-100",
    session: "bg-teal-100 border-teal-200 text-teal-900 dark:bg-teal-900/40 dark:border-teal-800/50 dark:text-teal-100",
    business: "bg-indigo-100 border-indigo-200 text-indigo-900 dark:bg-indigo-900/40 dark:border-indigo-800/50 dark:text-indigo-100",
    qa: "bg-amber-100 border-amber-200 text-amber-900 dark:bg-amber-900/40 dark:border-amber-800/50 dark:text-amber-100",
    demo: "bg-sky-100 border-sky-200 text-sky-900 dark:bg-sky-900/40 dark:border-sky-800/50 dark:text-sky-100",
    travel: "bg-gray-100 border-gray-200 text-gray-900 dark:bg-gray-800/80 dark:border-gray-700/50 dark:text-gray-200"
  };

  return (
    <div className="pb-20 min-h-screen bg-white dark:bg-[#09090b] flex flex-col">
      
      {/* Header & Toggle */}
      <div className="p-4 md:p-6 bg-white dark:bg-[#09090b] border-b border-gray-200 dark:border-white/5 z-20 sticky top-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold dark:text-white tracking-tight flex items-center space-x-2">
               <CalendarIcon className="text-adobe-red" />
               <span>GenStudio Week</span>
            </h1>
          </div>
          
          <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-lg">
            <button 
              onClick={() => setView('week')}
              className={`flex-1 flex justify-center items-center space-x-2 px-6 py-1.5 rounded-md text-sm font-medium transition-all duration-300 ${view === 'week' ? 'bg-white dark:bg-[#18181b] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <span>Week</span>
            </button>
            <button 
              onClick={() => setView('list')}
              className={`flex-1 flex justify-center items-center space-x-2 px-6 py-1.5 rounded-md text-sm font-medium transition-all duration-300 ${view === 'list' ? 'bg-white dark:bg-[#18181b] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List size={14} />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {view === 'list' ? (
        <div className="max-w-3xl mx-auto w-full px-4 overflow-y-auto flex-1">
          {days.map((day) => (
            <div key={day.id}>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white sticky top-0 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-md py-4 z-10 border-b border-gray-200/50 dark:border-white/5">
                {day.date}
              </h2>
              {renderEventList(day.events)}
            </div>
          ))}
        </div>
      ) : (
        /* GOOGLE CALENDAR WEEK VIEW */
        <div className="flex-1 overflow-auto flex max-w-7xl mx-auto w-full bg-white dark:bg-[#09090b]">
           {/* Time Axis Row Headings */}
           <div className="w-16 flex-shrink-0 border-r border-gray-200 dark:border-white/5 bg-white dark:bg-[#09090b]">
              <div className="h-20 border-b border-gray-200 dark:border-white/5" /> {/* Empty corner */}
              <div className="relative" style={{ height: totalHours * HOUR_HEIGHT }}>
                 {Array.from({ length: totalHours + 1 }).map((_, i) => {
                   const hour = i + HOURS_START;
                   const label = hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
                   return (
                     <div key={i} className="absolute w-full flex justify-end pr-2 -mt-2" style={{ top: i * HOUR_HEIGHT }}>
                       <span className="text-[10px] text-gray-400 font-medium">{label}</span>
                     </div>
                   )
                 })}
              </div>
           </div>

           {/* Days Columns */}
           <div className="flex-1 flex min-w-[600px] md:min-w-0">
             {days.map((day) => (
               <div key={day.id} className="flex-1 relative border-r border-gray-200 dark:border-white/5 flex flex-col">
                 
                 {/* Day Header */}
                 <div className="h-20 flex flex-col items-center justify-center border-b border-gray-200 dark:border-white/5 sticky top-0 bg-white/95 dark:bg-[#09090b]/95 z-20">
                   <span className="text-xs text-gray-500 uppercase font-semibold">{day.label.split(',')[0]}</span>
                   <span className="text-2xl font-normal text-gray-900 dark:text-white">{day.shortLabel.split(' ')[1]}</span>
                 </div>

                 {/* All Day Events Wrapper */}
                 <div className="w-full px-1 py-1 min-h-[40px] border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02]">
                    {day.events.filter(e => e.time === "All Day" || e.time === "Afternoon").map((event, i) => (
                       <div key={i} className={`text-[10px] p-1.5 mb-1 rounded border ${bgColors[event.type]} truncate`}>
                          <strong>{event.title}</strong>
                       </div>
                    ))}
                 </div>

                 {/* Grid lines and blocks */}
                 <div className="relative flex-1" style={{ height: totalHours * HOUR_HEIGHT }}>
                   {/* Horizontal grid lines */}
                   {Array.from({ length: totalHours }).map((_, i) => (
                     <div key={i} className="absolute w-full border-t border-gray-100 dark:border-white/[0.03]" style={{ top: i * HOUR_HEIGHT }} />
                   ))}

                   {/* Event Blocks */}
                   {day.events.filter(e => e.time !== "All Day" && e.time !== "Afternoon").map((event, index) => {
                       const startMins = getDayTotalMinutes(event.time) - (HOURS_START * 60);
                       const top = (startMins / 60) * HOUR_HEIGHT;
                       
                       // Try to infer duration based on next event or standard length
                       let durationMinutes = 60; // default 1 hour
                       const nextEvent = day.events[index + 1];
                       if (nextEvent && nextEvent.time !== "All Day" && nextEvent.time !== "Afternoon") {
                          durationMinutes = getDayTotalMinutes(nextEvent.time) - getDayTotalMinutes(event.time);
                       }
                       if (durationMinutes <= 0) durationMinutes = 60;
                       
                       const height = (durationMinutes / 60) * HOUR_HEIGHT;
                       
                       const isNext = nextUpcomingEvent?.title === event.title && nextUpcomingEvent?.time === event.time;

                       return (
                         <div 
                           key={index}
                           className={`absolute left-1 right-1 rounded-md border p-1.5 overflow-hidden transition-all hover:z-30 hover:shadow-md cursor-pointer ${bgColors[event.type || 'session']} ${isNext ? 'ring-2 ring-adobe-red shadow-lg animate-pulse z-20' : 'z-10'}`}
                           style={{ top, height: Math.max(height - 2, 20) }}
                         >
                           <div className="flex items-start space-x-1">
                             <span className="font-semibold text-[11px] leading-tight block truncate">
                               {event.title}
                             </span>
                           </div>
                           {height > 40 && (
                             <span className="text-[10px] leading-tight opacity-80 block truncate mt-0.5">
                               {event.time}
                             </span>
                           )}
                           {height > 60 && event.location && (
                             <span className="text-[9px] leading-tight opacity-70 block truncate mt-1">
                               📍 {event.location}
                             </span>
                           )}
                         </div>
                       );
                   })}

                   {/* Current Time Indicator Line (Only on current actual day, approximated for demo) */}
                   <div className="absolute w-full z-20" style={{ 
                      top: ((currentTime.getHours() * 60 + currentTime.getMinutes()) - HOURS_START * 60) / 60 * HOUR_HEIGHT,
                      display: currentTime.getHours() >= HOURS_START && currentTime.getHours() < HOURS_END ? 'block' : 'none'
                   }}>
                     <div className="flex items-center absolute -left-1.5 -top-1.5">
                        <div className="w-3 h-3 rounded-full bg-adobe-red" />
                        <div className="w-full h-0.5 bg-adobe-red opacity-60 ml-0.5" style={{ width: '200%' }} />
                     </div>
                   </div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
}
