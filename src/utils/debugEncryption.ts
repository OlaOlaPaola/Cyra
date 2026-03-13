/**
 * Utilidades de depuración para ver qué se está encriptando
 * 
 * Este módulo ayuda a visualizar y validar los datos antes de encriptarlos
 */

import { UserData } from '../types';
import { EncryptionInput } from './encryption';

/**
 * Muestra un resumen de los datos que se van a encriptar
 * 
 * @param input - Datos de entrada para encriptación
 */
export function logEncryptionData(input: EncryptionInput): void {
  console.group('🔐 Datos que se van a Encriptar');
  
  console.log('👤 User ID:', input.userId);
  
  console.group('📊 User Data:');
  const ud = input.userData as any;
  console.log('  • Cycle Day:', ud.cycleDay);
  console.log('  • Tasks:', ud.tasks?.length || 0, 'tareas');
  
  if (ud.tasks && ud.tasks.length > 0) {
    console.group('  📝 Detalle de Tareas:');
    ud.tasks.forEach((task: any, index: number) => {
      console.log(`    ${index + 1}. ${task.title || '(Sin título)'}`, {
        category: task.category,
        duration: task.duration,
        isFixed: task.isFixed,
        isProject: task.isProject,
      });
    });
    console.groupEnd();
  }
  
  console.log('  • Schedule:', ud.schedule?.length || 0, 'eventos programados');
  if (ud.schedule && ud.schedule.length > 0) {
    console.group('  📅 Detalle del Schedule:');
    ud.schedule.forEach((scheduled: any, index: number) => {
      console.log(`    ${index + 1}. ${scheduled.title}`, {
        date: scheduled.date,
        time: `${scheduled.startTime} - ${scheduled.endTime}`,
        phase: scheduled.phase,
        energyLevel: scheduled.energyLevel,
      });
    });
    console.groupEnd();
  }
  console.groupEnd();
  
  console.group('🤖 AI Prompt:');
  console.log('  Longitud:', input.aiPrompt.length, 'caracteres');
  console.log('  Preview:', input.aiPrompt.substring(0, 100) + '...');
  console.groupEnd();
  
  // Mostrar el objeto completo
  console.group('📦 Objeto Completo (JSON):');
  console.log(JSON.stringify(input, null, 2));
  console.groupEnd();
  
  // Calcular tamaño aproximado
  const jsonString = JSON.stringify(input);
  const sizeInBytes = new Blob([jsonString]).size;
  console.log('📏 Tamaño aproximado:', sizeInBytes, 'bytes (', (sizeInBytes / 1024).toFixed(2), 'KB)');
  
  console.groupEnd();
}

/**
 * Valida que los datos tengan la estructura correcta antes de encriptar
 * 
 * @param userData - Datos del usuario
 * @param aiPrompt - Prompt de IA
 * @returns true si los datos son válidos, false si falta algo
 */
export function validateEncryptionData(
  userData: UserData,
  aiPrompt: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validar userData
  if (!userData) {
    errors.push('userData es requerido');
  } else {
    if (typeof userData.cycleDay !== 'number' || userData.cycleDay < 1 || userData.cycleDay > 28) {
      errors.push('cycleDay debe ser un número entre 1 y 28');
    }
    
    if (!Array.isArray(userData.tasks)) {
      errors.push('tasks debe ser un array');
    }
    
    if (!Array.isArray(userData.schedule)) {
      errors.push('schedule debe ser un array');
    }
  }
  
  // Validar aiPrompt
  if (!aiPrompt || typeof aiPrompt !== 'string' || aiPrompt.trim().length === 0) {
    errors.push('aiPrompt es requerido y no puede estar vacío');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Muestra qué campos están presentes y cuáles faltan
 * 
 * @param userData - Datos del usuario
 */
export function analyzeUserDataFields(userData: UserData): void {
  console.group('🔍 Análisis de Campos en UserData');
  
  const fields = {
    cycleDay: userData.cycleDay !== undefined,
    tasks: Array.isArray(userData.tasks),
    schedule: Array.isArray(userData.schedule),
  };
  
  console.table(fields);
  
  // Campos adicionales que podrían estar presentes
  const additionalFields: string[] = [];
  Object.keys(userData).forEach(key => {
    if (!['cycleDay', 'tasks', 'schedule'].includes(key)) {
      additionalFields.push(key);
    }
  });
  
  if (additionalFields.length > 0) {
    console.log('➕ Campos adicionales encontrados:', additionalFields);
  } else {
    console.log('ℹ️ Solo campos estándar presentes');
  }
  
  console.groupEnd();
}

