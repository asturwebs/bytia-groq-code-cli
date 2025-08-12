# CLI Multi-LLM para Programación

[English](README.md) | **Español**

---

<h2 align="center">
 <br>
 <img src="docs/thumbnail.png" alt="Multi-LLM Code CLI" width="400">
 <br>
 <br>
 CLI Multi-LLM para Programación: Una interfaz de línea de comandos altamente personalizable, ligera y de código abierto con soporte multi-proveedor (Groq, Ollama, LM Studio) para iteración instantánea.
 <br>
</h2>

<p align="center">
 <a href="https://github.com/build-with-groq/groq-code-cli/stargazers"><img src="https://img.shields.io/github/stars/build-with-groq/groq-code-cli"></a>
 <a href="https://github.com/build-with-groq/groq-code-cli/blob/main/LICENSE">
 <img src="https://img.shields.io/badge/License-MIT-green.svg">
 </a>
</p>

## 🎯 Características Principales

### Soporte Multi-Proveedor
- **Groq** - Inferencia rápida en la nube
- **Ollama** - Modelos de IA locales con enfoque en privacidad
- **LM Studio** - Gestión local de modelos con interfaz gráfica

### ✨ Funcionalidades
- **Múltiples proveedores LLM** - Cambia entre Groq, Ollama y LM Studio
- **Integración avanzada de herramientas** - lee, escribe, edita archivos, ejecuta comandos
- **Sistema inteligente de agentes** con personalidades personalizables
- **Interrupción en tiempo real** - ESC para detener respuestas en cualquier momento
- **Sistema de aprobación de herramientas** - controla qué puede ejecutar la IA
- **Gestión de sesiones** - conversaciones persistentes
- **Auto-detección de proveedores** - encuentra automáticamente servicios disponibles
- **Gestión unificada de modelos** - accede a modelos de todos los proveedores
- **Modo debug** - registro detallado e inspección de llamadas API

## 🚀 Instalación

### Instalación Rápida
```bash
# Instalar globalmente vía npm
npm install -g groq-code-cli

# O probar sin instalar
npx groq-code-cli@latest
```

### Para Desarrollo (Recomendado)

#### Linux/macOS
```bash
git clone https://github.com/build-with-groq/groq-code-cli.git
cd groq-code-cli
./install.sh    # Instalador automatizado con varias opciones
```

O manualmente:
```bash
npm install
npm run build
npm link        # Habilita el comando `groq` en cualquier directorio
```

## 💻 Uso

```bash
# Iniciar sesión de chat
groq
```

### Comandos Disponibles

#### Comandos Principales
- `/help` - Mostrar ayuda y comandos disponibles
- `/login` - Iniciar sesión con tu clave API de Groq (soporte legacy)
- `/model <nombre_modelo>` - Seleccionar tu modelo
- `/clear` - Limpiar historial de chat y contexto
- `/reasoning` - Alternar visualización de contenido de razonamiento
- `/version`, `/v` - Mostrar información de versión actual
- `/update` - Verificar actualizaciones y actualizar a la última versión

#### 🔥 **Comandos Multi-Proveedor**
- `/providers` - Listar todos los proveedores LLM disponibles y su estado
- `/switch <proveedor>` - Cambiar entre Groq, Ollama y LM Studio
- `/models [consulta]` - Listar o buscar modelos de todos los proveedores
- `/provider-help` - Guía de configuración para todos los proveedores

#### 🔄 **Comandos de Gestión de Sesión**
- `/session save` - Guardar manualmente la sesión actual
- `/session restore` - Restaurar la última sesión guardada  
- `/session clear` - Eliminar sesión guardada
- `/session status` - Mostrar información de sesión
- `/sess` - Alias para `/session`

> **💾 Auto-Guardado**: Las sesiones se guardan automáticamente después de cada interacción y se restauran al iniciar (expiran después de 24 horas)

#### 🤖 **Comandos de Gestión de Agentes**
- `/agent [nombre]` - Cambiar a un agente diferente o listar agentes disponibles
- `/agents` - Listar todos los agentes disponibles con detalles
- `/agent-create <nombre> <prompt>` - Crear un nuevo agente con prompt del sistema personalizado
- `/agent-delete <nombre>` - Eliminar un agente personalizado
- `/agent-export <nombre> <archivo>` - Exportar un agente a un archivo
- `/agent-import <archivo>` - Importar un agente desde un archivo
- `/system <prompt>` - Establecer un prompt del sistema temporal para la sesión actual
- `/system-reset` - Restablecer al prompt del sistema por defecto

> **🌟 Inicio Rápido**: Usa `/providers` para ver qué está disponible, luego `/switch ollama` para usar modelos locales!

## ⚙️ Configuración de Proveedores

### Configuración de Groq
1. Obtén tu clave API desde [console.groq.com](https://console.groq.com/keys)
2. Establece la variable de entorno: `export GROQ_API_KEY=tu_clave_aqui`
3. O usa el comando `/login` en la CLI

### Configuración de Ollama
1. Instala desde [ollama.ai](https://ollama.ai)
2. Ejecuta `ollama serve` para iniciar el servidor
3. Descarga modelos: `ollama pull llama3.2`

### Configuración de LM Studio
1. Instala desde [lmstudio.ai](https://lmstudio.ai)
2. Habilita el servidor local en configuración
3. Carga modelos a través de la interfaz gráfica

## 🔄 Migración desde Versión Legacy

Los usuarios existentes no necesitan cambiar nada:
- Tu clave API de Groq seguirá funcionando
- Todos los comandos existentes permanecen igual
- La CLI detecta y usa Groq automáticamente si está configurado

## 🚨 Controles de Interrupción

**Problema Resuelto**: La CLI ahora tiene manejo robusto de interrupciones para cuando el agente se atasca en bucles o procesos largos.

**Referencia Rápida:**
- **ESC**: Interrupción inteligente (consciente del contexto)
- **Ctrl+C**: Salida forzada (presiona dos veces si es necesario)
- **ESC durante procesamiento**: Interrumpir generación de IA
- **ESC durante aprobación**: Rechazar ejecución de herramienta
- **ESC mientras escribes**: Limpiar texto de entrada

## 🛠️ Desarrollo

### Estructura del Proyecto

```
groq-code-cli/
├── src/
│   ├── commands/           
│   │   ├── definitions/        # Implementaciones de comandos individuales
│   │   │   ├── providers.ts    # 🔥 NUEVO: Comandos multi-proveedor
│   │   │   ├── clear.ts        # Comando limpiar historial
│   │   │   ├── help.ts         # Comando ayuda
│   │   │   ├── login.ts        # Comando autenticación
│   │   │   └── model.ts        # Comando selección de modelo
│   │   └── index.ts            # Exportaciones de comandos
│   ├── core/               
│   │   ├── agent.ts            # 🔄 Implementación del agente IA (refactorizado)
│   │   ├── provider-manager.ts # 🔥 NUEVO: Gestión de proveedores
│   │   └── cli.ts              # Punto de entrada CLI
│   ├── providers/          # 🔥 NUEVO: Sistema de proveedores
│   │   ├── base.ts             # Interfaces base
│   │   ├── groq.ts             # Proveedor Groq
│   │   ├── ollama.ts           # Proveedor Ollama
│   │   ├── lmstudio.ts         # Proveedor LM Studio
│   │   └── index.ts            # Exportaciones
│   ├── tools/              
│   │   ├── tool-schemas.ts     # Definiciones de esquemas de herramientas
│   │   ├── tools.ts            # Implementaciones de herramientas
│   │   └── validators.ts       # Utilidades de validación
│   ├── ui/                 
│   │   ├── App.tsx             # Componente principal de aplicación
│   │   ├── components/         # Componentes de interfaz
│   │   └── hooks/              # Hooks de React
│   └── utils/              
│       ├── local-settings.ts   # 🔄 Gestión de configuración (mejorado)
│       └── ...                 # Otras utilidades
├── docs/                   
├── PROVIDERS.md            # 🔥 NUEVO: Guía completa (Español/Inglés)
├── README.es.md           # 🔥 NUEVO: README en español
├── CHANGELOG.md           # 🔄 Actualizado con nuevas funcionalidades
└── package.json           # 🔄 v2.0.0 con nuevas keywords
```

## 🎉 Nuevas Funcionalidades en v2.0.0

### 🔥 Arquitectura Multi-Proveedor
- **Gestión Unificada**: Cambia entre proveedores sin problemas
- **Auto-detección**: Encuentra automáticamente proveedores disponibles
- **Respaldo Inteligente**: Se adapta cuando un proveedor falla

### 🆕 Comandos Slash
- **`/providers`** - Estado completo de proveedores
- **`/switch <proveedor>`** - Cambio dinámico de proveedor
- **`/models [consulta]`** - Búsqueda unificada de modelos
- **`/provider-help`** - Guía de configuración interactiva

### 🏗️ Mejoras Técnicas
- **ProviderManager**: Sistema centralizado de gestión
- **Interfaz LLM Abstracta**: Fácil extensión para nuevos proveedores
- **Configuración Persistente**: Guarda preferencias automáticamente
- **Monitoreo de Salud**: Verifica proveedores en tiempo real

## 🌟 Casos de Uso

### Para Desarrolladores de Código Abierto
```bash
/switch ollama          # Usar modelos locales para privacidad
/models llama           # Encontrar modelos Llama disponibles
```

### Para Desarrollo Empresarial
```bash
/switch groq            # Usar inferencia rápida en la nube
/models coding          # Buscar modelos especializados en código
```

### Para Experimentación
```bash
/providers              # Ver qué opciones tienes
/switch lmstudio        # Probar modelos experimentales
/models 70b             # Encontrar modelos grandes
```

## 🤝 Contribuir

¡Las mejoras a través de PRs son bienvenidas!

Para problemas y solicitudes de funcionalidades, por favor abre un issue en GitHub.

#### ¡Comparte lo que crees con Groq en nuestras [redes sociales](https://x.com/GroqInc)!

---

**¿Preguntas?** Revisa nuestra [documentación completa](PROVIDERS.md) o abre un issue en GitHub.

**¿Te gusta el proyecto?** ¡Dale una ⭐ en GitHub!

---

*Este es un proyecto de la comunidad que extiende el CLI original de Groq con capacidades multi-proveedor.*
