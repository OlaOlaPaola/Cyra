import { useState, useRef, useEffect } from 'react';
import { usePrivySafe } from '../../hooks/usePrivySafe';
import { useLoginWithEmail } from '@privy-io/react-auth';
import { PRIVY_APP_ID } from '../../config/privy';
import styles from './ConfirmationScreen.module.css';

interface ConfirmationScreenProps {
  email: string;
  onBack: () => void;
  onBypass: () => void;
}

const ConfirmationScreen = ({ email, onBack, onBypass }: ConfirmationScreenProps) => {
  const { ready, authenticated } = usePrivySafe();
  const hasPrivy = PRIVY_APP_ID && PRIVY_APP_ID.trim() !== '';
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Usar hook específico de Privy v3 para login con email
  const { loginWithCode, sendCode: resendEmailCode, state: emailState } = useLoginWithEmail();

  useEffect(() => {
    // Focus en el primer input al montar
    inputRefs.current[0]?.focus();
  }, []);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Si se pega un código completo
      const pastedCode = value.slice(0, 6).split('');
      const newCode = [...code];
      pastedCode.forEach((char, i) => {
        if (index + i < 6 && /^\d$/.test(char)) {
          newCode[index + i] = char;
        }
      });
      setCode(newCode);
      // Focus en el último input
      if (index + pastedCode.length < 6) {
        inputRefs.current[index + pastedCode.length]?.focus();
      }
      return;
    }

    if (!/^\d$/.test(value) && value !== '') return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus siguiente input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Verificar si el código está completo
    if (newCode.every(digit => digit !== '') && newCode.length === 6) {
      const fullCode = newCode.join('');
      // Simular verificación exitosa
      setTimeout(() => {
        setIsSuccess(true);
        // Intentar login con Privy (en producción, esto se maneja automáticamente)
        handleVerifyCode(fullCode);
      }, 500);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (verificationCode: string) => {
    if (!hasPrivy) {
      console.warn('⚠️ Modo demo: Verificación de código no disponible');
      return;
    }
    
    try {
      // En Privy v3, usar loginWithCode para verificar el código OTP
      await loginWithCode({ code: verificationCode });
      // Si no hay error, Privy habrá autenticado al usuario
      setIsSuccess(true);
    } catch (error) {
      console.error('Error verificando código:', error);
      // Si hay error, limpiar el código para que el usuario pueda intentar de nuevo
      setCode(['', '', '', '', '', '']);
      setIsSuccess(false);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (!hasPrivy) {
      console.warn('⚠️ Modo demo: Reenvío de código no disponible');
      return;
    }
    
    setCode(['', '', '', '', '', '']);
    setIsSuccess(false);
    try {
      // En Privy v3, usar sendCode para reenviar el código
      await resendEmailCode({ email });
      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error('Error reenviando código:', error);
    }
  };

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <img src="/cyra-logo.png" alt="Plan4HER Logo" className={styles.logoImage} />
        </div>
        <h1 className={styles.title}>Ready to plan with your natural rhythm?</h1>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.confirmationPrompt}>
          <span className={styles.envelopeIcon}>✉</span>
          <span>Enter confirmation code</span>
        </div>

        <div className={styles.instructions}>
          <p>Please check <strong>{email}</strong> for a message with your login code.</p>
        </div>

        <div className={styles.codeInputContainer}>
          <div className={styles.codeInputs}>
            {code.slice(0, 4).map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`${styles.codeInput} ${digit ? styles.filled : ''} ${isSuccess ? styles.success : ''}`}
              />
            ))}
            <span className={styles.codeSeparator}>-</span>
            {code.slice(4).map((digit, index) => (
              <input
                key={index + 4}
                ref={(el) => (inputRefs.current[index + 4] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index + 4, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index + 4, e)}
                className={`${styles.codeInput} ${digit ? styles.filled : ''} ${isSuccess ? styles.success : ''}`}
              />
            ))}
          </div>
        </div>

        {isSuccess && (
          <div className={styles.successMessage}>
            <span>Success.</span>
          </div>
        )}

        <div className={styles.resendLink}>
          <p>
            Didn't get an email?{' '}
            <button className={styles.resendBtn} onClick={handleResend} type="button">
              Resend code
            </button>
          </p>
        </div>

        {/* Botón de bypass para desarrollo */}
        <div className={styles.bypassContainer}>
          <button className={styles.bypassBtn} onClick={onBypass} title="Bypass login para desarrollo">
            🚀 Bypass Login (Dev)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationScreen;

