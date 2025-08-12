# Multi-LLM Provider Support / Soporte Multi-Proveedor LLM

[English](#english) | [Español](#español)

---

## English

### Overview
This CLI now supports multiple LLM providers, allowing you to switch between different AI services seamlessly. Currently supported providers:

- **Groq** - Cloud-based, fast inference
- **Ollama** - Local AI models, privacy-focused
- **LM Studio** - Local GUI-based model management

### Provider Commands

#### `/providers` - List Available Providers
Shows all available providers and their connection status.

```bash
/providers  # or /prov or /p
```

**Output example:**
```
🔍 Provider Status Summary

📊 Overview: 2/3/3 (connected/available/total)
🎯 Active: groq

Providers:
✅ Groq (groq)
   High-performance cloud inference
   Status: Connected
   Endpoint: https://api.groq.com
   Models: 8 available

🔶 Ollama (ollama)
   Local AI models with privacy focus
   Status: Available but not connected
   Endpoint: http://localhost:11434
   Models: 0 available

❌ LM Studio (lmstudio)
   Local GUI-based model management
   Status: Not Available
   Error: Service not running
```

#### `/switch <provider>` - Switch Provider
Changes the active LLM provider.

```bash
/switch groq      # Switch to Groq
/switch ollama    # Switch to Ollama
/switch lmstudio  # Switch to LM Studio
```

#### `/models [query]` - List Models
Shows all available models from all providers, with optional search.

```bash
/models           # List all models
/models llama     # Search for models containing "llama"
/models 70b       # Search for 70B parameter models
```

**Output example:**
```
🎯 All Available Models

Groq (8 models)
• llama-3.1-405b-reasoning - Meta's largest reasoning model (131K context, functions)
• llama-3.1-70b-versatile - Versatile 70B model (131K context, functions)
• llama-3.1-8b-instant - Fast 8B model (131K context, functions)

Ollama (5 models)
• llama3.2:latest - Latest Llama 3.2 model (128K context, 2GB)
• mistral:7b - Mistral 7B model (32K context, 4GB)

Total: 13 models across 2 providers
```

#### `/provider-help` - Setup Guide
Shows detailed setup instructions for all providers.

```bash
/provider-help  # or /phelp or /setup
```

### Provider Setup

#### Groq Setup
1. Get API key from [console.groq.com](https://console.groq.com/keys)
2. Set environment variable: `export GROQ_API_KEY=your_key_here`
3. Or use `/login` command in CLI

#### Ollama Setup
1. Install from [ollama.ai](https://ollama.ai)
2. Run `ollama serve` to start the server
3. Pull models: `ollama pull llama3.2`

#### LM Studio Setup
1. Install from [lmstudio.ai](https://lmstudio.ai)
2. Enable local server in settings
3. Load models through the GUI

### Migration from Legacy Groq-only Version
Existing users don't need to change anything:
- Your Groq API key will continue working
- All existing commands remain the same
- The CLI automatically detects and uses Groq if configured

### Advanced Features

#### Auto-detection
The CLI automatically detects available providers and selects the best one based on priority:
1. Groq (if API key available)
2. Ollama (if running locally)
3. LM Studio (if server enabled)

#### Provider Failover
If the active provider fails, the CLI can automatically switch to an alternative provider.

#### Model Search
Search across all providers simultaneously:
```bash
/models coding    # Find coding-specialized models
/models fast      # Find models optimized for speed
/models reasoning # Find reasoning-capable models
```

---

## Español

### Descripción General
Esta CLI ahora soporta múltiples proveedores de LLM, permitiendo cambiar entre diferentes servicios de IA sin problemas. Proveedores actualmente soportados:

- **Groq** - Basado en la nube, inferencia rápida
- **Ollama** - Modelos de IA locales, enfocado en privacidad
- **LM Studio** - Gestión local de modelos con GUI

### Comandos de Proveedores

#### `/providers` - Listar Proveedores Disponibles
Muestra todos los proveedores disponibles y su estado de conexión.

```bash
/providers  # o /prov o /p
```

**Ejemplo de salida:**
```
🔍 Resumen de Estado de Proveedores

📊 Resumen: 2/3/3 (conectados/disponibles/total)
🎯 Activo: groq

Proveedores:
✅ Groq (groq)
   Inferencia en la nube de alto rendimiento
   Estado: Conectado
   Endpoint: https://api.groq.com
   Modelos: 8 disponibles

🔶 Ollama (ollama)
   Modelos de IA locales con enfoque en privacidad
   Estado: Disponible pero no conectado
   Endpoint: http://localhost:11434
   Modelos: 0 disponibles

❌ LM Studio (lmstudio)
   Gestión local de modelos con GUI
   Estado: No Disponible
   Error: Servicio no ejecutándose
```

#### `/switch <proveedor>` - Cambiar Proveedor
Cambia el proveedor LLM activo.

```bash
/switch groq      # Cambiar a Groq
/switch ollama    # Cambiar a Ollama
/switch lmstudio  # Cambiar a LM Studio
```

#### `/models [consulta]` - Listar Modelos
Muestra todos los modelos disponibles de todos los proveedores, con búsqueda opcional.

```bash
/models           # Listar todos los modelos
/models llama     # Buscar modelos que contengan "llama"
/models 70b       # Buscar modelos de 70B parámetros
```

**Ejemplo de salida:**
```
🎯 Todos los Modelos Disponibles

Groq (8 modelos)
• llama-3.1-405b-reasoning - El modelo de razonamiento más grande de Meta (131K contexto, funciones)
• llama-3.1-70b-versatile - Modelo versátil de 70B (131K contexto, funciones)
• llama-3.1-8b-instant - Modelo rápido de 8B (131K contexto, funciones)

Ollama (5 modelos)
• llama3.2:latest - Último modelo Llama 3.2 (128K contexto, 2GB)
• mistral:7b - Modelo Mistral 7B (32K contexto, 4GB)

Total: 13 modelos en 2 proveedores
```

#### `/provider-help` - Guía de Configuración
Muestra instrucciones detalladas de configuración para todos los proveedores.

```bash
/provider-help  # o /phelp o /setup
```

### Configuración de Proveedores

#### Configuración de Groq
1. Obtén la clave API de [console.groq.com](https://console.groq.com/keys)
2. Establece la variable de entorno: `export GROQ_API_KEY=tu_clave_aqui`
3. O usa el comando `/login` en la CLI

#### Configuración de Ollama
1. Instala desde [ollama.ai](https://ollama.ai)
2. Ejecuta `ollama serve` para iniciar el servidor
3. Descarga modelos: `ollama pull llama3.2`

#### Configuración de LM Studio
1. Instala desde [lmstudio.ai](https://lmstudio.ai)
2. Habilita el servidor local en configuración
3. Carga modelos a través de la GUI

### Migración desde la Versión Legacy Solo-Groq
Los usuarios existentes no necesitan cambiar nada:
- Tu clave API de Groq seguirá funcionando
- Todos los comandos existentes permanecen igual
- La CLI detecta y usa Groq automáticamente si está configurado

### Características Avanzadas

#### Auto-detección
La CLI detecta automáticamente los proveedores disponibles y selecciona el mejor basado en prioridad:
1. Groq (si hay clave API disponible)
2. Ollama (si está ejecutándose localmente)
3. LM Studio (si el servidor está habilitado)

#### Failover de Proveedores
Si el proveedor activo falla, la CLI puede cambiar automáticamente a un proveedor alternativo.

#### Búsqueda de Modelos
Busca en todos los proveedores simultáneamente:
```bash
/models coding    # Encontrar modelos especializados en codificación
/models fast      # Encontrar modelos optimizados para velocidad
/models reasoning # Encontrar modelos capaces de razonamiento
```
