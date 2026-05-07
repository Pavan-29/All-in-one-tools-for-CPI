import { Message, JsonSlurper, JsonOutput, XmlSlurper, XmlBuilderHelper, type CpiMessageState } from './cpiMessage';
import { transpileGroovy } from './groovyTranspile';

export interface RunOptions {
  language: 'groovy' | 'javascript';
  script: string;
  fnName: string;
  initial: CpiMessageState;
  timeoutMs?: number;
}

export interface RunResult {
  ok: boolean;
  state: CpiMessageState;
  console: Array<{ level: 'log' | 'warn' | 'error' | 'info'; text: string }>;
  error?: string;
}

export function runScript({
  language,
  script,
  fnName,
  initial,
  timeoutMs = 4000,
}: RunOptions): RunResult {
  const consoleLog: RunResult['console'] = [];
  const sandboxConsole = {
    log: (...args: any[]) =>
      consoleLog.push({ level: 'log', text: args.map(stringify).join(' ') }),
    warn: (...args: any[]) =>
      consoleLog.push({ level: 'warn', text: args.map(stringify).join(' ') }),
    error: (...args: any[]) =>
      consoleLog.push({ level: 'error', text: args.map(stringify).join(' ') }),
    info: (...args: any[]) =>
      consoleLog.push({ level: 'info', text: args.map(stringify).join(' ') }),
  };

  // Build the message
  const message = new Message(initial);

  // A "println" that mirrors Groovy's behavior — and a basic logger like
  // `messageLog` from CPI (com.sap.it.api.mapping.MessageLog).
  const messageLog = {
    setStringProperty: (name: string, value: any) => {
      message.addLogProperty(name, String(value));
    },
    addCustomHeaderProperty: (name: string, value: any) => {
      message.setCustomHeaderProperty(name, String(value));
    },
    addAttachmentAsString: (name: string, value: string, type = 'text/plain') => {
      message.addAttachmentAsString(name, value, type);
    },
  };
  const getMessageLog = (_msg?: any) => messageLog;

  // Transpile if Groovy
  const compiled = language === 'groovy' ? transpileGroovy(script) : script;

  // Wrap so we can call the user-defined function with the message and
  // capture any thrown errors with a clean stack.
  const wrapper = `
    'use strict';
    ${compiled}
    if (typeof ${fnName} !== 'function') {
      throw new Error("Function '${fnName}' is not defined. Define it like 'def Message ${fnName}(Message message)' or 'function ${fnName}(message)'.");
    }
    var __out = ${fnName}(__message);
    return __out instanceof __MessageClass ? __out : __message;
  `;

  // Build the runnable. We use the Function constructor to give us a clean
  // global scope; we still inject CPI helpers as parameters.
  const factory = new Function(
    '__message',
    '__MessageClass',
    'console',
    'JsonSlurper',
    'JsonOutput',
    'XmlSlurper',
    'XmlBuilder',
    'messageLog',
    'getMessageLog',
    wrapper
  );

  // Browser cooperative timeout: we can't truly interrupt sync JS without
  // workers; for now we trust scripts to complete quickly.
  let result: Message;
  try {
    const start = performance.now();
    result = factory(
      message,
      Message,
      sandboxConsole,
      JsonSlurper,
      JsonOutput,
      XmlSlurper,
      XmlBuilderHelper,
      messageLog,
      getMessageLog
    );
    const elapsed = performance.now() - start;
    if (elapsed > timeoutMs) {
      consoleLog.push({
        level: 'warn',
        text: `Script ran for ${Math.round(elapsed)}ms (over the ${timeoutMs}ms soft limit).`,
      });
    }
  } catch (e) {
    return {
      ok: false,
      state: message.state,
      console: consoleLog,
      error: (e as Error).message,
    };
  }

  return {
    ok: true,
    state: result.state,
    console: consoleLog,
  };
}

function stringify(v: any): string {
  if (v == null) return String(v);
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
