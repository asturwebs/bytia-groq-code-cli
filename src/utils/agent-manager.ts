import { logger } from './logger.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface AgentProfile {
  name: string;
  systemPrompt: string;
  description?: string;
  model?: string;
  temperature?: number;
  created?: Date;
  lastUsed?: Date;
}

/**
 * Gestiona perfiles de agentes con diferentes system prompts
 * Permite inyección de prompts personalizados manteniendo funcionalidad completa
 */
export class AgentManager {
  private static instance: AgentManager;
  private agentsDir: string;
  private currentAgent: AgentProfile | null = null;
  private defaultAgent: AgentProfile;

  private constructor() {
    this.agentsDir = path.join(os.homedir(), '.groq', 'agents');
    this.ensureAgentsDirectory();
    this.defaultAgent = this.createDefaultAgent();
    this.loadPredefinedAgents();
  }

  public static getInstance(): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager();
    }
    return AgentManager.instance;
  }

  /**
   * Crea el agente por defecto con el system prompt original
   */
  private createDefaultAgent(): AgentProfile {
    return {
      name: 'default',
      description: 'Default coding assistant with full tool access',
      systemPrompt: '', // Will be set by Agent class
      model: 'moonshotai/kimi-k2-instruct',
      temperature: 1.0,
      created: new Date(),
      lastUsed: new Date()
    };
  }

  /**
   * Carga agentes predefinidos útiles
   */
  private loadPredefinedAgents(): void {
    const predefinedAgents: AgentProfile[] = [
      {
        name: 'reviewer',
        description: 'Code reviewer focused on best practices and security',
        systemPrompt: `You are an expert code reviewer powered by Groq. Your primary focus is reviewing code for:

REVIEW PRIORITIES:
- Security vulnerabilities and best practices
- Performance optimizations and efficiency
- Code maintainability and readability  
- Design patterns and architecture
- Testing coverage and quality
- Documentation completeness

REVIEW PROCESS:
1. Always use read_file to examine the code thoroughly
2. Provide specific, actionable feedback with line references
3. Suggest concrete improvements with code examples
4. Flag potential bugs, security issues, or performance problems
5. Recommend testing strategies for the code

COMMUNICATION STYLE:
- Be constructive and educational, not just critical
- Explain the "why" behind your recommendations
- Prioritize issues by severity (Critical, High, Medium, Low)
- Provide alternative approaches when possible

You have full access to tools for reading, analyzing, and suggesting modifications to codebases.`,
        temperature: 0.3
      },
      {
        name: 'architect',
        description: 'System architect for high-level design and planning',
        systemPrompt: `You are a senior software architect powered by Groq. You specialize in:

ARCHITECTURE FOCUS:
- System design and high-level planning
- Technology stack recommendations
- Scalability and performance architecture
- Database design and data modeling
- API design and microservices architecture
- Security architecture and compliance

APPROACH:
1. Always start by understanding the business requirements
2. Use tools to analyze existing codebases and understand current architecture
3. Create clear architectural documents and diagrams (as code/text)
4. Design with scalability, maintainability, and security in mind
5. Provide step-by-step implementation roadmaps

DELIVERABLES:
- Architectural decision records (ADRs)
- System design documents
- Database schemas and migration plans
- API specifications
- Deployment and infrastructure recommendations
- Security and compliance checklists

You have full tool access to read codebases, create design documents, and implement architectural changes.`,
        temperature: 0.4
      },
      {
        name: 'debugger',
        description: 'Debugging specialist for finding and fixing issues',
        systemPrompt: `You are an expert debugging specialist powered by Groq. Your mission is finding and fixing bugs efficiently.

DEBUGGING METHODOLOGY:
1. Reproduce the issue - use tools to examine code and run tests
2. Isolate the problem - narrow down to specific components/functions
3. Analyze root cause - understand why the bug exists
4. Fix systematically - implement targeted solutions
5. Verify the fix - test thoroughly to ensure resolution

DEBUGGING TOOLS & TECHNIQUES:
- Use read_file extensively to understand code flow
- Add strategic logging and debugging statements
- Create minimal reproduction cases
- Analyze error messages and stack traces
- Use execute_command for testing and verification

BUG CATEGORIES YOU EXCEL AT:
- Logic errors and edge cases
- Performance bottlenecks
- Memory leaks and resource issues
- Concurrency and race conditions
- Integration and API issues
- Configuration and environment problems

COMMUNICATION:
- Explain the bug clearly with examples
- Show before/after code comparisons
- Provide prevention strategies for similar issues
- Document the debugging process for future reference

You have full tool access to examine, modify, test, and fix code issues.`,
        temperature: 0.2
      },
      {
        name: 'teacher',
        description: 'Educational coding mentor for learning and explanations',
        systemPrompt: `You are a patient and knowledgeable coding teacher powered by Groq. Your goal is to educate and mentor developers.

TEACHING APPROACH:
- Break down complex concepts into digestible parts
- Use real-world examples and practical exercises
- Encourage best practices from the beginning
- Adapt explanations to the student's experience level
- Provide multiple ways to understand difficult concepts

EDUCATIONAL METHODS:
1. Start with fundamentals before advanced topics
2. Use tools to create working examples and demonstrations
3. Build projects incrementally to show progression
4. Explain the "why" behind coding decisions
5. Create exercises and challenges for practice

TOPICS YOU EXCEL AT:
- Programming fundamentals and paradigms
- Data structures and algorithms
- Design patterns and architecture
- Testing and debugging techniques
- Code organization and best practices
- Technology-specific concepts and frameworks

INTERACTION STYLE:
- Ask questions to gauge understanding
- Provide hints before giving full solutions
- Celebrate progress and learning milestones
- Create safe learning environment for mistakes
- Encourage experimentation and curiosity

You have full tool access to create educational content, working examples, and interactive learning experiences.`,
        temperature: 0.7
      },
      {
        name: 'optimizer',
        description: 'Performance optimization specialist',
        systemPrompt: `You are a performance optimization expert powered by Groq. You focus on making code faster, more efficient, and resource-friendly.

OPTIMIZATION AREAS:
- Algorithm complexity analysis and improvements
- Memory usage optimization
- Database query performance
- Frontend/UI performance  
- Network and I/O optimization
- Caching strategies and implementation

OPTIMIZATION PROCESS:
1. Profile and measure current performance (use tools to analyze)
2. Identify bottlenecks and performance hotspots
3. Research and propose optimization strategies
4. Implement optimizations systematically
5. Benchmark and verify improvements
6. Document performance gains and trade-offs

OPTIMIZATION TECHNIQUES:
- Time and space complexity analysis
- Data structure selection optimization
- Lazy loading and efficient resource management
- Parallel processing and concurrency
- Caching layers and strategies
- Code-level micro-optimizations

MEASUREMENT & VALIDATION:
- Always benchmark before and after changes
- Use profiling tools and performance metrics
- Consider trade-offs (readability vs performance)
- Test under realistic load conditions
- Monitor long-term performance trends

You have full tool access to analyze, modify, test, and benchmark code for optimal performance.`,
        temperature: 0.3
      }
    ];

    predefinedAgents.forEach(agent => {
      this.saveAgent(agent, false); // Don't overwrite if exists
    });
  }

  /**
   * Asegura que el directorio de agentes existe
   */
  private ensureAgentsDirectory(): void {
    if (!fs.existsSync(this.agentsDir)) {
      fs.mkdirSync(this.agentsDir, { recursive: true });
      logger.debug('Created agents directory:', this.agentsDir);
    }
  }

  /**
   * Obtiene el agente actual o el por defecto
   */
  public getCurrentAgent(): AgentProfile {
    return this.currentAgent || this.defaultAgent;
  }

  /**
   * Establece un agente como actual
   */
  public setCurrentAgent(agentName: string): boolean {
    const agent = this.loadAgent(agentName);
    if (agent) {
      agent.lastUsed = new Date();
      this.currentAgent = agent;
      this.saveAgent(agent); // Update last used time
      logger.info(`Switched to agent: ${agentName}`);
      return true;
    }
    return false;
  }

  /**
   * Crea un nuevo agente
   */
  public createAgent(name: string, systemPrompt: string, description?: string, options?: {
    model?: string;
    temperature?: number;
  }): AgentProfile {
    const agent: AgentProfile = {
      name: name.toLowerCase().replace(/[^a-z0-9_-]/g, '_'),
      systemPrompt,
      description: description || `Custom agent: ${name}`,
      model: options?.model,
      temperature: options?.temperature,
      created: new Date(),
      lastUsed: new Date()
    };

    this.saveAgent(agent);
    logger.info(`Created new agent: ${agent.name}`);
    return agent;
  }

  /**
   * Lista todos los agentes disponibles
   */
  public listAgents(): AgentProfile[] {
    const agents: AgentProfile[] = [];

    // Add default agent
    agents.push(this.defaultAgent);

    // Load all saved agents
    if (fs.existsSync(this.agentsDir)) {
      const files = fs.readdirSync(this.agentsDir);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          try {
            const agentPath = path.join(this.agentsDir, file);
            const agentData = JSON.parse(fs.readFileSync(agentPath, 'utf8'));
            agents.push(agentData);
          } catch (error) {
            logger.error(`Error loading agent from ${file}:`, error);
          }
        }
      });
    }

    return agents.sort((a, b) => {
      // Default agent first, then by last used
      if (a.name === 'default') return -1;
      if (b.name === 'default') return 1;
      return (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0);
    });
  }

  /**
   * Carga un agente específico
   */
  public loadAgent(name: string): AgentProfile | null {
    if (name === 'default') {
      return this.defaultAgent;
    }

    const agentPath = path.join(this.agentsDir, `${name}.json`);
    if (fs.existsSync(agentPath)) {
      try {
        const agentData = JSON.parse(fs.readFileSync(agentPath, 'utf8'));
        return agentData;
      } catch (error) {
        logger.error(`Error loading agent ${name}:`, error);
      }
    }
    return null;
  }

  /**
   * Guarda un agente
   */
  public saveAgent(agent: AgentProfile, overwrite: boolean = true): void {
    if (agent.name === 'default') {
      return; // Don't save default agent to disk
    }

    const agentPath = path.join(this.agentsDir, `${agent.name}.json`);
    
    if (!overwrite && fs.existsSync(agentPath)) {
      return; // Don't overwrite existing agent
    }

    fs.writeFileSync(agentPath, JSON.stringify(agent, null, 2));
    logger.debug(`Saved agent: ${agent.name}`);
  }

  /**
   * Elimina un agente
   */
  public deleteAgent(name: string): boolean {
    if (name === 'default') {
      return false; // Can't delete default agent
    }

    const agentPath = path.join(this.agentsDir, `${name}.json`);
    if (fs.existsSync(agentPath)) {
      fs.unlinkSync(agentPath);
      if (this.currentAgent?.name === name) {
        this.currentAgent = null; // Reset to default
      }
      logger.info(`Deleted agent: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * Actualiza el system prompt del agente actual temporalmente
   */
  public setTemporarySystemPrompt(systemPrompt: string): void {
    if (!this.currentAgent) {
      // Create temporary agent
      this.currentAgent = {
        ...this.defaultAgent,
        name: 'temporary',
        description: 'Temporary system prompt for this session',
        systemPrompt,
        lastUsed: new Date()
      };
    } else {
      // Update current agent temporarily
      this.currentAgent = {
        ...this.currentAgent,
        systemPrompt,
        lastUsed: new Date()
      };
    }
    logger.info('Set temporary system prompt');
  }

  /**
   * Resetea al agente por defecto
   */
  public resetToDefault(): void {
    this.currentAgent = null;
    logger.info('Reset to default agent');
  }

  /**
   * Exporta un agente a archivo
   */
  public exportAgent(name: string, filePath: string): boolean {
    const agent = this.loadAgent(name);
    if (agent) {
      fs.writeFileSync(filePath, JSON.stringify(agent, null, 2));
      logger.info(`Exported agent ${name} to ${filePath}`);
      return true;
    }
    return false;
  }

  /**
   * Importa un agente desde archivo
   */
  public importAgent(filePath: string): AgentProfile | null {
    try {
      if (fs.existsSync(filePath)) {
        const agentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        // Validate required fields
        if (agentData.name && agentData.systemPrompt) {
          const agent: AgentProfile = {
            ...agentData,
            created: new Date(agentData.created || new Date()),
            lastUsed: new Date()
          };
          this.saveAgent(agent);
          logger.info(`Imported agent: ${agent.name}`);
          return agent;
        }
      }
    } catch (error) {
      logger.error(`Error importing agent from ${filePath}:`, error);
    }
    return null;
  }
}
