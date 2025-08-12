# 🚨 Manejo de Interrupciones en Groq CLI

## Problema Solucionado

Este documento describe cómo **solucionar el problema de no poder interrumpir el agente** cuando está trabajando y se mete en bucles infinitos o procesos largos.

## ✅ Soluciones Implementadas

### 1. **Tecla ESC - Control Inteligente**

La tecla **ESC** ahora funciona de manera inteligente según el contexto:

| Situación | Acción de ESC | Resultado |
|-----------|---------------|-----------|
| 🤔 **AI procesando** | Interrumpe la generación | ⏹️ "Request interrupted by user (ESC)" |
| ⚠️ **Esperando aprobación** | Rechaza la herramienta | 🚫 "Tool execution rejected by user (ESC)" |
| ⚙️ **Herramienta ejecutándose** | Muestra advertencia | ⚠️ "Cannot interrupt tool execution in progress" |
| ✏️ **Escribiendo texto** | Limpia el input | 🧹 Campo de texto vacío |
| 💭 **Sin actividad** | Muestra ayuda | 💡 Guía de comandos disponibles |

### 2. **Ctrl+C - Salida Forzada**

- **Primera vez**: Cierre elegante con limpieza
- **Segunda vez**: Salida forzada inmediata
- **Siempre disponible** sin importar el estado

### 3. **Feedback Visual Mejorado**

#### Placeholders Dinámicos:
- **Normal**: `"... (ESC for help, Ctrl+C to exit)"`
- **Procesando**: `"... (ESC to interrupt, Ctrl+C to force exit)"`

#### Mensajes de Estado:
- **Procesando AI**: `"Processing... (ESC to interrupt)"`
- **Ejecutando herramientas**: `"Executing [tool_name]... (Please wait)"`

## 🎯 Casos de Uso Comunes

### 1. **Agente en Bucle Infinito**
```
Situación: El AI está "pensando" demasiado tiempo
Solución: Presiona ESC
Resultado: Se interrumpe y puedes hacer otra pregunta
```

### 2. **Respuesta Muy Larga**
```
Situación: El AI está generando una respuesta demasiado larga
Solución: Presiona ESC durante "Processing..."
Resultado: Se detiene y puedes reformular tu pregunta
```

### 3. **Error en la Pregunta**
```
Situación: Te das cuenta que preguntaste algo incorrecto
Solución: Presiona ESC para interrumpir
Resultado: Puedes hacer la pregunta correcta inmediatamente
```

### 4. **Herramienta No Deseada**
```
Situación: El AI quiere ejecutar una herramienta que no quieres
Solución: Presiona ESC cuando aparezca la aprobación
Resultado: Se rechaza la herramienta y continúa sin ella
```

### 5. **Salida de Emergencia**
```
Situación: Nada funciona o quieres salir inmediatamente
Solución: Ctrl+C (doble presión si es necesario)
Resultado: Salida forzada del CLI
```

## ⚙️ Características Técnicas

### Sistema de Manejo de Señales
- **SIGINT** (Ctrl+C): Manejo elegante con limpieza automática
- **SIGTERM**: Cierre controlado del sistema
- **AbortController**: Cancelación de requests HTTP en curso
- **Timeout de limpieza**: Máximo 2 segundos para cleanup

### Estados de Interrupción
1. **Procesamiento AI**: ✅ Interrumpible
2. **Aprobación herramientas**: ✅ Rechazable
3. **Ejecución herramientas**: ❌ No interrumpible (por seguridad)
4. **Entrada de usuario**: ✅ Limpiable

### Logging de Interrupciones
Todas las interrupciones se registran en los logs para debugging:
```javascript
logger.info('User interrupted processing via ESC');
logger.info('User rejected tool execution via ESC');
logger.warn('Force exit requested by user (double Ctrl+C)');
```

## 🔧 Para Desarrolladores

### Agregar Nuevos Tipos de Interrupción

```typescript
// En interrupt-handler.ts
onInterrupt(async () => {
  // Tu lógica de limpieza aquí
  await cleanup();
});
```

### Verificar Estado de Shutdown

```typescript
import { InterruptHandler } from '../utils/interrupt-handler.js';

if (InterruptHandler.getInstance().isShuttingDownState()) {
  // No iniciar nuevas operaciones
  return;
}
```

## 🚀 Resultado Final

**Antes**: 
- ❌ ESC no funcionaba
- ❌ Imposible salir de bucles
- ❌ Sin feedback claro
- ❌ Ctrl+C problemático

**Después**:
- ✅ ESC funciona inteligentemente
- ✅ Múltiples formas de interrumpir
- ✅ Feedback visual claro
- ✅ Control total del usuario
- ✅ Salida elegante y forzada
- ✅ Documentación completa

## 💡 Consejos de Uso

1. **Usa ESC libremente** - Es seguro y contextual
2. **Ctrl+C** para salida rápida - Siempre funciona
3. **Espera durante ejecución de herramientas** - Es la parte más importante
4. **Usa /help** para recordar opciones
5. **Double Ctrl+C** si algo falla

¡Ahora tienes control completo sobre la CLI! 🎉
