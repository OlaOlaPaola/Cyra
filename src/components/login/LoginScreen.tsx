import { useState } from 'react';
import { usePrivySafe } from '../../hooks/usePrivySafe';
import { useDemoAuth } from '../../contexts/DemoAuthContext';
import { PRIVY_APP_ID } from '../../config/privy';
import { useLoginWithEmail, useLoginWithOAuth, useLoginWithTelegram } from '@privy-io/react-auth';
import styles from './LoginScreen.module.css';

interface LoginScreenProps {
  onEmailSubmit: (email: string) => void;
  onBack: () => void;
  onBypass: () => void;
}

const LoginScreen = ({ onEmailSubmit, onBack, onBypass }: LoginScreenProps) => {
  const { ready, authenticated } = usePrivySafe();
  const { timeRemaining } = useDemoAuth();
  const hasPrivy = PRIVY_APP_ID && PRIVY_APP_ID.trim() !== '';
  const [email, setEmail] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [loading, setLoading] = useState<'google' | 'telegram' | 'apple' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Usar hooks específicos de Privy v3
  const { sendCode: sendEmailCode, state: emailState } = useLoginWithEmail();
  const { initOAuth } = useLoginWithOAuth();
  const { login: loginWithTelegram } = useLoginWithTelegram();
  
  const formatTime = (ms: number | null) => {
    if (!ms) return '';
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const showDemoMessage = () => {
    alert('Modo demo: Para usar el login, configura VITE_PRIVY_APP_ID en tu archivo .env');
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      if (!hasPrivy) {
        showDemoMessage();
        // En modo demo, aún mostrar la pantalla de confirmación para demostración
        onEmailSubmit(email);
        return;
      }
      
      setLoading('email');
      setError(null);
      try {
        // En Privy v3, usar sendCode para enviar el código OTP
        await sendEmailCode({ email });
        // Si llegamos aquí, el código fue enviado exitosamente
        // Mostrar la pantalla de confirmación
        onEmailSubmit(email);
      } catch (error: any) {
        console.error('Error enviando código de verificación:', error);
        setError(error?.message || 'Error al enviar el código de verificación. Por favor, intenta de nuevo.');
        // Aún así mostrar la pantalla de confirmación para que el usuario pueda intentar de nuevo
        onEmailSubmit(email);
      } finally {
        setLoading(null);
      }
    }
  };

  const handleGoogleLogin = async () => {
    if (!hasPrivy) {
      showDemoMessage();
      return;
    }
    
    if (!ready) {
      setError('Privy aún no está listo. Por favor, espera un momento e intenta de nuevo.');
      return;
    }
    
    setLoading('google');
    setError(null);
    try {
      // Verificar que initOAuth esté disponible
      if (!initOAuth) {
        throw new Error('OAuth no está disponible. Verifica la configuración en Privy Dashboard.');
      }
      
      console.log('🔵 Intentando login con Google...');
      console.log('Privy App ID:', PRIVY_APP_ID);
      console.log('initOAuth disponible:', !!initOAuth);
      
      // initOAuth redirige al usuario a la página de OAuth de Google
      // El flujo se completa automáticamente cuando el usuario autoriza
      await initOAuth({ provider: 'google' });
    } catch (error: any) {
      console.error('❌ Error en login con Google:', error);
      console.error('Error completo:', JSON.stringify(error, null, 2));
      
      // Mensajes de error más específicos
      let errorMessage = 'Error al iniciar sesión con Google.';
      
      if (error?.message) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('not allowed') || errorMsg.includes('not enabled') || errorMsg.includes('disabled')) {
          errorMessage = '⚠️ Login con Google no está habilitado.\n\nPor favor:\n1. Ve a Privy Dashboard (https://dashboard.privy.io)\n2. Settings > OAuth > Google\n3. Activa "Enable Google OAuth"\n4. Configura tu Google Client ID y Secret';
        } else if (errorMsg.includes('not configured') || errorMsg.includes('missing')) {
          errorMessage = '⚠️ Google OAuth no está configurado.\n\nPor favor:\n1. Ve a Privy Dashboard > Settings > OAuth > Google\n2. Ingresa tu Google Client ID y Secret\n3. Guarda los cambios';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      setLoading(null);
    }
    // Nota: No establecemos loading a null aquí porque el usuario será redirigido
  };

  const handleTelegramLogin = async () => {
    if (!hasPrivy) {
      showDemoMessage();
      return;
    }
    
    setLoading('telegram');
    setError(null);
    try {
      // loginWithTelegram abre una ventana de Telegram para autenticación
      // El flujo se completa automáticamente cuando el usuario autoriza
      await loginWithTelegram();
    } catch (error: any) {
      console.error('Error en login con Telegram:', error);
      setError(error?.message || 'Error al iniciar sesión con Telegram. Por favor, intenta de nuevo.');
      setLoading(null);
    }
    // Nota: No establecemos loading a null aquí porque el usuario será redirigido
  };

  const handleAppleLogin = async () => {
    if (!hasPrivy) {
      showDemoMessage();
      return;
    }
    
    setLoading('apple');
    setError(null);
    try {
      // initOAuth redirige al usuario a la página de OAuth de Apple
      // El flujo se completa automáticamente cuando el usuario autoriza
      await initOAuth({ provider: 'apple' });
    } catch (error: any) {
      console.error('Error en login con Apple:', error);
      setError(error?.message || 'Error al iniciar sesión con Apple. Por favor, intenta de nuevo.');
      setLoading(null);
    }
    // Nota: No establecemos loading a null aquí porque el usuario será redirigido
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
        <div className={styles.loginPrompt}>
          <span>Login or sign up</span>
          <button className={styles.closeBtn} onClick={onBack}>×</button>
        </div>

        <form className={styles.emailForm} onSubmit={handleEmailSubmit}>
          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}>✉</span>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={handleEmailChange}
              className={styles.emailInput}
            />
            <button
              type="submit"
              className={`${styles.submitBtn} ${email && email.includes('@') ? styles.active : ''}`}
            >
              Submit
            </button>
          </div>
        </form>

        {error && (
          <div className={styles.errorMessage} style={{ 
            padding: '12px', 
            margin: '12px 0', 
            backgroundColor: '#fee', 
            color: '#c33', 
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <div className={styles.socialLogin}>
          <button 
            className={styles.socialBtn} 
            onClick={handleGoogleLogin}
            disabled={loading !== null}
          >
            <span className={`${styles.socialIcon} ${styles.googleIcon}`}>G</span>
            <span>{loading === 'google' ? 'Conectando...' : 'Google'}</span>
            {email && !loading && <span className={styles.recentTag}>Recent</span>}
          </button>

          {!showMoreOptions ? (
            <>
              <button 
                className={styles.socialBtn} 
                onClick={handleTelegramLogin}
                disabled={loading !== null}
              >
                <span className={`${styles.socialIcon} ${styles.telegramIcon}`}>✈</span>
                <span>{loading === 'telegram' ? 'Conectando...' : 'Telegram'}</span>
              </button>
              <button
                className={styles.socialBtn}
                onClick={() => setShowMoreOptions(true)}
                disabled={loading !== null}
              >
                <span className={`${styles.socialIcon} ${styles.personIcon}`}>👤</span>
                <span>More options</span>
                <span className={styles.arrow}>→</span>
              </button>
            </>
          ) : (
            <button 
              className={styles.socialBtn} 
              onClick={handleAppleLogin}
              disabled={loading !== null}
            >
              <span className={`${styles.socialIcon} ${styles.appleIcon}`}>🍎</span>
              <span>{loading === 'apple' ? 'Conectando...' : 'Apple'}</span>
            </button>
          )}
        </div>

        {/* Botón de bypass para desarrollo */}
        <div className={styles.bypassContainer}>
          <button className={styles.bypassBtn} onClick={onBypass} title="Bypass login para desarrollo">
            🚀 Bypass Login (Dev)
          </button>
          {timeRemaining !== null && (
            <span className={styles.bypassTime}>
              Tiempo restante: {formatTime(timeRemaining)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;

