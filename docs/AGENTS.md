# 🤖 Sistema de Agentes - Groq CLI

## Problema Solucionado

Este documento describe cómo **inyectar system prompts personalizados** y crear **múltiples agentes especializados** manteniendo toda la funcionalidad agéntica original de la CLI.

## ✅ **Solución Implementada**

### **Sistema Completo de Agentes**
- ✅ **Múltiples personalidades** con diferentes especialidades
- ✅ **System prompts personalizados** completamente funcionales
- ✅ **Persistencia** de agentes entre sesiones
- ✅ **Agentes predefinidos** listos para usar
- ✅ **Import/Export** para compartir agentes
- ✅ **Switching dinámico** sin perder funcionalidad
- ✅ **Compatibilidad total** con todas las herramientas

---

## 🎯 **Comandos Disponibles**

### **Gestión Básica**
```bash
/agents                    # Listar todos los agentes
/agent <nombre>           # Cambiar a un agente específico  
/agent reviewer           # Ejemplo: cambiar al agente reviewer
/system-reset            # Volver al agente por defecto
```

### **Creación y Edición**
```bash
/agent-create <nombre> <prompt>           # Crear nuevo agente
/system <prompt>                         # Prompt temporal (sesión actual)
/agent-delete <nombre>                   # Eliminar agente personalizado
```

### **Import/Export**
```bash
/agent-export <nombre> <archivo>         # Exportar agente a archivo
/agent-import <archivo>                  # Importar agente desde archivo
```

---

## 🎯 **Agentes Predefinidos**

### **1. `reviewer` - Especialista en Revisión de Código**
```bash
/agent reviewer
```
**Especializado en:**
- Análisis de seguridad y vulnerabilidades
- Optimizaciones de rendimiento
- Mejores prácticas y patrones de diseño
- Cobertura de testing
- Mantenibilidad del código

### **2. `architect` - Arquitecto de Sistemas**
```bash
/agent architect
```
**Especializado en:**
- Diseño de sistemas y arquitectura de alto nivel
- Recomendaciones de tecnología
- Arquitectura escalable y de rendimiento
- Diseño de APIs y microservicios
- Documentación arquitectónica

### **3. `debugger` - Especialista en Debugging**
```bash
/agent debugger
```
**Especializado en:**
- Encontrar y corregir bugs eficientemente
- Análisis de causa raíz
- Reprodución de problemas
- Casos de prueba mínimos
- Prevención de bugs similares

### **4. `teacher` - Mentor Educativo**
```bash
/agent teacher
```
**Especializado en:**
- Explicaciones paso a paso
- Ejemplos prácticos y ejercicios
- Conceptos fundamentales
- Mejores prácticas educativas
- Mentoría y guía

### **5. `optimizer` - Experto en Optimización**
```bash
/agent optimizer
```
**Especializado en:**
- Análisis de rendimiento
- Optimizaciones de algoritmos
- Eficiencia de memoria y recursos
- Benchmarking y profiling
- Caching y estrategias de optimización

---

## 🚀 **Ejemplos de Uso**

### **Ejemplo 1: System Prompt Temporal**
```bash
/system "You are a Python data science expert. Always provide working pandas and matplotlib examples with explanations."
```
- ✅ **Cambia inmediatamente** el comportamiento del AI
- ✅ **Mantiene todas las herramientas** (read_file, create_file, etc.)
- ✅ **Solo para esta sesión** - no se guarda permanentemente

### **Ejemplo 2: Crear Agente Personalizado**
```bash
/agent-create security "You are a cybersecurity expert focused on finding vulnerabilities, implementing security best practices, and conducting security audits. Always prioritize security over convenience."
```
- ✅ **Se guarda permanentemente** en `~/.groq/agents/`
- ✅ **Disponible en futuras sesiones**
- ✅ **Mantiene funcionalidad completa**

### **Ejemplo 3: Usar Agente Especializado**
```bash
/agent debugger
# Ahora el AI está optimizado para debugging
"Find the bug in this function"
```

### **Ejemplo 4: Compartir Agentes**
```bash
# Exportar tu agente personalizado
/agent-export security ./my-security-expert.json

# Compartir con equipo, importar en otra máquina
/agent-import ./my-security-expert.json
```

---

## 🔧 **Casos de Uso Profesionales**

### **1. Code Review Workflow**
```bash
/agent reviewer
"Review this pull request for security issues and performance problems"
```

### **2. Architecture Planning**
```bash
/agent architect  
"Design a microservices architecture for this e-commerce system"
```

### **3. Educational Sessions**
```bash
/agent teacher
"Explain how React hooks work with practical examples"
```

### **4. Debugging Sessions** 
```bash
/agent debugger
"This API is returning 500 errors intermittently, help me find the issue"
```

### **5. Performance Optimization**
```bash
/agent optimizer
"Analyze this database query and suggest optimizations"
```

### **6. Custom Domain Expert**
```bash
/agent-create blockchain "You are a blockchain and cryptocurrency expert specializing in smart contracts, DeFi protocols, and Web3 development."
/agent blockchain
"Help me create a secure ERC-20 token contract"
```

---

## 📁 **Estructura de Archivos**

### **Directorio de Agentes**
```
~/.groq/agents/
├── reviewer.json          # Agente revisor de código
├── architect.json         # Agente arquitecto
├── debugger.json          # Agente debugging
├── teacher.json           # Agente educativo
├── optimizer.json         # Agente optimización
└── mi_agente_custom.json  # Tus agentes personalizados
```

### **Formato de Archivo de Agente**
```json
{
  "name": "security",
  "description": "Cybersecurity expert specializing in...",
  "systemPrompt": "You are a cybersecurity expert...",
  "model": "moonshotai/kimi-k2-instruct",
  "temperature": 0.3,
  "created": "2024-01-15T10:30:00.000Z",
  "lastUsed": "2024-01-15T15:45:00.000Z"
}
```

---

## 💡 **Consejos y Mejores Prácticas**

### **Para System Prompts Efectivos:**
1. **Sé específico** sobre el dominio y especialidad
2. **Incluye instrucciones** sobre el uso de herramientas
3. **Define el tono** y estilo de comunicación
4. **Especifica limitaciones** o enfoques preferidos
5. **Menciona el nivel** de detalle esperado

### **Naming Conventions:**
- **Nombres cortos**: `reviewer`, `debug`, `teacher`
- **Sin espacios**: usa guiones bajos `my_agent`
- **Descriptivos**: `security_audit`, `react_expert`

### **Organización de Agentes:**
- **General purpose**: `reviewer`, `debugger`, `optimizer`
- **Technology-specific**: `react_expert`, `python_guru`
- **Domain-specific**: `security`, `blockchain`, `ml_engineer`
- **Team-specific**: `company_standards`, `project_lead`

---

## 🔄 **Workflow Completo**

### **1. Explorar Agentes Disponibles**
```bash
/agents  # Ver todos los agentes
```

### **2. Probar Agentes Predefinidos**
```bash
/agent reviewer     # Para revisión de código
/agent architect    # Para diseño de sistemas  
/agent debugger     # Para encontrar bugs
```

### **3. Crear Agente Personalizado**
```bash
/agent-create myexpert "Your custom system prompt here"
```

### **4. Usar y Refinar**
```bash
/agent myexpert     # Cambiar al agente
# Trabajar con el agente...
# Si necesitas ajustes, usa /system para pruebas temporales
```

### **5. Guardar y Compartir**
```bash
/agent-export myexpert ./team-agent.json
# Compartir archivo con equipo
```

---

## ⚡ **Características Avanzadas**

### **Switching Inteligente**
- **Mantiene historial** de conversación al cambiar agentes
- **Aplica nuevo prompt** inmediatamente
- **Preserva configuración** de herramientas y modelos

### **Persistencia Automática**
- **Guarda automáticamente** última fecha de uso
- **Ordena agentes** por frecuencia de uso
- **Backup automático** en `~/.groq/agents/`

### **Compatibilidad Total**
- **Todas las herramientas disponibles**: read_file, create_file, execute_command, etc.
- **Control de interrupciones**: ESC funciona normalmente
- **Tool approval**: Sistema de aprobación intact
- **Model switching**: Compatible con `/model`

---

## 🚨 **Diferencias Clave con Sistema Anterior**

### **Antes:**
- ❌ System prompt fijo e inmutable
- ❌ Solo un "modo" de AI disponible
- ❌ Imposible personalización sin modificar código
- ❌ Sin especialización para dominios específicos

### **Ahora:**
- ✅ **Multiple agentes** con especialidades diferentes
- ✅ **System prompts dinámicos** y personalizables  
- ✅ **Persistencia** entre sesiones
- ✅ **Import/Export** para compartir
- ✅ **Switching instantáneo** entre personalidades
- ✅ **Agentes predefinidos** listos para usar
- ✅ **Funcionalidad completa** preservada

---

## 🎉 **Resultado Final**

**¡Ahora tienes control total sobre la personalidad y especialización del AI!**

- 🤖 **5 agentes predefinidos** para casos comunes
- ⚙️ **System prompts temporales** para pruebas rápidas
- 🔄 **Creación ilimitada** de agentes personalizados
- 💾 **Persistencia automática** y gestión de archivos
- 🔗 **Import/Export** para colaboración
- 🚀 **Todas las herramientas funcionan** sin limitaciones
- 🎯 **Especialización profunda** para dominios específicos

**¡La CLI ahora puede ser exactamente lo que necesitas para cada proyecto!** 🚀
