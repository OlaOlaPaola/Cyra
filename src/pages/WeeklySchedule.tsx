import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import BottomNav from '../components/BottomNav';
import { getMockSchedule, ScheduledTask } from '../lib/mockSchedule';
import { getCyclePhase } from '../utils/cycleLogic';
import { getCurrentCycleDay } from '../utils/cycleCalculator';
import { loadUserData } from '../utils/storage';
import styles from './WeeklySchedule.module.css';

// Helper para obtener energyType de un task (compatible con ambos tipos)
function getEnergyType(task: any): "deep-work" | "admin" | "social" | "rest" {
  if (task.energyType) return task.energyType;
  // Si tiene energyLevel, mapearlo a energyType
  if (task.energyLevel === 'high') return 'deep-work';
  if (task.energyLevel === 'medium') return task.phase === 'Luteal' ? 'admin' : 'social';
  return 'rest';
}

const WeeklySchedule = () => {
  const navigate = useNavigate();
  const userData = loadUserData();
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Calcular día del ciclo automáticamente si hay lastPeriodDate
  const currentCycleDay = userData 
    ? getCurrentCycleDay(userData)
    : 6;
  
  // Handler para abrir el modal con la tarea seleccionada
  const handleTaskClick = (task: ScheduledTask) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };
  
  // Handler para cerrar el modal
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedTask(null);
  };
  
  // Get current week dates (7 days starting from today)
  const weekDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []);

  // Usar schedule del usuario si existe, sino usar mock
  const allTasks = useMemo(() => {
    if (userData?.schedule && userData.schedule.length > 0) {
      // Convertir tasks del usuario a formato compatible con WeeklySchedule
      return userData.schedule.map((task: any) => ({
        ...task,
        energyType: getEnergyType(task),
        cyclePhase: task.phase || getCyclePhase(currentCycleDay),
        cycleDay: currentCycleDay,
      })) as ScheduledTask[];
    }
    return getMockSchedule(currentCycleDay);
  }, [currentCycleDay, userData]);
  
  // Get current phase info
  const currentPhase = getCyclePhase(currentCycleDay);
  const phaseInfo = getPhaseInfo(currentPhase);
  
  // Calculate weekly summary
  const weeklySummary = useMemo(() => {
    const deepWorkCount = allTasks.filter(t => getEnergyType(t) === 'deep-work').length;
    const flexibleTasks = Math.floor(allTasks.length * 0.3);
    
    return {
      deepWorkBlocks: deepWorkCount,
      flexibleTasks,
      totalTasks: allTasks.length,
    };
  }, [allTasks]);
  
  // Get tasks for each day
  const tasksByDate = useMemo(() => {
    const map: Record<string, ScheduledTask[]> = {};
    weekDates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      map[dateStr] = allTasks.filter(task => task.date === dateStr);
    });
    return map;
  }, [weekDates, allTasks]);
  
  // Time slots (6 AM to 10 PM)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      slots.push(hour);
    }
    return slots;
  }, []);
  
  // Helper to convert time to minutes from start of day
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  // Helper to calculate position and height for a task block
  const getTaskPosition = (task: ScheduledTask) => {
    const startMinutes = timeToMinutes(task.startTime);
    const endMinutes = timeToMinutes(task.endTime);
    const duration = endMinutes - startMinutes;
    
    // Each hour slot is 60px tall, starting from 6 AM (360 minutes)
    const top = ((startMinutes - 360) / 60) * 60; // 60px per hour
    const height = (duration / 60) * 60;
    
    return { top, height };
  };
  
  return (
    <div className={styles.container}>
      <TopHeader userName="Luna" />
      
      <div className={styles.content}>
        {/* Cycle Phase Banner */}
        <div className={styles.phaseBanner}>
          <div className={styles.phaseContent}>
            <div className={styles.phaseDayLabel}>Day {currentCycleDay}</div>
            <h2 className={styles.phaseName}>{currentPhase}</h2>
            <p className={styles.phaseSubtitle}>{phaseInfo.subtitle}</p>
          </div>
          <div className={styles.phaseIllustration}>🌙</div>
        </div>
        
        {/* Weekly Summary Card */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>📊</div>
          <div className={styles.summaryContent}>
            <h3 className={styles.summaryTitle}>This week at a glance</h3>
            <ul className={styles.summaryList}>
              <li>{weeklySummary.deepWorkBlocks} deep work blocks scheduled</li>
              <li>{weeklySummary.flexibleTasks} flexible tasks moved to low-energy days</li>
              <li>All deadlines covered before PMS</li>
            </ul>
          </div>
        </div>
        
        {/* Week Calendar View */}
        <div className={styles.calendarWrapper}>
          {/* Time column header */}
          <div className={styles.timeColumn}>
            <div className={styles.timeHeader}></div>
            {timeSlots.map(hour => (
              <div key={hour} className={styles.timeSlot}>
                {hour === 6 ? '6 AM' : hour === 12 ? '12 PM' : hour === 18 ? '6 PM' : hour % 12 === 0 ? '12' : hour % 12}
              </div>
            ))}
          </div>
          
          {/* Days columns */}
          <div className={styles.daysContainer}>
            {/* Day headers */}
            <div className={styles.dayHeaders}>
              {weekDates.map(date => {
                const dateStr = date.toISOString().split('T')[0];
                const dayNum = date.getDate();
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                const dayTasks = tasksByDate[dateStr] || [];
                
                return (
                  <div key={dateStr} className={`${styles.dayHeader} ${isToday ? styles.dayHeaderToday : ''}`}>
                    <div className={styles.dayName}>{dayName}</div>
                    <div className={styles.dayNumber}>{dayNum}</div>
                    {dayTasks.length > 0 && (
                      <div className={styles.dayTaskCount}>{dayTasks.length}</div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Calendar grid */}
            <div className={styles.calendarGrid}>
              {weekDates.map(date => {
                const dateStr = date.toISOString().split('T')[0];
                const dayTasks = tasksByDate[dateStr] || [];
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                
                return (
                  <div key={dateStr} className={`${styles.dayColumn} ${isToday ? styles.dayColumnToday : ''}`}>
                    {/* Time slots background */}
                    {timeSlots.map(hour => (
                      <div key={hour} className={styles.hourSlot}></div>
                    ))}
                    
                    {/* Task blocks */}
                    {dayTasks.map(task => {
                      const { top, height } = getTaskPosition(task);
                      return (
                        <TaskBlock
                          key={task.id}
                          task={task}
                          getEnergyType={getEnergyType}
                          onClick={() => handleTaskClick(task)}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                          }}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Task Details Modal */}
      {isDialogOpen && selectedTask && (
        <div className={styles.modalOverlay} onClick={handleCloseDialog}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            {/* Header con gradiente */}
            <div 
              className={styles.modalHeader}
              style={{
                background: `linear-gradient(135deg, ${getCategoryColor(selectedTask.category)} 0%, ${getCategoryColor(selectedTask.category)}dd 100%)`
              }}
            >
              <div className={styles.modalHeaderContent}>
                <h2 className={styles.modalTitle}>{selectedTask.title}</h2>
                <div className={styles.modalCategoryBadge}>
                  {selectedTask.category}
                </div>
              </div>
              <button
                onClick={handleCloseDialog}
                className={styles.modalCloseButton}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            
            {/* Contenido principal */}
            <div className={styles.taskDialogContent}>
              {/* Card de fecha y hora */}
              <div className={styles.infoCard}>
                <div className={styles.infoCardIcon}>📅</div>
                <div className={styles.infoCardContent}>
                  <div className={styles.infoCardLabel}>Fecha</div>
                  <div className={styles.infoCardValue}>
                    {new Date(selectedTask.date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoCardIcon}>🕐</div>
                <div className={styles.infoCardContent}>
                  <div className={styles.infoCardLabel}>Horario</div>
                  <div className={styles.infoCardValue}>
                    {selectedTask.startTime} - {selectedTask.endTime}
                    <span className={styles.durationBadge}>
                      {(() => {
                        const start = timeToMinutes(selectedTask.startTime);
                        const end = timeToMinutes(selectedTask.endTime);
                        const duration = end - start;
                        const hours = Math.floor(duration / 60);
                        const minutes = duration % 60;
                        return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card de fase del ciclo */}
              <div className={styles.infoCard}>
                <div className={styles.infoCardIcon}>🌙</div>
                <div className={styles.infoCardContent}>
                  <div className={styles.infoCardLabel}>Fase del ciclo</div>
                  <div className={styles.infoCardValue}>
                    {selectedTask.cyclePhase || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Card de energía */}
              <div className={styles.infoCard}>
                <div className={styles.infoCardIcon}>
                  {getEnergyIcon(getEnergyType(selectedTask))}
                </div>
                <div className={styles.infoCardContent}>
                  <div className={styles.infoCardLabel}>Tipo de energía</div>
                  <div className={styles.infoCardValue}>
                    {getEnergyType(selectedTask) === 'deep-work' ? 'Trabajo profundo' :
                     getEnergyType(selectedTask) === 'admin' ? 'Administrativo' :
                     getEnergyType(selectedTask) === 'social' ? 'Social' : 'Descanso'}
                    <span className={styles.energyLevelBadge}>
                      {getEnergyType(selectedTask) === 'deep-work' ? 'Alta' :
                       getEnergyType(selectedTask) === 'rest' ? 'Baja' : 'Media'}
                    </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer simplificado */}
            <div className={styles.taskDialogFooter}>
              <button
                onClick={handleCloseDialog}
                className={styles.closeButton}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      
      <BottomNav />
    </div>
  );
};

// Task Block Component
const TaskBlock = ({ 
  task, 
  style,
  getEnergyType,
  onClick
}: { 
  task: ScheduledTask; 
  style: React.CSSProperties;
  getEnergyType: (task: any) => "deep-work" | "admin" | "social" | "rest";
  onClick: () => void;
}) => {
  const energyType = getEnergyType(task);
  const energyIcon = getEnergyIcon(energyType);
  const bgColor = getEnergyBackgroundColor(energyType);
  const borderColor = getEnergyColor(energyType);
  const categoryColor = getCategoryColor(task.category);
  
  return (
    <div 
      className={styles.taskBlock}
      onClick={onClick}
      style={{
        ...style,
        backgroundColor: bgColor,
        borderLeft: `3px solid ${borderColor}`,
      }}
    >
      <div className={styles.taskTime}>
        {task.startTime}–{task.endTime}
      </div>
      <div className={styles.taskTitle}>{task.title}</div>
      <div className={styles.taskFooter}>
        <div 
          className={styles.categoryChip}
          style={{ backgroundColor: categoryColor }}
        >
          {task.category}
        </div>
        <div className={styles.taskIcon}>{energyIcon}</div>
      </div>
    </div>
  );
};

// Helper functions
function getPhaseInfo(phase: string) {
  const info: Record<string, { subtitle: string }> = {
    Menstrual: { subtitle: 'Rest & reflect — Time for gentle self-care' },
    Follicular: { subtitle: 'Energy rising — Best for deep work' },
    Ovulatory: { subtitle: 'Peak energy — Perfect for important meetings' },
    Luteal: { subtitle: 'Protect your focus — Soft tasks and admin' },
  };
  return info[phase] || info.Follicular;
}

function getEnergyColor(energyType: ScheduledTask['energyType']): string {
  const colors: Record<string, string> = {
    'deep-work': '#16697A',
    'admin': '#82C0CC',
    'social': '#FFA62B',
    'rest': '#EDE7E3',
  };
  return colors[energyType] || '#EDE7E3';
}

function getEnergyBackgroundColor(energyType: ScheduledTask['energyType']): string {
  const colors: Record<string, string> = {
    'deep-work': 'rgba(22, 105, 122, 0.12)',
    'admin': 'rgba(130, 192, 204, 0.15)',
    'social': 'rgba(255, 166, 43, 0.15)',
    'rest': 'rgba(237, 231, 227, 0.6)',
  };
  return colors[energyType] || '#EDE7E3';
}

function getEnergyIcon(energyType: ScheduledTask['energyType']): string {
  const icons: Record<string, string> = {
    'deep-work': '💡',
    'admin': '🗂',
    'social': '🤝',
    'rest': '🌙',
  };
  return icons[energyType] || '📋';
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'Entrepreneur': '#16697A',
    'Home': '#82C0CC',
    'Mother': '#489FB5',
  };
  return colors[category] || '#82C0CC';
}

export default WeeklySchedule;
