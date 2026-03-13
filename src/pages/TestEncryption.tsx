/**
 * Página de prueba para verificar que la encriptación e IPFS funcionan correctamente
 * 
 * Esta página permite:
 * 1. Probar la encriptación de datos
 * 2. Probar la subida a IPFS
 * 3. Ver los resultados en tiempo real
 */

import { useState } from 'react';
import { UserData } from '../types';
import { encryptUserData } from '../utils/encryption';
import { uploadToIPFS } from '../utils/ipfs';
import { saveUserDataSecurely } from '../utils/secureStorage';
import { logEncryptionData, validateEncryptionData } from '../utils/debugEncryption';
import styles from './TestEncryption.module.css';

const TestEncryption = () => {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<string>('');

  // Datos de prueba
  const testUserData: UserData = {
    cycleDay: 5,
    tasks: [
      {
        id: 'test-1',
        title: 'Tarea de prueba 1',
        category: 'Work',
        isFixed: true,
        duration: '02:00',
        date: '2024-01-15',
        startTime: '10:00',
        endTime: '12:00',
        isProject: false,
      },
      {
        id: 'test-2',
        title: 'Tarea de prueba 2',
        category: 'Personal',
        isFixed: false,
        duration: '01:30',
        deadline: '2024-01-20',
        repeatFrequency: 'weekly',
        isProject: true,
      },
    ],
    schedule: [
      {
        id: 'schedule-1',
        taskId: 'test-1',
        title: 'Tarea de prueba 1',
        category: 'Work',
        date: '2024-01-15',
        startTime: '10:00',
        endTime: '12:00',
        phase: 'Follicular',
        energyLevel: 'high',
        isProject: false,
      },
    ],
  };

  const testAiPrompt = `Este es un prompt de prueba para verificar que la encriptación funciona correctamente.
  El prompt contiene información que será encriptada junto con los datos del usuario.
  Este prompt simula el tipo de información que se enviaría a un agente de IA para generar horarios personalizados.`;

  const testUserId = 'test-user-123';

  // Test 1: Solo encriptación
  const testEncryption = async () => {
    setStatus('testing');
    setError(null);
    setStep('Probando encriptación...');
    setResults(null);

    try {
      // Validar datos
      const validation = validateEncryptionData(testUserData, testAiPrompt);
      if (!validation.valid) {
        throw new Error(`Validación fallida: ${validation.errors.join(', ')}`);
      }

      // Mostrar datos que se van a encriptar
      logEncryptionData({
        userId: testUserId,
        userData: testUserData,
        aiPrompt: testAiPrompt,
      });

      // Encriptar
      const encrypted = await encryptUserData({
        userId: testUserId,
        userData: testUserData,
        aiPrompt: testAiPrompt,
      });

      setResults({
        test: 'Encriptación',
        success: true,
        data: {
          ciphertextLength: encrypted.ciphertext.length,
          ivLength: encrypted.iv.length,
          aesKeyLength: encrypted.aesKey.length,
          tagLength: encrypted.tag.length,
          // No mostramos los valores completos por seguridad, solo longitudes
          preview: {
            ciphertext: encrypted.ciphertext.substring(0, 50) + '...',
            iv: encrypted.iv.substring(0, 20) + '...',
            aesKey: encrypted.aesKey.substring(0, 20) + '...',
            tag: encrypted.tag.substring(0, 20) + '...',
          },
        },
      });

      setStatus('success');
      setStep('✅ Encriptación exitosa');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setStatus('error');
      setStep('❌ Error en encriptación');
    }
  };

  // Test 2: Solo IPFS (requiere datos encriptados primero)
  const testIPFS = async () => {
    setStatus('testing');
    setError(null);
    setStep('Probando subida a IPFS...');
    setResults(null);

    try {
      // Primero encriptar
      const encrypted = await encryptUserData({
        userId: testUserId,
        userData: testUserData,
        aiPrompt: testAiPrompt,
      });

      setStep('Datos encriptados, subiendo a IPFS...');

      // Subir a IPFS
      const ipfsResult = await uploadToIPFS({
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        tag: encrypted.tag,
      });

      setResults({
        test: 'IPFS Upload',
        success: true,
        data: {
          cid: ipfsResult.cid,
          size: ipfsResult.size,
          sizeKB: (ipfsResult.size / 1024).toFixed(2),
          ipfsUrl: `https://gateway.pinata.cloud/ipfs/${ipfsResult.cid}`,
          publicGatewayUrl: `https://ipfs.io/ipfs/${ipfsResult.cid}`,
        },
      });

      setStatus('success');
      setStep('✅ Subida a IPFS exitosa');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setStatus('error');
      setStep('❌ Error en subida a IPFS');
    }
  };

  // Test 3: Flujo completo
  const testCompleteFlow = async () => {
    setStatus('testing');
    setError(null);
    setStep('Probando flujo completo...');
    setResults(null);

    try {
      setStep('1/3: Encriptando datos...');
      const encrypted = await encryptUserData({
        userId: testUserId,
        userData: testUserData,
        aiPrompt: testAiPrompt,
      });

      setStep('2/3: Subiendo a IPFS...');
      const ipfsResult = await uploadToIPFS({
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        tag: encrypted.tag,
      });

      setStep('3/3: Guardando metadatos...');
      const secureResult = await saveUserDataSecurely(
        testUserId,
        testUserData,
        testAiPrompt,
        true // Activar debug
      );

      setResults({
        test: 'Flujo Completo',
        success: true,
        data: {
          encryption: {
            ciphertextLength: encrypted.ciphertext.length,
            ivLength: encrypted.iv.length,
            aesKeyLength: encrypted.aesKey.length,
            tagLength: encrypted.tag.length,
          },
          ipfs: {
            cid: ipfsResult.cid,
            size: ipfsResult.size,
            sizeKB: (ipfsResult.size / 1024).toFixed(2),
          },
          secureStorage: {
            cid: secureResult.cid,
            size: secureResult.size,
            aesKeyLength: secureResult.aesKey.length,
          },
          urls: {
            pinataGateway: `https://gateway.pinata.cloud/ipfs/${ipfsResult.cid}`,
            publicGateway: `https://ipfs.io/ipfs/${ipfsResult.cid}`,
          },
        },
      });

      setStatus('success');
      setStep('✅ Flujo completo exitoso');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setStatus('error');
      setStep('❌ Error en flujo completo');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🧪 Test de Encriptación e IPFS</h1>
        <p>Prueba que todo el sistema de encriptación y almacenamiento funciona correctamente</p>
      </div>

      <div className={styles.content}>
        {/* Información de configuración */}
        <div className={styles.configSection}>
          <h2>⚙️ Configuración</h2>
          <div className={styles.configItem}>
            <strong>Pinata JWT:</strong>{' '}
            {import.meta.env.VITE_PINATA_JWT ? (
              <span className={styles.success}>✅ Configurado</span>
            ) : (
              <span className={styles.error}>❌ No configurado</span>
            )}
          </div>
          <div className={styles.configItem}>
            <strong>Datos de prueba:</strong> {testUserData.tasks.length} tareas,{' '}
            {testUserData.schedule.length} eventos programados
          </div>
        </div>

        {/* Botones de prueba */}
        <div className={styles.testButtons}>
          <button
            onClick={testEncryption}
            disabled={status === 'testing'}
            className={styles.testButton}
          >
            🔐 Test 1: Solo Encriptación
          </button>

          <button
            onClick={testIPFS}
            disabled={status === 'testing' || !import.meta.env.VITE_PINATA_JWT}
            className={styles.testButton}
            title={
              !import.meta.env.VITE_PINATA_JWT
                ? 'Configura VITE_PINATA_JWT en .env'
                : ''
            }
          >
            📤 Test 2: Solo IPFS
          </button>

          <button
            onClick={testCompleteFlow}
            disabled={status === 'testing' || !import.meta.env.VITE_PINATA_JWT}
            className={styles.testButton}
            title={
              !import.meta.env.VITE_PINATA_JWT
                ? 'Configura VITE_PINATA_JWT en .env'
                : ''
            }
          >
            🚀 Test 3: Flujo Completo
          </button>
        </div>

        {/* Estado actual */}
        {step && (
          <div className={styles.stepIndicator}>
            <p>{step}</p>
          </div>
        )}

        {/* Resultados */}
        {results && (
          <div className={styles.results}>
            <h2>📊 Resultados: {results.test}</h2>
            <pre className={styles.resultsJson}>
              {JSON.stringify(results.data, null, 2)}
            </pre>

            {/* URLs si hay CID */}
            {results.data?.cid && (
              <div className={styles.urls}>
                <h3>🔗 URLs de IPFS:</h3>
                <div className={styles.urlItem}>
                  <strong>Pinata Gateway:</strong>{' '}
                  <a
                    href={results.data.ipfsUrl || results.data.urls?.pinataGateway}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {results.data.ipfsUrl || results.data.urls?.pinataGateway}
                  </a>
                </div>
                <div className={styles.urlItem}>
                  <strong>IPFS Public Gateway:</strong>{' '}
                  <a
                    href={results.data.publicGatewayUrl || results.data.urls?.publicGateway}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {results.data.publicGatewayUrl || results.data.urls?.publicGateway}
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Errores */}
        {error && (
          <div className={styles.error}>
            <h3>❌ Error:</h3>
            <p>{error}</p>
            {error.includes('Pinata') && (
              <div className={styles.errorHelp}>
                <p>
                  <strong>Ayuda:</strong> Asegúrate de tener configurado{' '}
                  <code>VITE_PINATA_JWT</code> en tu archivo <code>.env</code>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Instrucciones */}
        <div className={styles.instructions}>
          <h3>📝 Instrucciones:</h3>
          <ol>
            <li>
              <strong>Test 1:</strong> Prueba solo la encriptación (no requiere Pinata)
            </li>
            <li>
              <strong>Test 2:</strong> Prueba la subida a IPFS (requiere Pinata JWT)
            </li>
            <li>
              <strong>Test 3:</strong> Prueba el flujo completo end-to-end
            </li>
          </ol>
          <p>
            <strong>Nota:</strong> Revisa la consola del navegador para ver logs detallados
            de debug.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestEncryption;

