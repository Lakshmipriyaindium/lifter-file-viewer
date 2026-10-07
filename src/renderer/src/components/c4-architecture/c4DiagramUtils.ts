export type ActivePath =
  | { level: 1 }
  | { level: 2 }
  | { level: 3; container: string }
  | { level: 4; container: string; component: string };

export interface C4Person {
  id: string;
  name: string;
  description?: string;
}

export interface C4ExternalSystem {
  id: string;
  name: string;
  description?: string;
}

export interface C4Relationship {
  source: string;
  target: string;
  description?: string;
}

export interface C4Component {
  id: string;
  name: string;
  technology?: string;
  description?: string;
  relationships?: C4Relationship[];
}

export interface C4Container {
  id: string;
  name: string;
  technology?: string;
  description?: string;
  relationships?: C4Relationship[];
  components?: C4Component[];
}

export interface C4EntityAttribute {
  id?: string;
  name: string;
  type?: string;
  is_primary_key?: boolean;
  is_unique?: boolean;
  description?: string;
}

export interface C4Entity {
  id?: string;
  name: string;
  attributes?: C4EntityAttribute[];
}

export interface C4DeploymentNode {
  id: string;
  name: string;
  technology?: string;
  description?: string;
}

export interface C4SecurityAuth {
  id: string;
  name: string;
  implementation?: string;
  description?: string;
}

export interface C4SecuritySecret {
  id: string;
  name: string;
  storage?: string;
  description?: string;
}

export interface C4SecuritySensitiveData {
  id: string;
  name: string;
  storage?: string;
  description?: string;
}

export interface C4Data {
  metadata?: {
    project_name?: string;
    description?: string;
    analyzed_at?: string;
  };
  system_context?: {
    people?: C4Person[];
    external_systems?: C4ExternalSystem[];
    relationships?: C4Relationship[];
  };
  containers?: C4Container[];
  data_view?: {
    entities?: C4Entity[];
  };
  deployment_view?: {
    nodes?: C4DeploymentNode[];
    relationships?: C4Relationship[];
  };
  deployment?: {
    nodes?: C4DeploymentNode[];
    relationships?: C4Relationship[];
  };
  security_view?: {
    authentication?: C4SecurityAuth[];
    authorization?: C4SecurityAuth[];
    secrets?: C4SecuritySecret[];
    sensitive_data?: C4SecuritySensitiveData[];
  };
}

export function normalizeC4Data(data: unknown): C4Data | null {
  if (!data) return null;
  if (Array.isArray(data)) {
    return normalizeC4Data(data[0]);
  }
  if (typeof data === 'object' && data !== null) {
    const record = data as Record<string, unknown>;
    if (record.data && typeof record.data === 'object' && !record.containers && !record.system_context) {
      return normalizeC4Data(record.data);
    }
    return record as C4Data;
  }
  return null;
}

export const generateContextDiagram = (data: C4Data | null): string => {
  if (!data) return 'graph LR\n  error["No C4 context data available"]';
  const people: C4Person[] = data.system_context?.people || [];
  const externalSystems: C4ExternalSystem[] = data.system_context?.external_systems || [];
  const relationships: C4Relationship[] = data.system_context?.relationships || [];
  const metadata = data.metadata || {};

  let mermaidCode = 'graph TB\n';
  if (people.length > 0) {
    mermaidCode += '  subgraph UserRoles ["User Roles"]\n';
    people.forEach((p: C4Person) => {
      mermaidCode += `    ${p.id}["${p.name || 'User'}<br/>(Person)<br/><br/>${p.description || ''}"]\n`;
    });
    mermaidCode += '  end\n\n';
  }

  mermaidCode += '  subgraph SystemBoundary ["System Boundary"]\n';
  mermaidCode += `    system_node["${metadata.project_name || 'System Application'}<br/>(Software System)<br/><br/>${metadata.description || ''}"]\n`;
  mermaidCode += '  end\n\n';

  if (externalSystems.length > 0) {
    mermaidCode += '  subgraph ExternalSystems ["External Systems"]\n';
    externalSystems.forEach((e: C4ExternalSystem) => {
      mermaidCode += `    ${e.id}["${e.name || 'External System'}<br/>(System)<br/><br/>${e.description || ''}"]\n`;
    });
    mermaidCode += '  end\n\n';
  }

  relationships.forEach((r: C4Relationship) => {
    mermaidCode += `  ${r.source} --> |"${r.description || 'Interacts with'}"| ${r.target}\n`;
  });

  externalSystems.forEach((e: C4ExternalSystem) => {
    mermaidCode += `  system_node ===> |"Reads/Writes data"| ${e.id}\n`;
  });

  people.forEach((p: C4Person) => {
    mermaidCode += `  ${p.id} --> |"Uses browser"| system_node\n`;
  });

  people.forEach((p: C4Person) => {
    mermaidCode += `  style ${p.id} fill:#1e293b,stroke:#475569,color:#fff,stroke-width:2px\n`;
  });
  mermaidCode += `  style system_node fill:#fb851e,stroke:#d97706,color:#fff,stroke-width:2px\n`;
  externalSystems.forEach((e: C4ExternalSystem) => {
    mermaidCode += `  style ${e.id} fill:#334155,stroke:#475569,color:#fff,stroke-width:2px\n`;
  });

  return mermaidCode;
};

export const generateContainerDiagram = (data: C4Data | null): string => {
  if (!data) return 'graph LR\n  error["No container data available"]';
  const people: C4Person[] = data.system_context?.people || [];
  const containers: C4Container[] = data.containers || [];
  const relationships: C4Relationship[] = data.system_context?.relationships || [];
  const projectName = data.metadata?.project_name || 'System Boundary';

  let mermaidCode = 'graph TB\n';

  if (people.length > 0) {
    mermaidCode += '  subgraph Users ["Users / Roles"]\n';
    people.forEach((p: C4Person) => {
      mermaidCode += `    ${p.id}["${p.name || 'User'}<br/>(Person)<br/><br/>${p.description || ''}"]\n`;
    });
    mermaidCode += '  end\n\n';
  }

  mermaidCode += `  subgraph AppBoundary ["${projectName} Boundary"]\n`;
  containers.forEach((c: C4Container) => {
    mermaidCode += `    ${c.id}["${c.name}<br/>(${c.technology || ''})<br/><br/>${c.description || ''}"]\n`;
  });
  mermaidCode += '  end\n\n';

  const frontend = containers.find((c: C4Container) => c.id?.includes('frontend') || c.name?.toLowerCase().includes('frontend'));
  if (frontend) {
    people.forEach((p: C4Person) => {
      mermaidCode += `  ${p.id} --> |"Uses (browser)"| ${frontend.id}\n`;
    });
  }

  containers.forEach((c: C4Container) => {
    if (c.relationships) {
      c.relationships.forEach((r: C4Relationship) => {
        mermaidCode += `  ${r.source} ===> |"${r.description || ''}"| ${r.target}\n`;
      });
    }
  });

  relationships.forEach((r: C4Relationship) => {
    const dbContainer = containers.find((c: C4Container) => c.id?.includes('database') || c.name?.toLowerCase().includes('database'));
    if (dbContainer) {
      mermaidCode += `  ${r.source} -.-> |"Interacts with"| ${dbContainer.id}\n`;
    }
  });

  people.forEach((p: C4Person) => {
    mermaidCode += `  style ${p.id} fill:#1e293b,stroke:#475569,color:#fff,stroke-width:2px\n`;
  });

  containers.forEach((c: C4Container) => {
    const isDb = c.id?.includes('database') || c.name?.toLowerCase().includes('database');
    const isBackend = c.id?.includes('backend') || c.name?.toLowerCase().includes('backend');
    if (isDb) {
      mermaidCode += `  style ${c.id} fill:#10b981,stroke:#059669,color:#fff,stroke-width:2px\n`;
    } else if (isBackend) {
      mermaidCode += `  style ${c.id} fill:#0ea5e9,stroke:#0284c7,color:#fff,stroke-width:2px\n`;
    } else {
      mermaidCode += `  style ${c.id} fill:#fb851e,stroke:#d97706,color:#fff,stroke-width:2px\n`;
    }
  });

  return mermaidCode;
};

export const generateComponentDiagram = (data: C4Data | null, containerId: string): string => {
  const containers: C4Container[] = data?.containers || [];
  const container = containers.find((c: C4Container) => c.id === containerId) || containers[0];
  if (!container || !container.components || container.components.length === 0) {
    return 'graph LR\n  error["No components found for container"]';
  }

  let mermaidCode = 'graph TB\n';
  mermaidCode += `  subgraph ComponentBoundary ["${container.name} Components"]\n`;

  container.components.forEach((comp: C4Component) => {
    mermaidCode += `    ${comp.id}["${comp.name}<br/>(${comp.technology || ''})<br/><br/>${comp.description || ''}"]\n`;
  });
  mermaidCode += '  end\n\n';

  container.components.forEach((comp: C4Component) => {
    if (comp.relationships) {
      comp.relationships.forEach((r: C4Relationship) => {
        const isExternal = !container.components?.some((x: C4Component) => x.id === r.target);
        if (isExternal) {
          if (!mermaidCode.includes(`  ${r.target}[`)) {
            const externalContainer = containers.find((x: C4Container) => x.id === r.target);
            const externalName = externalContainer ? externalContainer.name : r.target;
            mermaidCode += `  ${r.target}["${externalName}<br/>(Container)"]\n`;
            mermaidCode += `  style ${r.target} fill:#334155,stroke:#475569,color:#fff,stroke-width:2px\n`;
          }
        }
        mermaidCode += `  ${r.source} ===> |"${r.description || ''}"| ${r.target}\n`;
      });
    }
  });

  const isDb = containerId.includes('database') || container.name?.toLowerCase().includes('database');
  const isBackend = containerId.includes('backend') || container.name?.toLowerCase().includes('backend');
  const fill = isDb ? '#10b981' : isBackend ? '#0ea5e9' : '#fb851e';
  const stroke = isDb ? '#059669' : isBackend ? '#0284c7' : '#d97706';

  container.components.forEach((comp: C4Component) => {
    mermaidCode += `  style ${comp.id} fill:${fill},stroke:${stroke},color:#fff,stroke-width:2px\n`;
  });

  return mermaidCode;
};

export const generateDataViewDiagram = (data: C4Data | null): string => {
  let mermaidCode = 'erDiagram\n';

  if (data?.data_view && data.data_view.entities && data.data_view.entities.length > 0) {
    data.data_view.entities.forEach((ent: C4Entity) => {
      mermaidCode += `  ${ent.name} {\n`;
      (ent.attributes || []).forEach((attr: C4EntityAttribute) => {
        const pk = attr.is_primary_key ? 'PK' : '';
        const typeStr = (attr.type || 'string').replace(/[^a-zA-Z0-9_]/g, '');
        mermaidCode += `    ${typeStr} ${attr.name} ${pk}\n`;
      });
      mermaidCode += '  }\n';
    });
  } else {
    mermaidCode += '  NO_ENTITIES {\n    string status "No entities found"\n  }\n';
  }

  return mermaidCode;
};

export const generateDeploymentDiagram = (data: C4Data | null): string => {
  if (!data?.deployment_view || !data.deployment_view.nodes) return 'graph LR\n  error["No deployment view data"]';

  let mermaidCode = 'graph TB\n';
  const nodes: C4DeploymentNode[] = data.deployment_view.nodes || [];
  const relationships: C4Relationship[] = data.deployment_view.relationships || [];

  const githubWorkflow = nodes.find((n: C4DeploymentNode) => n.id?.includes('github') || n.name?.toLowerCase().includes('github'));
  const databaseNodes = nodes.filter((n: C4DeploymentNode) => n.id?.includes('database') || n.name?.toLowerCase().includes('database') || n.name?.toLowerCase().includes('sql'));
  const serverNodes = nodes.filter((n: C4DeploymentNode) => n.id?.includes('backend') || n.id?.includes('frontend') || n.name?.toLowerCase().includes('container') || n.name?.toLowerCase().includes('spa') || (!databaseNodes.includes(n) && n !== githubWorkflow));

  if (githubWorkflow) {
    mermaidCode += '  subgraph GitHub ["GitHub Cloud"]\n';
    mermaidCode += `    ${githubWorkflow.id}["${githubWorkflow.name}<br/>(${githubWorkflow.technology || ''})<br/><br/>${githubWorkflow.description || ''}"]\n`;
    mermaidCode += '  end\n\n';
  }

  mermaidCode += '  subgraph LocalProd ["Deployment Environments"]\n';
  if (serverNodes.length > 0) {
    mermaidCode += '    subgraph ServerNodes ["Application Servers"]\n';
    serverNodes.forEach((n: C4DeploymentNode) => {
      mermaidCode += `      ${n.id}["${n.name}<br/>(${n.technology || ''})<br/><br/>${n.description || ''}"]\n`;
    });
    mermaidCode += '    end\n\n';
  }

  if (databaseNodes.length > 0) {
    mermaidCode += '    subgraph DatabaseServers ["Database Systems"]\n';
    databaseNodes.forEach((n: C4DeploymentNode) => {
      mermaidCode += `      ${n.id}["${n.name}<br/>(${n.technology || ''})<br/><br/>${n.description || ''}"]\n`;
    });
    mermaidCode += '    end\n\n';
  }
  mermaidCode += '  end\n\n';

  relationships.forEach((r: C4Relationship) => {
    mermaidCode += `  ${r.source} ===> |"${r.description || ''}"| ${r.target}\n`;
  });

  if (githubWorkflow) {
    mermaidCode += `  style ${githubWorkflow.id} fill:#475569,stroke:#334155,color:#fff,stroke-width:2px\n`;
  }
  serverNodes.forEach((n: C4DeploymentNode) => {
    const isFrontend = n.id?.includes('frontend') || n.name?.toLowerCase().includes('frontend') || n.name?.toLowerCase().includes('spa');
    const fill = isFrontend ? '#fb851e' : '#0ea5e9';
    const stroke = isFrontend ? '#d97706' : '#0284c7';
    mermaidCode += `  style ${n.id} fill:${fill},stroke:${stroke},color:#fff,stroke-width:2px\n`;
  });
  databaseNodes.forEach((n: C4DeploymentNode) => {
    mermaidCode += `  style ${n.id} fill:#10b981,stroke:#059669,color:#fff,stroke-width:2px\n`;
  });

  return mermaidCode;
};

export const generateSecurityDiagram = (data: C4Data | null): string => {
  if (!data?.security_view) return 'graph LR\n  error["No security view data"]';

  let mermaidCode = 'graph TD\n';
  const authentications: C4SecurityAuth[] = data.security_view.authentication || [];
  const authorizations: C4SecurityAuth[] = data.security_view.authorization || [];
  const secrets: C4SecuritySecret[] = data.security_view.secrets || [];
  const sensitiveData: C4SecuritySensitiveData[] = data.security_view.sensitive_data || [];

  mermaidCode += '  subgraph Access ["Client Access"]\n';
  mermaidCode += '    client["Guest / Authenticated Clients"]\n';
  mermaidCode += '  end\n\n';

  if (authentications.length > 0 || authorizations.length > 0) {
    mermaidCode += '  subgraph SecurityFilters ["Security Layer"]\n';
    authentications.forEach((auth: C4SecurityAuth) => {
      mermaidCode += `    ${auth.id}["${auth.name}<br/>(${auth.implementation || ''})<br/><br/>${auth.description || ''}"]\n`;
    });
    authorizations.forEach((authz: C4SecurityAuth) => {
      mermaidCode += `    ${authz.id}["${authz.name}<br/>(${authz.implementation || ''})<br/><br/>${authz.description || ''}"]\n`;
    });
    mermaidCode += '  end\n\n';
  }

  if (secrets.length > 0 || sensitiveData.length > 0) {
    mermaidCode += '  subgraph VulnSecrets ["Vulnerability & Sensitive Data"]\n';
    secrets.forEach((s: C4SecuritySecret) => {
      mermaidCode += `    ${s.id}["${s.name}<br/>(${s.storage || ''})<br/><br/>${s.description || ''}"]\n`;
    });
    sensitiveData.forEach((sd: C4SecuritySensitiveData) => {
      mermaidCode += `    ${sd.id}["${sd.name}<br/>(${sd.storage || ''})<br/><br/>${sd.description || ''}"]\n`;
    });
    mermaidCode += '  end\n\n';
  }

  authentications.forEach((auth: C4SecurityAuth) => {
    mermaidCode += `  client ===> ${auth.id}\n`;
  });
  authentications.forEach((auth: C4SecurityAuth) => {
    authorizations.forEach((authz: C4SecurityAuth) => {
      mermaidCode += `  ${auth.id} ===> ${authz.id}\n`;
    });
  });
  authorizations.forEach((authz: C4SecurityAuth) => {
    sensitiveData.forEach((sd: C4SecuritySensitiveData) => {
      mermaidCode += `  ${authz.id} ===> |"Authorizes access"| ${sd.id}\n`;
    });
  });

  secrets.forEach((s: C4SecuritySecret) => {
    mermaidCode += `  style ${s.id} fill:#ef4444,stroke:#dc2626,color:#fff,stroke-width:2px\n`;
  });
  mermaidCode += '  style client fill:#1e293b,stroke:#475569,color:#fff,stroke-width:2px\n';
  authentications.forEach((auth: C4SecurityAuth) => {
    mermaidCode += `  style ${auth.id} fill:#fb851e,stroke:#d97706,color:#fff,stroke-width:2px\n`;
  });
  authorizations.forEach((authz: C4SecurityAuth) => {
    mermaidCode += `  style ${authz.id} fill:#fb851e,stroke:#d97706,color:#fff,stroke-width:2px\n`;
  });
  sensitiveData.forEach((sd: C4SecuritySensitiveData) => {
    mermaidCode += `  style ${sd.id} fill:#475569,stroke:#334155,color:#fff,stroke-width:2px\n`;
  });

  return mermaidCode;
};
