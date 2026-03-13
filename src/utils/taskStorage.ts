/**
 * Utilidades para guardar tareas individuales en IPFS
 * 
 * Este módulo permite guardar cada tarea de forma individual en IPFS
 * cuando se crea o actualiza.
 */

import { Task } from '../types';
import { encryptUserData } from './encryption';
import { uploadToIPFS } from './ipfs';
import {
  saveEncryptedDataToSupabase,
  updateEncryptedDataInSupabase,
} from './supabaseStorage';
import { isSupabaseConfigured } from '../config/supabase';

/**
 * Interfaz para el resultado de guardar una tarea
 */
export interface TaskStorageResult {
  cid: string;
  size: number;
  aesKey: string;
  taskId: string;
  iv: string; // IV en base64
  tag: string; // Tag de autenticación en base64
  supabaseId?: string; // ID del registro en Supabase (si se guardó)
}

/**
 * Genera un prompt de IA para una tarea individual
 */
function generateTaskPrompt(task: Task, cycleDay: number): string {
  return `Tarea del usuario para el día ${cycleDay} del ciclo menstrual:
- Título: ${task.title}
- Categoría: ${task.category}
- Tipo: ${task.isFixed ? 'Fija' : 'Flexible'}
- Duración: ${task.duration}
${task.isFixed && task.date ? `- Fecha: ${task.date}` : ''}
${task.isFixed && task.startTime ? `- Hora de inicio: ${task.startTime}` : ''}
${task.isFixed && task.endTime ? `- Hora de fin: ${task.endTime}` : ''}
${!task.isFixed && task.deadline ? `- Fecha límite: ${task.deadline}` : ''}
${task.repeatFrequency && task.repeatFrequency !== 'none' ? `- Se repite: ${task.repeatFrequency}` : ''}
${task.isProject ? '- Es un proyecto' : ''}

Esta tarea debe ser considerada al generar el horario optimizado para el ciclo menstrual del usuario.`;
}

/**
 * Guarda una tarea individual en IPFS
 * 
 * @param userId - ID del usuario (Privy User ID)
 * @param task - Tarea a guardar
 * @param cycleDay - Día del ciclo actual
 * @returns Resultado con CID, tamaño y clave AES
 */
export async function saveTaskToIPFS(
  userId: string,
  task: Task,
  cycleDay: number
): Promise<TaskStorageResult> {
  try {
    // 1. Generar prompt de IA para la tarea
    const aiPrompt = generateTaskPrompt(task, cycleDay);

    // 2. Preparar userData con solo esta tarea
    const userData = {
      cycleDay,
      tasks: [task], // Solo esta tarea
      schedule: [], // Sin schedule aún
    };

    // 3. Encriptar
    const encrypted = await encryptUserData({
      userId,
      userData,
      aiPrompt,
    });

    // 4. Subir a IPFS
    const ipfsResult = await uploadToIPFS({
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      tag: encrypted.tag,
    });

    // 5. Guardar en Supabase si está configurado
    let supabaseId: string | undefined;
    if (isSupabaseConfigured()) {
      try {
        const supabaseResult = await updateEncryptedDataInSupabase(
          userId, // privyUserId
          ipfsResult.cid,
          encrypted.aesKey,
          encrypted.iv,
          encrypted.tag
        );
        supabaseId = supabaseResult.id.toString();
      } catch (error) {
        console.error('⚠️ Error al guardar tarea en Supabase (continuando):', error);
        // Continuar sin fallar si Supabase falla
      }
    }

    // 6. Retornar resultado
    return {
      cid: ipfsResult.cid,
      size: ipfsResult.size,
      aesKey: encrypted.aesKey,
      taskId: task.id,
      iv: encrypted.iv,
      tag: encrypted.tag,
      supabaseId,
    };
  } catch (error) {
    throw new Error(
      `Error al guardar tarea en IPFS: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );
  }
}

/**
 * Guarda múltiples tareas en IPFS (batch)
 * 
 * @param userId - ID del usuario
 * @param tasks - Array de tareas
 * @param cycleDay - Día del ciclo actual
 * @returns Array de resultados
 */
export async function saveTasksToIPFS(
  userId: string,
  tasks: Task[],
  cycleDay: number
): Promise<TaskStorageResult[]> {
  const results: TaskStorageResult[] = [];

  for (const task of tasks) {
    try {
      const result = await saveTaskToIPFS(userId, task, cycleDay);
      results.push(result);
    } catch (error) {
      console.error(`Error al guardar tarea ${task.id}:`, error);
      // Continuar con las demás tareas
    }
  }

  return results;
}

/**
 * Guarda los metadatos de una tarea en localStorage
 * (También se guarda en Supabase si está configurado)
 */
export function saveTaskMetadataLocally(
  userId: string,
  taskId: string,
  cid: string,
  size: number
): void {
  try {
    const metadata = {
      userId,
      taskId,
      ipfsCid: cid,
      size,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const storageKey = `task-metadata-${userId}-${taskId}`;
    localStorage.setItem(storageKey, JSON.stringify(metadata));
  } catch (error) {
    console.error('Error al guardar metadatos de tarea:', error);
  }
}

/**
 * Obtiene los metadatos de una tarea desde localStorage
 */
export function getTaskMetadataLocally(
  userId: string,
  taskId: string
): { ipfsCid: string; size: number; createdAt: string } | null {
  try {
    const storageKey = `task-metadata-${userId}-${taskId}`;
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error al obtener metadatos de tarea:', error);
    return null;
  }
}

