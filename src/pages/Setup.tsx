import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CycleInput from '../components/CycleInput';
import TaskFormCard from '../components/TaskFormCard';
import { Task } from '../types';
import { organizeTasksByCyclePhase } from '../utils/cycleLogic';
import { saveUserData, loadUserData } from '../utils/storage';
import { usePrivySafe } from '../hooks/usePrivySafe';
import { saveTaskToIPFS, saveTaskMetadataLocally } from '../utils/taskStorage';
import styles from './Setup.module.css';

const Setup = () => {
  const navigate = useNavigate();
  const privyData = usePrivySafe();
  const [cycleDay, setCycleDay] = useState(1);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [uploadingTasks, setUploadingTasks] = useState<Set<string>>(new Set());
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  
  // Obtener userId del usuario autenticado
  const userId = privyData?.user?.id || 'demo-user';

  useEffect(() => {
    const saved = loadUserData();
    if (saved) {
      setCycleDay(saved.cycleDay);
      setTasks(saved.tasks);
    }
  }, []);

  const addTask = () => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: '',
      category: 'Entrepreneur',
      isFixed: false,
      duration: '01:00',
      repeatFrequency: 'none',
      isProject: false,
    };
    setTasks([...tasks, newTask]);
  };

  const saveTask = (updatedTask: Task) => {
    // Actualizar el estado local primero
    setTasks(prev =>
      prev.map(t => (t.id === updatedTask.id ? updatedTask : t))
    );

    // Subir a Pinata si la tarea tiene título y Pinata está configurado
    const hasPinataJWT = import.meta.env.VITE_PINATA_JWT;
    if (updatedTask.title.trim() && hasPinataJWT) {
      // Marcar como uploading
      setUploadingTasks(prev => new Set(prev).add(updatedTask.id));
      
      // Limpiar errores previos
      setUploadErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[updatedTask.id];
        return newErrors;
      });

      // Subir a IPFS de forma asíncrona
      saveTaskToIPFS(userId, updatedTask, cycleDay)
        .then((result) => {
          // Guardar metadatos localmente
          saveTaskMetadataLocally(userId, updatedTask.id, result.cid, result.size);
          console.log(`✅ Tarea "${updatedTask.title}" guardada en IPFS:`, result.cid);
        })
        .catch((error) => {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          setUploadErrors(prev => ({
            ...prev,
            [updatedTask.id]: errorMessage,
          }));
          console.error(`❌ Error al guardar tarea "${updatedTask.title}" en IPFS:`, error);
        })
        .finally(() => {
          // Limpiar estado de uploading
          setUploadingTasks(prev => {
            const newSet = new Set(prev);
            newSet.delete(updatedTask.id);
            return newSet;
          });
        });
    }
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleGenerate = () => {
    const schedule = organizeTasksByCyclePhase(cycleDay, tasks);
    saveUserData({ cycleDay, tasks, schedule });
    navigate('/weekly-schedule');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Set up your cycle</h1>
        <p>Tell us about your current cycle and tasks</p>
      </div>

      <div className={styles.content}>
        <CycleInput value={cycleDay} onChange={setCycleDay} />

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Your tasks for this cycle</h2>
            <button onClick={addTask} className={styles.addBtn}>
              + Add Task
            </button>
          </div>

          <div className={styles.taskList}>
            {tasks.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No tasks yet. Click "Add Task" to get started!</p>
              </div>
            ) : (
              tasks.map(task => (
                <TaskFormCard
                  key={task.id}
                  task={task}
                  onSave={saveTask}
                  onDelete={() => deleteTask(task.id)}
                  isUploading={uploadingTasks.has(task.id)}
                  uploadError={uploadErrors[task.id]}
                />
              ))
            )}
          </div>
        </div>

        <div className={styles.connectToolsCard}>
          <h3 className={styles.connectToolsTitle}>Connect your tools</h3>
          <p className={styles.connectToolsSubtitle}>
            Soon, Plan4HER will sync with your favorite planners so all your commitments live in one cycle-aware view.
          </p>
          <div className={styles.integrationsList}>
            <div className={styles.integrationItem}>
              <div className={styles.integrationIcon}>G</div>
              <span className={styles.integrationName}>Google Calendar</span>
              <span className={styles.soonBadge}>Soon</span>
            </div>
            <div className={styles.integrationItem}>
              <div className={styles.integrationIcon}>N</div>
              <span className={styles.integrationName}>Notion</span>
              <span className={styles.soonBadge}>Soon</span>
            </div>
            <div className={styles.integrationItem}>
              <div className={styles.integrationIcon}>S</div>
              <span className={styles.integrationName}>Slack</span>
              <span className={styles.soonBadge}>Soon</span>
            </div>
            <div className={styles.integrationItem}>
              <div className={styles.integrationIcon}>A</div>
              <span className={styles.integrationName}>Asana</span>
              <span className={styles.soonBadge}>Soon</span>
            </div>
          </div>
        </div>

        {tasks.length > 0 && (
          <button
            className="btn-primary"
            onClick={handleGenerate}
            style={{ width: '100%', padding: 'var(--spacing-lg)' }}
          >
            Save tasks & generate schedule
          </button>
        )}
      </div>
    </div>
  );
};

export default Setup;
