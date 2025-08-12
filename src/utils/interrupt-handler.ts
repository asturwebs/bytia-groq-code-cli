import { logger } from './logger.js';

/**
 * Sistema robusto de manejo de interrupciones para la CLI de Groq
 * Maneja tanto señales del sistema (Ctrl+C) como interrupciones de UI (ESC)
 */
export class InterruptHandler {
  private static instance: InterruptHandler;
  private isShuttingDown: boolean = false;
  private interruptCallbacks: Array<() => void | Promise<void>> = [];
  private signalHandlers: Array<{ signal: NodeJS.Signals; handler: NodeJS.SignalsListener }> = [];

  private constructor() {
    this.setupSignalHandlers();
  }

  public static getInstance(): InterruptHandler {
    if (!InterruptHandler.instance) {
      InterruptHandler.instance = new InterruptHandler();
    }
    return InterruptHandler.instance;
  }

  /**
   * Configura manejadores para señales del sistema
   */
  private setupSignalHandlers(): void {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    
    signals.forEach(signal => {
      const handler = this.createSignalHandler(signal);
      process.on(signal, handler);
      this.signalHandlers.push({ signal, handler });
    });

    // Manejador especial para SIGINT (Ctrl+C) - más inmediato
    const ctrlCHandler = () => {
      if (this.isShuttingDown) {
        // Si ya estamos cerrando y el usuario presiona Ctrl+C de nuevo,
        // forzar salida inmediata
        logger.warn('Force exit requested by user (double Ctrl+C)');
        console.log('\n🔴 Force exit...');
        process.exit(130); // 128 + 2 (SIGINT)
      }
      this.handleInterrupt('SIGINT');
    };

    // Reemplazar el manejador de SIGINT con el especial
    process.removeAllListeners('SIGINT');
    process.on('SIGINT', ctrlCHandler);
  }

  /**
   * Crea un manejador de señal genérico
   */
  private createSignalHandler(signal: NodeJS.Signals): NodeJS.SignalsListener {
    return () => {
      this.handleInterrupt(signal);
    };
  }

  /**
   * Maneja una interrupción desde cualquier fuente
   */
  private async handleInterrupt(source: string): Promise<void> {
    if (this.isShuttingDown) {
      return; // Ya estamos procesando una interrupción
    }

    this.isShuttingDown = true;
    logger.info(`Interrupt received from ${source}, initiating graceful shutdown...`);
    
    // Mostrar mensaje inmediato al usuario
    console.log(`\n🟡 Interrupting current operation... (${source})`);
    
    try {
      // Ejecutar todos los callbacks de interrupción con timeout
      const interruptPromises = this.interruptCallbacks.map(callback => {
        return Promise.resolve(callback()).catch(error => {
          logger.error('Error in interrupt callback', error);
        });
      });

      // Dar máximo 2 segundos para limpieza
      await Promise.race([
        Promise.all(interruptPromises),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);

      console.log('✅ Cleanup completed successfully');
      logger.info('Graceful shutdown completed');
      
    } catch (error) {
      logger.error('Error during graceful shutdown', error);
      console.log('⚠️  Cleanup had some issues, but continuing shutdown...');
    }

    // Salir con código apropiado
    const exitCode = source === 'SIGINT' ? 130 : 0;
    process.exit(exitCode);
  }

  /**
   * Registra un callback que se ejecutará cuando se reciba una interrupción
   */
  public onInterrupt(callback: () => void | Promise<void>): () => void {
    this.interruptCallbacks.push(callback);
    
    // Retornar función para desregistrar
    return () => {
      const index = this.interruptCallbacks.indexOf(callback);
      if (index > -1) {
        this.interruptCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Dispara una interrupción manualmente (por ejemplo, desde UI)
   */
  public triggerInterrupt(source: string = 'UI'): void {
    this.handleInterrupt(source);
  }

  /**
   * Verifica si estamos en proceso de shutdown
   */
  public isShuttingDownState(): boolean {
    return this.isShuttingDown;
  }

  /**
   * Limpia todos los manejadores de señales (para testing)
   */
  public cleanup(): void {
    this.signalHandlers.forEach(({ signal, handler }) => {
      process.removeListener(signal, handler);
    });
    this.signalHandlers = [];
    this.interruptCallbacks = [];
    this.isShuttingDown = false;
  }
}

// Función de conveniencia para inicializar el manejador
export function initializeInterruptHandler(): InterruptHandler {
  const handler = InterruptHandler.getInstance();
  logger.debug('Interrupt handler initialized');
  return handler;
}

// Función de conveniencia para registrar cleanup
export function onInterrupt(callback: () => void | Promise<void>): () => void {
  return InterruptHandler.getInstance().onInterrupt(callback);
}

// Función de conveniencia para disparar interrupción manual
export function triggerInterrupt(source: string = 'UI'): void {
  InterruptHandler.getInstance().triggerInterrupt(source);
}
