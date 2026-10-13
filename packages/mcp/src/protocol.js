// NoraIvoire — Protocole MCP (JSON-RPC 2.0) sans dépendance, indépendant du transport.
// © 2026 Jonathan KABLAN — Propriétaire, tous droits réservés.

import { ToolError } from './tools.js';

/**
 * Versions « modernes » (sans état : version et capacités dans le `_meta` de chaque requête,
 * `server/discover` obligatoire). Voir https://modelcontextprotocol.io/specification/2026-07-28.
 */
export const MODERN_VERSIONS = Object.freeze(['2026-07-28']);
/** Versions « historiques » à poignée de main `initialize`, la plus récente en premier. */
export const PROTOCOL_VERSIONS = Object.freeze(['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05']);

const META_VERSION = 'io.modelcontextprotocol/protocolVersion';
const META_CAPS = 'io.modelcontextprotocol/clientCapabilities';
const META_SERVER = 'io.modelcontextprotocol/serverInfo';

export const ERRORS = Object.freeze({
  parse: -32700,
  invalidRequest: -32600,
  methodNotFound: -32601,
  invalidParams: -32602,
  internal: -32603,
  unsupportedVersion: -32022,
});

const SERVER_INFO = Object.freeze({ name: 'noraivoire', title: 'NoraIvoire', version: '0.1.0' });
const INSTRUCTIONS = 'Serveur NoraIvoire en lecture seule. Avant de générer de l\'interface, consulter nora_get_component et nora_list_tokens ; '
  + 'partir d\'une recette (nora_recipe) quand l\'écran est courant ; valider chaque balisage produit avec nora_validate et corriger toutes les erreurs.';

const error = (id, code, message, data) => ({ jsonrpc: '2.0', id, error: data === undefined ? { code, message } : { code, message, data } });
const result = (id, value) => ({ jsonrpc: '2.0', id, result: value });
const validId = (id) => typeof id === 'string' || (typeof id === 'number' && Number.isFinite(id));

/**
 * Crée le gestionnaire de messages.
 * @param {ReturnType<import('./tools.js').createTools>} tools
 * @param {{ log?: (msg: string) => void }} [options]
 */
export function createProtocol(tools, { log = () => {} } = {}) {
  const state = { initialized: false, protocolVersion: null };

  const methods = {
    initialize(params) {
      const asked = params?.protocolVersion;
      const version = PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0];
      state.protocolVersion = version;
      return {
        protocolVersion: version,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      };
    },
    ping: () => ({}),
    'tools/list': () => ({ tools: tools.definitions }),
    'tools/call'(params) {
      const name = params?.name;
      if (typeof name !== 'string' || !tools.has(name)) {
        throw Object.assign(new Error(`outil inconnu : ${typeof name === 'string' ? name.slice(0, 64) : String(name)}`), { code: ERRORS.invalidParams });
      }
      try {
        const value = tools.call(name, params.arguments);
        return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }], structuredContent: value, isError: false };
      } catch (err) {
        if (err instanceof ToolError) return { content: [{ type: 'text', text: err.message }], isError: true };
        log(`outil ${name} : ${err?.stack ?? err}`);
        return { content: [{ type: 'text', text: 'erreur interne de l\'outil' }], isError: true };
      }
    },
  };

  /** Méthodes servies aux requêtes modernes (le reste, dont `initialize`, est inconnu dans cette ère). */
  const modern = {
    'server/discover': () => ({
      supportedVersions: [...MODERN_VERSIONS],
      capabilities: { tools: { listChanged: false } },
      instructions: INSTRUCTIONS,
    }),
    ping: methods.ping,
    'tools/list': methods['tools/list'],
    'tools/call': methods['tools/call'],
  };

  /** Requête moderne : version et capacités vérifiées à chaque appel, aucun état de connexion. */
  function handleModern(msg) {
    const meta = msg.params._meta;
    const asked = meta[META_VERSION];
    if (!MODERN_VERSIONS.includes(asked)) {
      return error(msg.id, ERRORS.unsupportedVersion, 'Unsupported protocol version', {
        supported: [...MODERN_VERSIONS, ...PROTOCOL_VERSIONS],
        requested: typeof asked === 'string' ? asked.slice(0, 64) : asked ?? null,
      });
    }
    const caps = meta[META_CAPS];
    if (caps === null || typeof caps !== 'object' || Array.isArray(caps)) {
      return error(msg.id, ERRORS.invalidParams, `_meta « ${META_CAPS} » obligatoire`);
    }
    if (!Object.hasOwn(modern, msg.method)) return error(msg.id, ERRORS.methodNotFound, `méthode inconnue : ${msg.method.slice(0, 64)}`);
    try {
      const value = modern[msg.method](msg.params);
      return result(msg.id, { resultType: 'complete', ...value, _meta: { [META_SERVER]: SERVER_INFO } });
    } catch (err) {
      if (err?.code) return error(msg.id, err.code, err.message);
      log(`${msg.method} : ${err?.stack ?? err}`);
      return error(msg.id, ERRORS.internal, 'erreur interne');
    }
  }

  const notifications = {
    'notifications/initialized': () => { state.initialized = true; },
    'notifications/cancelled': () => {}, // les appels sont synchrones : rien à annuler
  };

  /**
   * Traite un message déjà décodé. Renvoie la réponse, ou null pour une notification.
   * @param {unknown} msg
   */
  function handle(msg) {
    if (Array.isArray(msg)) return error(null, ERRORS.invalidRequest, 'les lots JSON-RPC ne sont pas pris en charge');
    if (msg === null || typeof msg !== 'object' || msg.jsonrpc !== '2.0') return error(null, ERRORS.invalidRequest, 'requête JSON-RPC 2.0 invalide');
    const isNotification = !Object.hasOwn(msg, 'id');
    if (typeof msg.method !== 'string') {
      // Réponse d'un client (aucune requête serveur → client) : ignorée.
      if (!isNotification && (Object.hasOwn(msg, 'result') || Object.hasOwn(msg, 'error'))) return null;
      return error(validId(msg.id) ? msg.id : null, ERRORS.invalidRequest, 'champ « method » manquant');
    }
    if (isNotification) {
      if (Object.hasOwn(notifications, msg.method)) notifications[msg.method](msg.params);
      return null;
    }
    if (!validId(msg.id)) return error(null, ERRORS.invalidRequest, 'identifiant de requête invalide');
    if (msg.params !== undefined && (msg.params === null || typeof msg.params !== 'object' || Array.isArray(msg.params))) {
      return error(msg.id, ERRORS.invalidParams, '« params » doit être un objet');
    }
    const meta = msg.params?._meta;
    if (meta !== null && typeof meta === 'object' && Object.hasOwn(meta, META_VERSION)) return handleModern(msg);
    if (msg.method === 'server/discover') {
      // Sonde d'un client dual-era sans _meta valide : requête moderne mal formée.
      return error(msg.id, ERRORS.invalidParams, `_meta « ${META_VERSION} » obligatoire`);
    }
    if (!Object.hasOwn(methods, msg.method)) return error(msg.id, ERRORS.methodNotFound, `méthode inconnue : ${msg.method.slice(0, 64)}`);
    try {
      return result(msg.id, methods[msg.method](msg.params));
    } catch (err) {
      if (err?.code) return error(msg.id, err.code, err.message);
      log(`${msg.method} : ${err?.stack ?? err}`);
      return error(msg.id, ERRORS.internal, 'erreur interne');
    }
  }

  return { handle, state };
}
