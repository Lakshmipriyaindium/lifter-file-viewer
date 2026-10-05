'use client';

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  getOperationColor,
  FocusedFeatureAnalysisData,
  ProgramAnalysis,
  FieldUsageSummary,
  ProgramReference,
  FocusedFieldUsageSummary,
  FileOperation
} from './type';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract text from context field - handles both old string format and new object format
 */
type ContextType = FileOperation['context'];
const getContextText = (context: ContextType): string => {
  if (!context) return '';
  
  // If it's already a string, return it
  if (typeof context === 'string') return context;
  
  // If it's an object with the new format, extract the most relevant text
  if (typeof context === 'object') {
    // Prefer business_logic_summary as it contains the most comprehensive info
    if (context.business_logic_summary) return context.business_logic_summary;
    
    // Otherwise concatenate available fields
    const parts: string[] = [];
    if (context.condition_context) parts.push(context.condition_context);
    if (context.control_flow) parts.push(context.control_flow);
    if (context.loop_context) parts.push(context.loop_context);
    
    return parts.join(' ');
  }
  
  return String(context);
};

/**
 * Get comprehensive field context including business reason and value
 */
// const getFieldContextText = (field: any): string => {
//   const parts: string[] = [];
  
//   // Add business reason if available
//   if (field.business_reason) {
//     parts.push(`Business Reason: ${field.business_reason}`);
//   }
  
//   // Add business value if available
//   if (field.business_value) {
//     parts.push(`Business Value: ${field.business_value}`);
//   }
  
//   // Add context
//   const contextText = getContextText(field.context);
//   if (contextText) {
//     parts.push(contextText);
//   }
  
//   return parts.join(' | ');
// };

// ============================================================================
// Sub-components
// ============================================================================

interface OperationBadgeProps {
  operation: string;
  count?: number;
  size?: 'sm' | 'md';
}

const OperationBadge: React.FC<OperationBadgeProps> = ({ 
  operation, 
  count, 
  size = 'md' 
}) => {
  const color = getOperationColor(operation);
  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5' 
    : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-semibold rounded-full ${sizeClasses}`}
      style={{ 
        backgroundColor: `${color}15`, 
        color: color,
        border: `1px solid ${color}40`
      }}
    >
      {operation}
      {count !== undefined && (
        <span 
          className="font-bold rounded-full px-1.5 text-xs"
          style={{ backgroundColor: color, color: '#fff' }}
        >
          {count}
        </span>
      )}
    </span>
  );
};

interface ProgramCardProps {
  program: ProgramAnalysis;
  focusedFile: string;
  isExpanded: boolean;
  onToggle: () => void;
}

interface ProgramCardPropsExtended extends ProgramCardProps {
  selectedOperations?: Set<string>;
  selectedFields?: Set<string>;
  aliasFilter?: 'all' | 'alias-only' | 'non-alias';
  hideComments?: boolean;
}

const ProgramCard: React.FC<ProgramCardPropsExtended> = ({ 
  program, 
  focusedFile, 
  isExpanded, 
  onToggle,
  selectedOperations = new Set(),
  selectedFields = new Set(),
  aliasFilter = 'all',
  // hideComments = true,
}) => {
  //unused hidecommands
  const [expandedFunctions, setExpandedFunctions] = useState<Set<number>>(new Set());
  const [programTab, setProgramTab] = useState<'operations' | 'fields' | 'summary'>('summary');
  
  // Support both 'file_analyses' (legacy) and 'analyses' (new structure)
  const fileAnalyses = program.analyses || program.file_analyses || [];
  const fileAnalysis = fileAnalyses.find(f => f.file_name === focusedFile);
  
  if (!fileAnalysis) return null;

  // Filter operations based on selected operations and hideComments
  let filteredOperations = fileAnalysis.file_operations;
  if (selectedOperations.size > 0) {
    filteredOperations = filteredOperations.filter(op => selectedOperations.has(op.operation));
  }
  // Note: Operations don't have is_comment, but we keep this for future use

  // Filter fields based on selected fields and alias filter
  let filteredFields = fileAnalysis.fields_accessed;
  if (selectedFields.size > 0) {
    filteredFields = filteredFields.filter(field => selectedFields.has(field.field_number));
  }
  if (aliasFilter === 'alias-only') {
    filteredFields = filteredFields.filter(field => field.is_alias === true);
  } else if (aliasFilter === 'non-alias') {
    filteredFields = filteredFields.filter(field => field.is_alias !== true);
  }
  
  // Get field summaries if available
  const fieldSummaries = fileAnalysis.field_summary?.field_summaries || [];
  const filteredFieldSummaries = selectedFields.size > 0
    ? fieldSummaries.filter(fs => selectedFields.has(fs.field_number))
    : fieldSummaries;

  const operationCounts = filteredOperations.reduce((acc, op) => {
    acc[op.operation] = (acc[op.operation] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const toggleFunction = (index: number) => {
    setExpandedFunctions(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="program-card group">
      <div 
        className="program-card-header"
        onClick={onToggle}
      >
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="program-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <line x1="10" y1="9" x2="8" y2="9"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="program-name">{program.source_file_name}</h3>
            {/* {fileAnalysis.description && (
              <p className="program-description">{fileAnalysis.description}</p>
            )} */}
            {program.node_title && <p className="program-title">{program.node_title}</p>}
            {program.node_summary && <p className="program-summary">{program.node_summary}</p>}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap gap-1.5 justify-end items-center">
            {/* Business Functions Indicator */}
            {fileAnalysis.business_functions && fileAnalysis.business_functions.length > 0 && (
              <span className="business-functions-indicator" title={`${fileAnalysis.business_functions.length} business function${fileAnalysis.business_functions.length !== 1 ? 's' : ''}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="9" y1="21" x2="9" y2="9"/>
                </svg>
                {fileAnalysis.business_functions.length}
              </span>
            )}
            {Object.entries(operationCounts).map(([op, count]) => (
              <OperationBadge key={op} operation={op} count={count} size="sm" />
            ))}
          </div>
          <div className="program-meta">
            {program.node_line_start && program.node_line_end && (
              <>
            <span>Lines {program.node_line_start}-{program.node_line_end}</span>
            <span className="meta-separator">•</span>
              </>
            )}
            <span>{filteredFields.length} fields</span>
          </div>
        </div>
        
        <div className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6,9 12,15 18,9"/>
          </svg>
        </div>
      </div>
      
      {isExpanded && (
        <div className="program-card-content p-2">
          {/* Program Summary */}
          {fileAnalysis.program_summary && (
            <div className="content-section program-summary-section mt-2">
              <h4 className="section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                Program Summary
              </h4>
              <p className="program-summary-text">{fileAnalysis.program_summary}</p>
            </div>
          )}
          
          {/* Program Tabs */}
          <div className="program-tabs-container">
            <div className="program-tabs-header">
              <button
                className={`program-tab-button ${programTab === 'summary' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setProgramTab('summary');
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7V4h16v3"/>
                  <path d="M9 20h6"/>
                  <path d="M12 4v16"/>
                </svg>
                Field Summary
                {filteredFieldSummaries.length > 0 && (
                  <span className="program-tab-count">{filteredFieldSummaries.length}</span>
                )}
              </button>
              <button
                className={`program-tab-button ${programTab === 'fields' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setProgramTab('fields');
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="3" y1="15" x2="21" y2="15"/>
                  <line x1="9" y1="3" x2="9" y2="21"/>
                  <line x1="15" y1="3" x2="15" y2="21"/>
                </svg>
                Field Details
                <span className="program-tab-count">{filteredFields.length}</span>
              </button>
              <button
                className={`program-tab-button ${programTab === 'operations' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setProgramTab('operations');
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
                File Operations
                <span className="program-tab-count">{filteredOperations.length}</span>
              </button>
            </div>
            
            <div className="program-tabs-content">
              {/* Field Summary Tab */}
              {programTab === 'summary' && filteredFieldSummaries.length > 0 && (
                <div className="field-summaries-grid">
                  {filteredFieldSummaries.map((fieldSum) => (
                    <div key={fieldSum.field_number} className="field-summary-card">
                      <div className="field-summary-header">
                        <span className="field-summary-num">#{fieldSum.field_number}</span>
                        <span className="field-summary-name">{fieldSum.field_name}</span>
                        <span className="field-summary-accesses">{fieldSum.total_accesses} access{fieldSum.total_accesses !== 1 ? 'es' : ''}</span>
                      </div>
                      <div className="field-summary-label">{fieldSum.business_label}</div>
                      <p className="field-summary-desc">{fieldSum.field_description}</p>
                      {fieldSum.program_meaning && (
                        <div className="field-summary-meaning">
                          <span className="field-summary-meaning-label">Field Summary:</span>
                          <p className="field-summary-meaning-text">{fieldSum.program_meaning}</p>
                        </div>
                      )}
                      {fieldSum.business_rules && fieldSum.business_rules.length > 0 && (
                        <div className="field-summary-rules">
                          <span className="field-summary-rules-label">Business Rules ({fieldSum.business_rules.length}):</span>
                          <ul className="field-summary-rules-list">
                            {fieldSum.business_rules.map((rule, idx) => (
                              <li key={idx}>{rule}</li>
                            ))}
                            {/* {fieldSum.business_rules.length > 3 && (
                              <li className="field-summary-more">+{fieldSum.business_rules.length - 3} more rules...</li>
                            )} */}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              
              {/* File Operations Tab */}
              {programTab === 'operations' && (
                <>
                  {/* Business Functions Section - Accordion View */}
                  {fileAnalysis.business_functions && fileAnalysis.business_functions.length > 0 && (
            <div className="content-section business-functions-section">
              <h4 className="section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="9" y1="21" x2="9" y2="9"/>
                </svg>
                Business Functions ({fileAnalysis.business_functions.length})
              </h4>
              <div className="business-functions-list">
                {fileAnalysis.business_functions.map((func, funcIdx) => {
                  const isFunctionExpanded = expandedFunctions.has(funcIdx);
                  return (
                    <div key={funcIdx} className="business-function-card">
                      <div 
                        className="business-function-header business-function-accordion-header"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFunction(funcIdx);
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`function-expand-icon ${isFunctionExpanded ? 'expanded' : ''}`}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="6,9 12,15 18,9"/>
                            </svg>
                          </div>
                          <h5 className="business-function-name">{func.function_name}</h5>
                          <span className="business-function-badge">{func.co_operations.length} operation{func.co_operations.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      
                      {isFunctionExpanded && (
                        <div className="business-function-content">
                          <p className="business-function-description">{func.business_description}</p>
                          
                          {/* CO Operations within this business function */}
                          {func.co_operations.length > 0 && (
                            <div className="co-operations-list">
                              <h6 className="co-operations-title">File Operations:</h6>
                              {func.co_operations.map((coOp, opIdx) => (
                                <div key={opIdx} className="co-operation-item">
                                  <div className="co-operation-header">
                                    <OperationBadge operation={coOp.operation} size="sm" />
                                  </div>
                                  <div className="co-operation-details">
                                    <p className="co-operation-reason">
                                      <span className="detail-label">Business Reason:</span> {coOp.business_reason}
                                    </p>
                                    <p className="co-operation-requirements">
                                      <span className="detail-label">Data Requirements:</span> {coOp.data_requirements}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Business Rules for this function */}
                          {func.business_rules.length > 0 && (
                            <div className="function-business-rules">
                              <h6 className="function-rules-title">Business Rules:</h6>
                              <ul className="function-rules-list">
                                {func.business_rules.map((rule, ruleIdx) => (
                                  <li key={ruleIdx}>{rule}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Modernization Notes */}
                          {/* {func.modernization_notes && (
                            <div className="modernization-notes">
                              <h6 className="modernization-title">💡 Modernization Notes</h6>
                              <p className="modernization-text">{func.modernization_notes}</p>
                            </div>
                          )} */}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detailed File Operations Section - Technical View */}
          {filteredOperations.length > 0 && (
          <div className="content-section">
            <h4 className="section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
                Detailed File Operations ({filteredOperations.length})
            </h4>
            <div className="operations-list">
              {filteredOperations.map((op, idx) => (
                <div key={idx} className="operation-item">
                  <div className="operation-header">
                    <OperationBadge operation={op.operation} size="sm" />
                    <span className="line-number">Line {op.line_number}</span>
                  </div>
                  {op.business_reason && (
                    <div className="operation-business-section">
                      <span className="operation-label">Business Reason:</span>
                      <p className="operation-text">{op.business_reason}</p>
                    </div>
                  )}
                  {op.business_value && (
                    <div className="operation-business-section">
                      <span className="operation-label">Business Value:</span>
                      <p className="operation-text">{op.business_value}</p>
                    </div>
                  )}
                  {typeof op.context === 'object' && op.context !== null ? (
                    <div className="context-detailed">
                      {op.context.business_logic_summary && (
                        <div className="context-section">
                          <span className="context-label">Business Logic:</span>
                          <p className="context-text">{op.context.business_logic_summary}</p>
                        </div>
                      )}
                      {op.context.condition_context && (
                        <div className="context-section">
                          <span className="context-label">Condition Context:</span>
                          <p className="context-text">{op.context.condition_context}</p>
                        </div>
                      )}
                      {op.context.control_flow && (
                        <div className="context-section">
                          <span className="context-label">Control Flow:</span>
                          <p className="context-text">{op.context.control_flow}</p>
                        </div>
                      )}
                      {op.context.loop_context && (
                        <div className="context-section">
                          <span className="context-label">Loop Context:</span>
                          <p className="context-text">{op.context.loop_context}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="operation-context">{getContextText(op.context)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          )}
                </>
              )}
              
              {/* Fields Tab */}
              {programTab === 'fields' && filteredFields.length > 0 && (
            <div className="content-section">
              <h4 className="section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7V4h16v3"/>
                  <path d="M9 20h6"/>
                  <path d="M12 4v16"/>
                </svg>
                Fields Accessed ({filteredFields.length})
              </h4>
              <div className="fields-grid">
                {filteredFields.map((field, idx) => (
                  <div key={idx} className="field-card">
                    <div className="field-header">
                      <span className="field-number">#{field.field_number}</span>
                      <span className="field-name">{field.field_name || 'unnamed'}</span>
                      <span className="field-line">L{field.line_number}</span>
                    </div>
                    {field.business_reason && (
                      <div className="field-business-section">
                        <span className="field-label">Business Reason:</span>
                        <p className="field-text">{field.business_reason}</p>
                      </div>
                    )}
                    {field.business_value && (
                      <div className="field-business-section">
                        <span className="field-label">Business Value:</span>
                        <p className="field-text">{field.business_value}</p>
                      </div>
                    )}
                    {field.context && (
                      typeof field.context === 'object' && field.context !== null ? (
                        <div className="context-detailed">
                          {field.context.business_logic_summary && (
                            <div className="context-section">
                              <span className="context-label">Business Logic:</span>
                              <p className="context-text">{field.context.business_logic_summary}</p>
                            </div>
                          )}
                          {field.context.condition_context && (
                            <div className="context-section">
                              <span className="context-label">Condition Context:</span>
                              <p className="context-text">{field.context.condition_context}</p>
                            </div>
                          )}
                          {field.context.control_flow && (
                            <div className="context-section">
                              <span className="context-label">Control Flow:</span>
                              <p className="context-text">{field.context.control_flow}</p>
                            </div>
                          )}
                          {field.context.loop_context && (
                            <div className="context-section">
                              <span className="context-label">Loop Context:</span>
                              <p className="context-text">{field.context.loop_context}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="field-context-section">
                          <span className="field-label">Context:</span>
                          <p className="field-context">{getContextText(field.context)}</p>
                        </div>
                      )
                    )}
                    {field.description && (
                      <p className="field-description">{field.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
              )}
            </div>
          </div>
          
          {/* Additional Sections (shown for all tabs) */}
          {program.node_business_rules && program.node_business_rules.length > 0 && (
            <div className="content-section">
              <h4 className="section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Business Rules
              </h4>
              <ul className="rules-list">
                {program.node_business_rules.map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Validations Section */}
          {program.node_validations && program.node_validations.length > 0 && (
            <div className="content-section">
              <h4 className="section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,11 12,14 22,4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                Validations
              </h4>
              <ul className="validations-list">
                {program.node_validations.map((validation, idx) => (
                  <li key={idx}>{validation}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Dependencies Section */}
          {fileAnalysis.dependencies.length > 0 && (
            <div className="content-section">
              <h4 className="section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"/>
                  <circle cx="6" cy="12" r="3"/>
                  <circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                Dependencies
              </h4>
              <div className="dependencies-list">
                {fileAnalysis.dependencies.map((dep, idx) => (
                  <span key={idx} className="dependency-tag">{dep}</span>
                ))}
              </div>
            </div>
          )}

          {/* Usage Patterns Section */}
          {fileAnalysis.usage_patterns.length > 0 && (
            <div className="content-section">
              <h4 className="section-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
                Usage Patterns ({fileAnalysis.usage_patterns.length})
              </h4>
              <div className="patterns-list">
                {fileAnalysis.usage_patterns.slice(0, 8).map((pattern, idx) => (
                  <span key={idx} className="pattern-tag">{pattern}</span>
                ))}
                {fileAnalysis.usage_patterns.length > 8 && (
                  <span className="pattern-more">
                    +{fileAnalysis.usage_patterns.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Business Purpose */}
          <div className="content-section business-purpose">
            <h4 className="section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              Business Purpose
            </h4>
            <p>{fileAnalysis.business_purpose}</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .program-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .program-card:hover {
          border-color: #fb851e;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .program-card-header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px 24px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .program-card-header:hover {
          background: #f9fafb;
        }
        
        .program-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #fb851e 0%, #e76f00 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }
        
        .program-name {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 1.125rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 4px 0;
        }
        
        .program-description {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0 0 6px 0;
          line-height: 1.5;
        }
        
        .program-title {
          font-size: 0.875rem;
          color: #fb851e;
          font-weight: 600;
          margin: 0 0 6px 0;
        }
        
        .program-summary {
          font-size: 0.8125rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.5;
        }
        
        .business-functions-indicator {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #fb851e;
          background: #fff7ed;
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid #fed7aa;
        }
        
        .business-functions-indicator svg {
          width: 14px;
          height: 14px;
        }
        
        .program-meta {
          font-size: 0.75rem;
          color: #9ca3af;
          font-family: 'JetBrains Mono', monospace;
        }
        
        .meta-separator {
          margin: 0 6px;
          opacity: 0.5;
        }
        
        .expand-icon {
          color: #9ca3af;
          transition: transform 0.3s;
          flex-shrink: 0;
          margin-top: 12px;
        }
        
        .expand-icon.expanded {
          transform: rotate(180deg);
        }
        
        .program-card-content {
          padding: 0 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          border-top: 1px solid #e5e7eb;
          animation: slideDown 0.3s ease-out;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .content-section {
          padding-top: 16px;
        }
        
        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #1f2937;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 12px 0;
        }
        
        .section-title svg {
          color: #fb851e;
        }
        
        .operations-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .operation-item {
          background: #f9fafb;
          border-radius: 10px;
          padding: 12px 16px;
          border: 1px solid #e5e7eb;
          border-left: 3px solid #fb851e;
        }
        
        .operation-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        
        .line-number {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          color: #9ca3af;
        }
        
        .operation-business-section {
          margin-top: 8px;
        }
        
        .operation-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #fb851e;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 4px;
        }
        
        .operation-text {
          font-size: 0.8125rem;
          color: #4b5563;
          margin: 0;
          line-height: 1.5;
        }
        
        .operation-context {
          font-size: 0.8125rem;
          color: #6b7280;
          margin: 8px 0 0 0;
          line-height: 1.5;
          padding-top: 8px;
          border-top: 1px dashed #e5e7eb;
        }
        
        .context-detailed {
          margin-top: 12px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        
        .context-section {
          margin-bottom: 12px;
        }
        
        .context-section:last-child {
          margin-bottom: 0;
        }
        
        .context-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #6366f1;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 4px;
        }
        
        .context-text {
          font-size: 0.8125rem;
          color: #4b5563;
          margin: 0;
          line-height: 1.6;
        }
        
        .fields-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
        }
        
        .field-card {
          background: #f9fafb;
          border-radius: 10px;
          padding: 14px 16px;
          border: 1px solid #e5e7eb;
        }
        
        .field-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .field-number {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          font-weight: 700;
          color: #fb851e;
          background: #fff7ed;
          padding: 2px 8px;
          border-radius: 4px;
        }
        
        .field-name {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8125rem;
          color: #1f2937;
          font-weight: 600;
        }
        
        .field-line {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.6875rem;
          color: #9ca3af;
          margin-left: auto;
        }
        
        .field-context {
          font-size: 0.8125rem;
          color: #6b7280;
          margin: 0 0 8px 0;
          line-height: 1.5;
        }
        
        .field-business-section {
          margin-top: 8px;
        }
        
        .field-context-section {
          margin-top: 8px;
        }
        
        .field-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #fb851e;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 4px;
        }
        
        .field-text {
          font-size: 0.8125rem;
          color: #4b5563;
          margin: 0;
          line-height: 1.5;
        }
        
        .field-description {
          font-size: 0.75rem;
          color: #9ca3af;
          margin: 8px 0 0 0;
          padding-top: 8px;
          border-top: 1px dashed #e5e7eb;
          line-height: 1.5;
          font-style: italic;
        }
        
        .rules-list,
        .validations-list {
          margin: 0;
          padding-left: 0;
          list-style: none;
        }
        
        .rules-list li,
        .validations-list li {
          position: relative;
          padding-left: 20px;
          font-size: 0.8125rem;
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 6px;
        }
        
        .rules-list li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 8px;
          width: 6px;
          height: 6px;
          background: #fb851e;
          border-radius: 50%;
        }
        
        .validations-list li::before {
          content: '✓';
          position: absolute;
          left: 0;
          top: 0;
          color: #3b82f6;
          font-size: 0.75rem;
          font-weight: bold;
        }
        
        .dependencies-list,
        .patterns-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .dependency-tag {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          color: #8b5cf6;
          background: #f3e8ff;
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid #e9d5ff;
        }
        
        .pattern-tag {
          font-size: 0.75rem;
          color: #6b7280;
          background: #f3f4f6;
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }
        
        .pattern-more {
          font-size: 0.75rem;
          color: #fb851e;
          padding: 4px 10px;
        }
        
        .business-purpose {
          background: #fff7ed;
          border-radius: 12px;
          padding: 16px 20px !important;
          border: 1px solid #fed7aa;
        }
        
        .business-purpose p {
          font-size: 0.875rem;
          color: #9a3412;
          margin: 0;
          line-height: 1.7;
        }
        
        .program-tabs-container {
          margin-top: 16px;
        }
        
        .program-tabs-header {
          display: flex;
          gap: 4px;
          background: #f9fafb;
          padding: 4px;
          border-radius: 10px;
          margin-bottom: 16px;
        }
        
        .program-tab-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          background: transparent;
          border: none;
          border-radius: 6px;
          color: #6b7280;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .program-tab-button:hover {
          background: white;
          color: #1f2937;
        }
        
        .program-tab-button.active {
          background: #8b5cf6;
          color: white;
        }
        
        .program-tab-button svg {
          flex-shrink: 0;
        }
        
        .program-tab-count {
          font-size: 0.7rem;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.2);
          padding: 2px 6px;
          border-radius: 10px;
        }
        
        .program-tab-button.active .program-tab-count {
          background: rgba(255, 255, 255, 0.25);
        }
        
        .program-tabs-content {
          min-height: 200px;
        }
        
        .field-summaries-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        
        @media (max-width: 1200px) {
          .field-summaries-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .field-summary-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 16px;
          transition: all 0.2s;
        }
        
        .field-summary-card:hover {
          background: white;
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.1);
          border-color: #8b5cf6;
        }
        
        .field-summary-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .field-summary-num {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          font-weight: 700;
          color: #8b5cf6;
          background: #f3e8ff;
          padding: 3px 8px;
          border-radius: 4px;
        }
        
        .field-summary-name {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8125rem;
          color: #1f2937;
          font-weight: 600;
        }
        
        .field-summary-accesses {
          margin-left: auto;
          font-size: 0.7rem;
          color: #9ca3af;
        }
        
        .field-summary-label {
          font-size: 0.75rem;
          color: #8b5cf6;
          font-weight: 600;
          font-style: italic;
          margin-bottom: 8px;
        }
        
        .field-summary-desc {
          font-size: 0.8125rem;
          color: #6b7280;
          margin: 0 0 12px 0;
          line-height: 1.5;
        }
        
        .field-summary-meaning {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }
        
        .field-summary-meaning-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #8b5cf6;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 6px;
        }
        
        .field-summary-meaning-text {
          font-size: 0.75rem;
          color: #4b5563;
          margin: 0;
          line-height: 1.6;
        }
        
        .field-summary-rules {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }
        
        .field-summary-rules-label {
          font-size: 0.7rem;
          font-weight: 600;
          color: #8b5cf6;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 6px;
        }
        
        .field-summary-rules-list {
          margin: 0;
          padding-left: 18px;
          list-style: none;
        }
        
        .field-summary-rules-list li {
          position: relative;
          font-size: 0.7rem;
          color: #6b7280;
          line-height: 1.5;
          margin-bottom: 4px;
        }
        
        .field-summary-rules-list li::before {
          content: '•';
          position: absolute;
          left: -14px;
          color: #8b5cf6;
          font-weight: bold;
        }
        
        .field-summary-more {
          font-style: italic;
          color: #8b5cf6;
        }
        
        .program-summary-section {
          background: #fff7ed;
          border-radius: 12px;
          padding: 16px 20px !important;
          border: 1px solid #fed7aa;
        }
        
        .program-summary-text {
          font-size: 0.875rem;
          color: #9a3412;
          margin: 0;
          line-height: 1.7;
        }
        
        .business-functions-section {
          margin-top: 8px;
        }
        
        .business-functions-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .business-function-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s;
        }
        
        .business-function-card:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .business-function-accordion-header {
          cursor: pointer;
          padding: 16px 20px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          transition: background 0.2s;
        }
        
        .business-function-accordion-header:hover {
          background: #fff7ed;
        }
        
        .function-expand-icon {
          color: #fb851e;
          transition: transform 0.3s;
          flex-shrink: 0;
        }
        
        .function-expand-icon.expanded {
          transform: rotate(180deg);
        }
        
        .business-function-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .business-function-name {
          font-size: 1rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }
        
        .business-function-badge {
          font-size: 0.75rem;
          font-weight: 600;
          color: #fb851e;
          background: #fff7ed;
          padding: 4px 10px;
          border-radius: 12px;
          border: 1px solid #fed7aa;
        }
        
        .business-function-content {
          padding: 16px 20px;
          animation: slideDown 0.3s ease-out;
        }
        
        .business-function-description {
          font-size: 0.875rem;
          color: #4b5563;
          margin: 0 0 16px 0;
          line-height: 1.6;
        }
        
        .business-function-content .business-function-description {
          margin-bottom: 16px;
        }
        
        .co-operations-list {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }
        
        .co-operations-title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 12px 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .co-operation-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 10px;
        }
        
        .co-operation-header {
          margin-bottom: 8px;
        }
        
        .co-operation-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .co-operation-reason,
        .co-operation-requirements {
          font-size: 0.8125rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.5;
        }
        
        .detail-label {
          font-weight: 600;
          color: #374151;
          margin-right: 6px;
        }
        
        .function-business-rules {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }
        
        .function-rules-title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .function-rules-list {
          margin: 0;
          padding-left: 20px;
          list-style: none;
        }
        
        .function-rules-list li {
          position: relative;
          font-size: 0.8125rem;
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 6px;
        }
        
        .function-rules-list li::before {
          content: '•';
          position: absolute;
          left: -16px;
          color: #fb851e;
          font-weight: bold;
        }
        
        .modernization-notes {
          margin-top: 16px;
          padding: 12px 16px;
          background: #fef3c7;
          border-radius: 8px;
          border: 1px solid #fde68a;
        }
        
        .modernization-title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #92400e;
          margin: 0 0 6px 0;
        }
        
        .modernization-text {
          font-size: 0.8125rem;
          color: #78350f;
          margin: 0;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// Summary Cards
// ============================================================================

interface SummaryStatsProps {
  data: FocusedFeatureAnalysisData;
  focusedFile: string;
}

const SummaryStats: React.FC<SummaryStatsProps> = ({ data, focusedFile }) => {
  const stats = useMemo(() => {
    let totalOperations = 0;
    let totalFields = 0;
    let totalRules = 0;
    const allDependencies = new Set<string>();
    const operationCounts: Record<string, number> = {};

    data.analyses.forEach(program => {
      const fileAnalyses = program.analyses || program.file_analyses || [];
      const fileAnalysis = fileAnalyses.find(f => f.file_name === focusedFile);
      if (fileAnalysis) {
        totalOperations += fileAnalysis.file_operations.length;
        totalFields += fileAnalysis.fields_accessed.length;
        fileAnalysis.dependencies.forEach(d => allDependencies.add(d));
        fileAnalysis.file_operations.forEach(op => {
          operationCounts[op.operation] = (operationCounts[op.operation] || 0) + 1;
        });
        
        // Count business rules from business_functions (new structure)
        if (fileAnalysis.business_functions && fileAnalysis.business_functions.length > 0) {
          fileAnalysis.business_functions.forEach(func => {
            totalRules += (func.business_rules || []).length;
          });
        }
      }
      
      // Also count legacy node_business_rules if they exist (for backward compatibility)
      totalRules += (program.node_business_rules || []).length;
    });

    return {
      programs: data.analyses.filter(p => {
        const fileAnalyses = p.analyses || p.file_analyses || [];
        return fileAnalyses.some(f => f.file_name === focusedFile);
      }).length,
      operations: totalOperations,
      fields: totalFields,
      rules: totalRules,
      dependencies: allDependencies.size,
      operationCounts,
    };
  }, [data, focusedFile]);

  return (
    <div className="summary-stats">
      <div className="stat-card highlight">
        <div className="stat-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14,2 14,8 20,8"/>
          </svg>
        </div>
        <div className="stat-content">
          <span className="stat-value">{stats.programs}</span>
          <span className="stat-label">Programs</span>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon blue">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
        </div>
        <div className="stat-content">
          <span className="stat-value">{stats.operations}</span>
          <span className="stat-label">Operations</span>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon purple">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7V4h16v3"/>
            <path d="M9 20h6"/>
            <path d="M12 4v16"/>
          </svg>
        </div>
        <div className="stat-content">
          <span className="stat-value">{stats.fields}</span>
          <span className="stat-label">Fields Accessed</span>
        </div>
      </div>
      
      
      
      <div className="stat-card">
        <div className="stat-icon cyan">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </div>
        <div className="stat-content">
          <span className="stat-value">{stats.dependencies}</span>
          <span className="stat-label">Dependencies</span>
        </div>
      </div>

      <style jsx>{`
        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }
        
        .stat-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .stat-card.highlight {
          background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
          border-color: #fed7aa;
        }
        
        .stat-icon {
          width: 48px;
          height: 48px;
          background: #fff7ed;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fb851e;
          flex-shrink: 0;
        }
        
        .stat-icon.blue {
          background: #dbeafe;
          color: #3b82f6;
        }
        
        .stat-icon.purple {
          background: #f3e8ff;
          color: #8b5cf6;
        }
        
        .stat-icon.green {
          background: #fff7ed;
          color: #fb851e;
        }
        
        .stat-icon.cyan {
          background: #cffafe;
          color: #06b6d4;
        }
        
        .stat-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1f2937;
          line-height: 1;
        }
        
        .stat-label {
          font-size: 0.75rem;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// Operation Distribution Chart
// ============================================================================

interface OperationDistributionProps {
  data: FocusedFeatureAnalysisData;
  focusedFile: string;
}

const OperationDistribution: React.FC<OperationDistributionProps> = ({ data, focusedFile }) => {
  const distribution = useMemo(() => {
    const counts: Record<string, { count: number; programs: Set<string> }> = {};
    
    data.analyses.forEach(program => {
      const fileAnalyses = program.analyses || program.file_analyses || [];
      const fileAnalysis = fileAnalyses.find(f => f.file_name === focusedFile);
      if (fileAnalysis) {
        fileAnalysis.file_operations.forEach(op => {
          if (!counts[op.operation]) {
            counts[op.operation] = { count: 0, programs: new Set() };
          }
          counts[op.operation].count++;
          counts[op.operation].programs.add(program.source_file_name);
        });
      }
    });

    const total = Object.values(counts).reduce((sum, { count }) => sum + count, 0);
    
    return Object.entries(counts)
      .map(([operation, { count, programs }]) => ({
        operation,
        count,
        percentage: (count / total) * 100,
        programs: Array.from(programs),
        color: getOperationColor(operation),
      }))
      .sort((a, b) => b.count - a.count);
  }, [data, focusedFile]);

  const maxCount = Math.max(...distribution.map(d => d.count));

  return (
    <div className="operation-distribution">
      <div className="bars-container">
        {distribution.map((item, idx) => (
          <div key={item.operation} className="bar-row">
            <div className="bar-label">
              <OperationBadge operation={item.operation} size="sm" />
            </div>
            <div className="bar-track">
              <div 
                className="bar-fill"
                style={{ 
                  width: `${(item.count / maxCount) * 100}%`,
                  backgroundColor: item.color,
                  animationDelay: `${idx * 0.1}s`
                }}
              />
            </div>
            <div className="bar-value">
              <span className="count">{item.count}</span>
              <span className="percentage">({item.percentage.toFixed(0)}%)</span>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .operation-distribution {
          width: 100%;
        }
        
        .bars-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .bar-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .bar-label {
          width: 100px;
          flex-shrink: 0;
        }
        
        .bar-track {
          flex: 1;
          height: 28px;
          background: #f3f4f6;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }
        
        .bar-fill {
          height: 100%;
          border-radius: 6px;
          animation: growBar 0.8s ease-out forwards;
          opacity: 0;
        }
        
        @keyframes growBar {
          from {
            width: 0;
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .bar-value {
          width: 80px;
          flex-shrink: 0;
          text-align: right;
          font-family: 'JetBrains Mono', monospace;
        }
        
        .bar-value .count {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1f2937;
        }
        
        .bar-value .percentage {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-left: 4px;
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// Field Usage Matrix
// ============================================================================

interface FieldUsageMatrixProps {
  data: FocusedFeatureAnalysisData;
  focusedFile: string;
}

const FieldUsageMatrix: React.FC<FieldUsageMatrixProps> = ({ data, focusedFile }) => {
  const [selectedFieldsFilter, setSelectedFieldsFilter] = useState<Set<string>>(new Set());
  const [fieldSearchQuery, setFieldSearchQuery] = useState('');
  
  // Get field summary from the first program that has it (they should all have the same field_summary)
  const fieldSummaryData = useMemo(() => {
    for (const program of data.analyses) {
      const fileAnalyses = program.analyses || program.file_analyses || [];
      const fileAnalysis = fileAnalyses.find(f => f.file_name === focusedFile);
      if (fileAnalysis?.field_summary?.field_summaries) {
        return fileAnalysis.field_summary;
      }
    }
    return null;
  }, [data, focusedFile]);

  const fieldUsage = useMemo(() => {
    // If we have field_summary data, use that for richer information
    if (fieldSummaryData?.field_summaries) {
      return fieldSummaryData.field_summaries.map(fieldSummary => {
        // Find programs that use this field
        const usedByPrograms: Array<{ program: string; lineNumber: number; context: ContextType}> = [];
        
        data.analyses.forEach(program => {
          const fileAnalyses = program.analyses || program.file_analyses || [];
          const fileAnalysis = fileAnalyses.find(f => f.file_name === focusedFile);
          if (fileAnalysis) {
            fileAnalysis.fields_accessed
              .filter(f => f.field_number === fieldSummary.field_number)
              .forEach(field => {
                usedByPrograms.push({
                  program: program.source_file_name,
                  lineNumber: field.line_number,
                  context: field.context,
                });
              });
          }
        });

        return {
          fieldNumber: fieldSummary.field_number,
          fieldName: fieldSummary.field_name,
          businessLabel: fieldSummary.business_label,
          description: fieldSummary.field_description,
          totalAccesses: fieldSummary.total_accesses,
          businessRules: fieldSummary.business_rules,
          programMeaning: fieldSummary.program_meaning,
          usedBy: usedByPrograms,
        };
      }).sort((a, b) => parseInt(a.fieldNumber) - parseInt(b.fieldNumber));
    }
    
    // Fallback to old format
    const usage: Record<string, FieldUsageSummary> = {};
    
    data.analyses.forEach(program => {
      const fileAnalyses = program.analyses || program.file_analyses || [];
      const fileAnalysis = fileAnalyses.find(f => f.file_name === focusedFile);
      if (fileAnalysis) {
        fileAnalysis.fields_accessed.forEach(field => {
          const key = field.field_number;
          if (!usage[key]) {
            usage[key] = {
              fieldNumber: field.field_number,
              fieldName: field.field_name,
              description: field.description,
              usedBy: [],
            };
          }
          usage[key].usedBy.push({
            program: program.source_file_name,
            lineNumber: field.line_number,
            context: field.context,
          });
        });
      }
    });

    return Object.values(usage).sort((a, b) => 
      parseInt(a.fieldNumber) - parseInt(b.fieldNumber)
    );
  }, [data, focusedFile, fieldSummaryData]);

  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  
  const toggleFieldExpansion = (fieldNumber: string) => {
    setExpandedFields(prev => {
      const next = new Set(prev);
      if (next.has(fieldNumber)) {
        next.delete(fieldNumber);
      } else {
        next.add(fieldNumber);
      }
      return next;
    });
  };
  
  const toggleFieldFilter = (fieldNumber: string) => {
    setSelectedFieldsFilter(prev => {
      const next = new Set(prev);
      if (next.has(fieldNumber)) {
        next.delete(fieldNumber);
      } else {
        next.add(fieldNumber);
      }
      return next;
    });
  };
  
  // Filter field usage based on search and selected fields
  const filteredFieldUsage = fieldUsage.filter((field: FocusedFieldUsageSummary) => {
    // Filter by selected fields
    if (selectedFieldsFilter.size > 0 && !selectedFieldsFilter.has(field.fieldNumber)) {
      return false;
    }
    
    // Filter by search query
    if (fieldSearchQuery) {
      const query = fieldSearchQuery.toLowerCase();
      return (
        field.fieldNumber.includes(query) ||
        field.fieldName.toLowerCase().includes(query) ||
        (field.businessLabel && field.businessLabel.toLowerCase().includes(query)) ||
        (field.description && field.description.toLowerCase().includes(query))
      );
    }
    
    return true;
  });
  
  if (fieldUsage.length === 0) return null;

  return (
    <div className="field-usage-matrix">
      {/* Filter Controls */}
      <div className="field-matrix-filters">
        <div className="field-matrix-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search fields..."
            value={fieldSearchQuery}
            onChange={(e) => setFieldSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="field-matrix-field-filter">
          <span className="filter-label-text">Filter Fields:</span>
          <div className="field-matrix-filter-buttons">
            {fieldUsage.slice(0, 20).map((field: FocusedFieldUsageSummary) => (
              <button
                key={field.fieldNumber}
                className={`field-matrix-filter-btn ${selectedFieldsFilter.has(field.fieldNumber) ? 'active' : ''}`}
                onClick={() => toggleFieldFilter(field.fieldNumber)}
                title={`Field ${field.fieldNumber} - ${field.fieldName}`}
              >
                #{field.fieldNumber}
              </button>
            ))}
            {fieldUsage.length > 20 && (
              <span className="field-matrix-more">+{fieldUsage.length - 20} more</span>
            )}
          </div>
          {selectedFieldsFilter.size > 0 && (
            <button
              className="clear-field-matrix-btn"
              onClick={() => setSelectedFieldsFilter(new Set())}
            >
              Clear ({selectedFieldsFilter.size})
            </button>
          )}
        </div>
      </div>
      
      <div className="matrix-grid">
        {filteredFieldUsage.map((field: FocusedFieldUsageSummary) => {
          const isExpanded = expandedFields.has(field.fieldNumber);
          const hasRichData = field.businessLabel || field.businessRules || field.programMeaning;
          
          return (
            <div key={field.fieldNumber} className="field-usage-card">
              <div 
                className="field-header clickable"
                onClick={() => hasRichData && toggleFieldExpansion(field.fieldNumber)}
                style={{ cursor: hasRichData ? 'pointer' : 'default' }}
              >
                <div className="field-title-row">
                  <span className="field-num">#{field.fieldNumber}</span>
                  <span className="field-nm">{field.fieldName || 'unnamed'}</span>
                  <span className="usage-count">{field.usedBy.length} program{field.usedBy.length !== 1 ? 's' : ''}</span>
                </div>
                {field.businessLabel && (
                  <div className="field-business-label">{field.businessLabel}</div>
                )}
                {hasRichData && (
                  <div className={`field-expand-icon ${isExpanded ? 'expanded' : ''}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6,9 12,15 18,9"/>
                    </svg>
                  </div>
                )}
              </div>
              
              {field.description && (
                <p className="field-desc">{field.description}</p>
              )}
              
              {isExpanded && hasRichData && (
                <div className="field-rich-content">
                  {field.programMeaning && (
                    <div className="field-section">
                      <span className="field-section-title">Field Summary</span>
                      <p className="field-section-text">{field.programMeaning}</p>
                    </div>
                  )}
                  
                  {field.businessRules && field.businessRules.length > 0 && (
                    <div className="field-section">
                      <span className="field-section-title">Business Rules ({field.businessRules.length})</span>
                      <ul className="field-rules-list">
                        {field.businessRules.map((rule: string, idx: number) => (
                          <li key={idx}>{rule}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {field.totalAccesses !== undefined && (
                    <div className="field-section">
                      <span className="field-section-title">Total Accesses: {field.totalAccesses}</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="program-tags">
                {field.usedBy.map((usage: FieldUsageSummary['usedBy'][number], idx: number) => (
                  <span key={idx} className="program-tag" title={getContextText(usage.context)}>
                    {usage.program}
                    <span className="tag-line">L{usage.lineNumber}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .field-usage-matrix {
          width: 100%;
        }
        
        .field-matrix-filters {
          margin-bottom: 24px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
        }
        
        .field-matrix-search {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 16px;
        }
        
        .field-matrix-search input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          font-size: 0.875rem;
          color: #1f2937;
        }
        
        .field-matrix-search input::placeholder {
          color: #9ca3af;
        }
        
        .field-matrix-field-filter {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .filter-label-text {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #374151;
        }
        
        .field-matrix-filter-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
        }
        
        .field-matrix-filter-btn {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          font-weight: 600;
          color: #8b5cf6;
          background: white;
          border: 1px solid #e5e7eb;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .field-matrix-filter-btn:hover {
          border-color: #8b5cf6;
          background: #f3e8ff;
        }
        
        .field-matrix-filter-btn.active {
          border-color: #8b5cf6;
          background: #8b5cf6;
          color: white;
        }
        
        .field-matrix-more {
          font-size: 0.75rem;
          color: #9ca3af;
          font-style: italic;
        }
        
        .clear-field-matrix-btn {
          font-size: 0.75rem;
          font-weight: 500;
          color: #ef4444;
          background: white;
          border: 1px solid #e5e7eb;
          padding: 4px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .clear-field-matrix-btn:hover {
          border-color: #ef4444;
          background: #fef2f2;
        }
        
        .matrix-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        
        @media (max-width: 1200px) {
          .matrix-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .field-usage-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          transition: all 0.3s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .field-usage-card:hover {
          border-color: #8b5cf6;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
          transform: translateY(-2px);
        }
        
        .field-header {
          position: relative;
          margin-bottom: 12px;
        }
        
        .field-header.clickable {
          cursor: pointer;
          transition: background 0.2s;
          padding: 8px;
          margin: -8px -8px 12px -8px;
          border-radius: 8px;
        }
        
        .field-header.clickable:hover {
          background: #f3e8ff;
        }
        
        .field-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .field-business-label {
          font-size: 0.75rem;
          color: #8b5cf6;
          font-weight: 600;
          margin-top: 4px;
          font-style: italic;
        }
        
        .field-expand-icon {
          position: absolute;
          top: 8px;
          right: 8px;
          color: #8b5cf6;
          transition: transform 0.3s;
        }
        
        .field-expand-icon.expanded {
          transform: rotate(180deg);
        }
        
        .field-num {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8125rem;
          font-weight: 700;
          color: #fb851e;
          background: #fff7ed;
          padding: 3px 8px;
          border-radius: 4px;
        }
        
        .field-nm {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8125rem;
          color: #1f2937;
          font-weight: 600;
        }
        
        .usage-count {
          margin-left: auto;
          font-size: 0.6875rem;
          color: #9ca3af;
        }
        
        .field-desc {
          font-size: 0.75rem;
          color: #6b7280;
          margin: 0 0 12px 0;
          line-height: 1.5;
        }
        
        .program-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        
        .program-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.6875rem;
          color: #8b5cf6;
          background: #f3e8ff;
          padding: 3px 8px;
          border-radius: 4px;
          border: 1px solid #e9d5ff;
          cursor: default;
        }
        
        .tag-line {
          font-size: 0.625rem;
          color: #9ca3af;
        }
        
        .field-rich-content {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e9d5ff;
          animation: slideDown 0.3s ease-out;
        }
        
        .field-section {
          margin-bottom: 16px;
        }
        
        .field-section:last-child {
          margin-bottom: 0;
        }
        
        .field-section-title {
          font-size: 0.7rem;
          font-weight: 600;
          color: #8b5cf6;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 8px;
        }
        
        .field-section-text {
          font-size: 0.8125rem;
          color: #4b5563;
          margin: 0;
          line-height: 1.6;
        }
        
        .field-rules-list {
          margin: 0;
          padding-left: 20px;
          list-style: none;
        }
        
        .field-rules-list li {
          position: relative;
          font-size: 0.75rem;
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 6px;
        }
        
        .field-rules-list li::before {
          content: '•';
          position: absolute;
          left: -16px;
          color: #8b5cf6;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

interface FocusedFeatureAnalysisProps {
  data: FocusedFeatureAnalysisData;
  focusedFile?: string;
  title?: string;
}

export const FocusedFeatureAnalysis: React.FC<FocusedFeatureAnalysisProps> = ({ 
  data: rawData, 
  focusedFile = 'CO',
  title = 'Data File Focused Analysis'
}) => {
  const data = useMemo(() => ({
    ...rawData,
    analyses: rawData?.analyses || [],
    program_analysis: rawData?.program_analysis || {}
  }), [rawData]);
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'operations' | 'fields' | 'programs'>('operations');
  const [showOnlyWithBusinessFunctions, setShowOnlyWithBusinessFunctions] = useState(false);
  const [selectedOperations, setSelectedOperations] = useState<Set<string>>(new Set());
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [aliasFilter, setAliasFilter] = useState<'all' | 'alias-only' | 'non-alias'>('all');
  const [hideComments, setHideComments] = useState(true);

  const toggleProgram = (name: string) => {
    setExpandedPrograms(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allNames = new Set(
      data.analyses
        .filter(p => {
          const fileAnalyses = p.analyses || p.file_analyses || [];
          return fileAnalyses.some(f => f.file_name === focusedFile);
        })
        .map(p => p.source_file_name)
    );
    setExpandedPrograms(allNames);
  };

  const collapseAll = () => {
    setExpandedPrograms(new Set());
  };

  // Get all available operations from the data
  const availableOperations = useMemo(() => {
    const operations = new Set<string>();
    data.analyses.forEach(program => {
      const fileAnalyses = program.analyses || program.file_analyses || [];
      const fileAnalysis = fileAnalyses.find(f => f.file_name === focusedFile);
      if (fileAnalysis) {
        fileAnalysis.file_operations.forEach(op => {
          operations.add(op.operation);
        });
      }
    });
    return Array.from(operations).sort();
  }, [data, focusedFile]);

  // Get all available fields from the data
  const availableFields = useMemo(() => {
    const fieldsMap = new Map<string, { fieldNumber: string; fieldName: string; count: number }>();
    data.analyses.forEach(program => {
      const fileAnalyses = program.analyses || program.file_analyses || [];
      const fileAnalysis = fileAnalyses.find(f => f.file_name === focusedFile);
      if (fileAnalysis) {
        fileAnalysis.fields_accessed.forEach(field => {
          const key = field.field_number;
          if (fieldsMap.has(key)) {
            const existing = fieldsMap.get(key)!;
            existing.count++;
          } else {
            fieldsMap.set(key, {
              fieldNumber: field.field_number,
              fieldName: field.field_name || 'unnamed',
              count: 1,
            });
          }
        });
      }
    });
    return Array.from(fieldsMap.values()).sort((a, b) => 
      parseInt(a.fieldNumber) - parseInt(b.fieldNumber)
    );
  }, [data, focusedFile]);

  const filteredPrograms = useMemo(() => {
    return data.analyses.filter(program => {
      const fileAnalyses = program.analyses || program.file_analyses || [];
      const fileAnalysis = fileAnalyses.find(f => f.file_name === focusedFile);
      const hasFile = fileAnalyses.some(f => f.file_name === focusedFile);
      if (!hasFile) return false;
      
      // Filter by business functions if enabled
      if (showOnlyWithBusinessFunctions) {
        if (!fileAnalysis || !fileAnalysis.business_functions || fileAnalysis.business_functions.length === 0) {
          return false;
        }
      }
      
      // Filter by selected operations
      if (selectedOperations.size > 0 && fileAnalysis) {
        const programOperations = new Set(
          fileAnalysis.file_operations.map(op => op.operation)
        );
        // Check if program has at least one of the selected operations
        const hasSelectedOperation = Array.from(selectedOperations).some(op => 
          programOperations.has(op)
        );
        if (!hasSelectedOperation) return false;
      }
      
      // Filter by selected fields
      if (selectedFields.size > 0 && fileAnalysis) {
        const programFields = new Set(
          fileAnalysis.fields_accessed.map(field => field.field_number)
        );
        // Check if program has at least one of the selected fields
        const hasSelectedField = Array.from(selectedFields).some(fieldNum => 
          programFields.has(fieldNum)
        );
        if (!hasSelectedField) return false;
      }
      
      // Filter by alias setting
      if (aliasFilter === 'alias-only' && fileAnalysis) {
        const hasAliasField = fileAnalysis.fields_accessed.some(field => field.is_alias === true);
        if (!hasAliasField) return false;
      } else if (aliasFilter === 'non-alias' && fileAnalysis) {
        const hasNonAliasField = fileAnalysis.fields_accessed.some(field => field.is_alias !== true);
        if (!hasNonAliasField) return false;
      }
      
      if (!searchQuery) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        program.source_file_name.toLowerCase().includes(query) ||
        (program.node_title && program.node_title.toLowerCase().includes(query)) ||
        (program.node_summary && program.node_summary.toLowerCase().includes(query))
      );
    });
  }, [data, focusedFile, searchQuery, showOnlyWithBusinessFunctions, selectedOperations, selectedFields, aliasFilter]);

  const toggleOperation = (operation: string) => {
    setSelectedOperations(prev => {
      const next = new Set(prev);
      if (next.has(operation)) {
        next.delete(operation);
      } else {
        next.add(operation);
      }
      return next;
    });
  };

  const clearOperationFilters = () => {
    setSelectedOperations(new Set());
  };

  const toggleField = (fieldNumber: string) => {
    setSelectedFields(prev => {
      const next = new Set(prev);
      if (next.has(fieldNumber)) {
        next.delete(fieldNumber);
      } else {
        next.add(fieldNumber);
      }
      return next;
    });
  };

  const clearFieldFilters = () => {
    setSelectedFields(new Set());
  };

  // Helper function to truncate text for Excel (max 32767 characters per cell)
  const truncateForExcel = (text: string, maxLength: number = 32767): string => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  // Export to Excel
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // Get field summary data if available
    const fieldSummaryData = (() => {
      for (const program of filteredPrograms) {
        const fileAnalyses = program.analyses || program.file_analyses || [];
        const fileAnalysis = fileAnalyses.find(f => f.file_name === focusedFile);
        if (fileAnalysis?.field_summary?.field_summaries) {
          return fileAnalysis.field_summary;
        }
      }
      return null;
    })();
    
    // Collect all unique fields across all programs (respecting filters)
    const fieldsMap = new Map<string, { 
      fieldNumber: string; 
      fieldName: string; 
      businessLabel?: string;
      description: string; 
      businessRules?: string[];
      programMeaning?: string;
      totalAccesses?: number;
      programs: ProgramReference[];
    }>();
    
    filteredPrograms.forEach(program => {
      const fileAnalyses = program.analyses || program.file_analyses || [];
      const fileAnalysis = fileAnalyses.find(f => f.file_name === focusedFile);
      if (fileAnalysis) {
        // Filter fields based on selectedFields and aliasFilter
        let fieldsToExport = fileAnalysis.fields_accessed;
        
        // Apply selectedFields filter
        if (selectedFields.size > 0) {
          fieldsToExport = fieldsToExport.filter(field => selectedFields.has(field.field_number));
        }
        
        // Apply alias filter
        if (aliasFilter === 'alias-only') {
          fieldsToExport = fieldsToExport.filter(field => field.is_alias === true);
        } else if (aliasFilter === 'non-alias') {
          fieldsToExport = fieldsToExport.filter(field => field.is_alias !== true);
        }
          
        fieldsToExport.forEach(field => {
          const key = field.field_number;
          if (!fieldsMap.has(key)) {
            // Get field summary info if available
            const fieldSummary = fieldSummaryData?.field_summaries.find(fs => fs.field_number === field.field_number);
            
            fieldsMap.set(key, {
              fieldNumber: field.field_number,
              fieldName: field.field_name || 'unnamed',
              businessLabel: fieldSummary?.business_label,
              description: fieldSummary?.field_description || field.description || '',
              businessRules: fieldSummary?.business_rules,
              programMeaning: fieldSummary?.program_meaning,
              totalAccesses: fieldSummary?.total_accesses,
              programs: []
            });
          }
          // Extract all context fields
          const contextObj = typeof field.context === 'object' && field.context !== null ? field.context : {};
          
          fieldsMap.get(key)!.programs.push({
            programName: program.source_file_name,
            programTitle: program.node_title || '',
            programSummary: program.node_summary || '',
            lineNumber: field.line_number,
            businessReason: field.business_reason || '',
            businessValue: field.business_value || '',
            businessLogic: contextObj.business_logic_summary || '',
            conditionContext: contextObj.condition_context || '',
            controlFlow: contextObj.control_flow || '',
            loopContext: contextObj.loop_context || '',
            contextText: typeof field.context === 'string' ? field.context : '',
            isAlias: field.is_alias || false
          });
        });
      }
    });

    // Sort fields by field number
    const sortedFields = Array.from(fieldsMap.values()).sort((a, b) => 
      parseInt(a.fieldNumber) - parseInt(b.fieldNumber)
    );

    // Summary Sheet
    const summaryData = [
      ['Data File Focused Analysis Report'],
      [''],
      ['File Name', focusedFile],
      ['Generated Date', new Date().toLocaleString()],
      [''],
      ['Filters Applied'],
      ['Field Filters', selectedFields.size > 0 ? `Yes (${selectedFields.size} field${selectedFields.size !== 1 ? 's' : ''} selected)` : 'No'],
      ['Operation Filters', selectedOperations.size > 0 ? `Yes (${selectedOperations.size} operation${selectedOperations.size !== 1 ? 's' : ''} selected)` : 'No'],
      ['Business Functions Only', showOnlyWithBusinessFunctions ? 'Yes' : 'No'],
      ['Alias Filter', aliasFilter === 'all' ? 'All Fields' : aliasFilter === 'alias-only' ? 'Alias Only' : 'Non-Alias Only'],
      ['Comments Hidden', hideComments ? 'Yes' : 'No'],
      [''],
      ['Summary Statistics'],
      ['Total Programs', String(filteredPrograms.length)],
      ['Total Unique Fields', String(sortedFields.length)],
      ['Total Field Accesses', String(sortedFields.reduce((sum, f) => sum + f.programs.length, 0))],
      [''],
      ['Field Summary'],
      ['Field #', 'Field Name', 'Programs Using', 'Total Accesses', 'Description']
    ];

    sortedFields.forEach(field => {
      summaryData.push([
        field.fieldNumber,
        field.fieldName,
        String(new Set(field.programs.map(p => p.programName)).size),
        String(field.programs.length),
        truncateForExcel(field.description)
      ]);
    });

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Create one sheet per field
    sortedFields.forEach(field => {
      const fieldSheetData = [
        [`Field #${field.fieldNumber}: ${field.fieldName}`],
        ['']
      ];
      
      // Add business label if available
      if (field.businessLabel) {
        fieldSheetData.push(['Business Label:', field.businessLabel]);
        fieldSheetData.push(['']);
      }
      
      // Add field description
      fieldSheetData.push(['Field Description:', truncateForExcel(field.description)]);
      fieldSheetData.push(['']);
      
      // Add field summary if available
      if (field.programMeaning) {
        fieldSheetData.push(['Field Summary:', truncateForExcel(field.programMeaning)]);
        fieldSheetData.push(['']);
      }
      
      // Add business rules if available
      if (field.businessRules && field.businessRules.length > 0) {
        fieldSheetData.push(['Business Rules:']);
        field.businessRules.forEach(rule => {
          fieldSheetData.push(['', truncateForExcel(rule)]);
        });
        fieldSheetData.push(['']);
      }
      
      // Add total accesses if available
      if (field.totalAccesses !== undefined) {
        fieldSheetData.push(['Total Field Accesses:', String(field.totalAccesses)]);
        fieldSheetData.push(['']);
      }
      
      // Add filters applied
      fieldSheetData.push(['Filters Applied:']);
      if (aliasFilter !== 'all') {
        fieldSheetData.push(['', `Alias Filter: ${aliasFilter === 'alias-only' ? 'Alias Only' : 'Non-Alias Only'}`]);
      }
      if (hideComments) fieldSheetData.push(['', 'Comments Hidden: Yes']);
      if (aliasFilter !== 'all' || hideComments) fieldSheetData.push(['']);
      
      fieldSheetData.push(['Usage Details in Programs']);
      fieldSheetData.push(['Program Name', 'Program Title', 'Program Summary', 'Line Number', 'Business Reason', 'Business Value', 'Business Logic Summary', 'Condition Context', 'Control Flow', 'Loop Context', 'Context (Legacy)', 'Is Alias']);

      field.programs.forEach(prog => {
        fieldSheetData.push([
          prog.programName,
          truncateForExcel(prog.programTitle || ''),
          truncateForExcel(prog.programSummary || ''),
          String(prog.lineNumber),
          truncateForExcel(prog.businessReason || ''),
          truncateForExcel(prog.businessValue || ''),
          truncateForExcel(prog.businessLogic || ''),
          truncateForExcel(prog.conditionContext|| ''),
          truncateForExcel(prog.controlFlow || ''),
          truncateForExcel(prog.loopContext || ''),
          truncateForExcel(prog.contextText || ''),
          prog.isAlias ? 'Yes' : 'No'
        ]);
      });

      const fieldSheet = XLSX.utils.aoa_to_sheet(fieldSheetData);
      
      // Sanitize sheet name (Excel has 31 char limit and doesn't allow certain characters)
      const sheetName = `${field.fieldNumber}-${field.fieldName}`.substring(0, 31).replace(/[:\\/?*\[\]]/g, '_');
      XLSX.utils.book_append_sheet(workbook, fieldSheet, sheetName);
    });

    // Write file
    const fileName = `Field_Analysis_${focusedFile}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Export to Markdown
  const exportToMarkdown = () => {
    // Get field summary data
    const fieldSummaryData = (() => {
      for (const program of filteredPrograms) {
        const fileAnalyses = program.analyses || program.file_analyses || [];
        const fileAnalysis = fileAnalyses.find(f => f.file_name === focusedFile);
        if (fileAnalysis?.field_summary?.field_summaries) {
          return fileAnalysis.field_summary;
        }
      }
      return null;
    })();
    
    // Collect unique fields (same logic as Excel export)
    const fieldsMap = new Map<string, { 
      fieldNumber: string; 
      fieldName: string; 
      businessLabel?: string;
      description: string; 
      businessRules?: string[];
      programMeaning?: string;
      totalAccesses?: number;
      programs: ProgramReference[];
    }>();
    
    filteredPrograms.forEach(program => {
      const fileAnalyses = program.analyses || program.file_analyses || [];
      const fileAnalysis = fileAnalyses.find(f => f.file_name === focusedFile);
      if (fileAnalysis) {
        // Filter fields based on selectedFields and aliasFilter
        let fieldsToExport = fileAnalysis.fields_accessed;
        
        // Apply selectedFields filter
        if (selectedFields.size > 0) {
          fieldsToExport = fieldsToExport.filter(field => selectedFields.has(field.field_number));
        }
        
        // Apply alias filter
        if (aliasFilter === 'alias-only') {
          fieldsToExport = fieldsToExport.filter(field => field.is_alias === true);
        } else if (aliasFilter === 'non-alias') {
          fieldsToExport = fieldsToExport.filter(field => field.is_alias !== true);
        }
          
        fieldsToExport.forEach(field => {
          const key = field.field_number;
          if (!fieldsMap.has(key)) {
            const fieldSummary = fieldSummaryData?.field_summaries.find(fs => fs.field_number === field.field_number);
            
            fieldsMap.set(key, {
              fieldNumber: field.field_number,
              fieldName: field.field_name || 'unnamed',
              businessLabel: fieldSummary?.business_label,
              description: fieldSummary?.field_description || field.description || '',
              businessRules: fieldSummary?.business_rules,
              programMeaning: fieldSummary?.program_meaning,
              totalAccesses: fieldSummary?.total_accesses,
              programs: []
            });
          }
          const contextObj = typeof field.context === 'object' && field.context !== null ? field.context : {};
          
          fieldsMap.get(key)!.programs.push({
            programName: program.source_file_name,
            programTitle: program.node_title || '',
            businessReason: field.business_reason || '',
            businessValue: field.business_value || '',
            businessLogic: contextObj.business_logic_summary || '',
            isAlias: field.is_alias || false,
            lineNumber: field.line_number
          });
        });
      }
    });

    const sortedFields = Array.from(fieldsMap.values()).sort((a, b) => 
      parseInt(a.fieldNumber) - parseInt(b.fieldNumber)
    );
    
    let markdown = `# Field Analysis Report\n\n`;
    markdown += `**File Name:** ${focusedFile}\n\n`;
    markdown += `**Generated Date:** ${new Date().toLocaleString()}\n\n`;
    
    // Filters
    markdown += `## Filters Applied\n\n`;
    markdown += `- **Field Filters:** ${selectedFields.size > 0 ? `Yes (${selectedFields.size} selected)` : 'No'}\n`;
    markdown += `- **Operation Filters:** ${selectedOperations.size > 0 ? `Yes (${selectedOperations.size} selected)` : 'No'}\n`;
    markdown += `- **Business Functions Only:** ${showOnlyWithBusinessFunctions ? 'Yes' : 'No'}\n`;
    markdown += `- **Alias Filter:** ${aliasFilter === 'all' ? 'All Fields' : aliasFilter === 'alias-only' ? 'Alias Only' : 'Non-Alias Only'}\n`;
    markdown += `- **Comments Hidden:** ${hideComments ? 'Yes' : 'No'}\n\n`;
    markdown += `---\n\n`;

    // Summary
    markdown += `## Summary Statistics\n\n`;
    markdown += `- **Total Programs:** ${filteredPrograms.length}\n`;
    markdown += `- **Total Unique Fields:** ${sortedFields.length}\n`;
    markdown += `- **Total Field Accesses:** ${sortedFields.reduce((sum, f) => sum + f.programs.length, 0)}\n\n`;
    markdown += `---\n\n`;

    // Fields (one section per field)
    sortedFields.forEach((field, idx) => {
      markdown += `## Field ${idx + 1}: #${field.fieldNumber} - ${field.fieldName}\n\n`;
      
      if (field.businessLabel) {
        markdown += `**Business Label:** ${field.businessLabel}\n\n`;
      }
      
      markdown += `**Description:** ${field.description}\n\n`;
      
      if (field.programMeaning) {
        markdown += `**Field Summary:**\n\n${field.programMeaning}\n\n`;
      }
      
      if (field.businessRules && field.businessRules.length > 0) {
        markdown += `**Business Rules:**\n\n`;
        field.businessRules.forEach(rule => {
          markdown += `- ${rule}\n`;
        });
        markdown += `\n`;
      }
      
      if (field.totalAccesses !== undefined) {
        markdown += `**Total Accesses:** ${field.totalAccesses}\n\n`;
      }
      
      markdown += `### Programs Using This Field\n\n`;
      markdown += `| Program | Line | Business Reason | Business Value | Alias |\n`;
      markdown += `|---------|------|-----------------|----------------|-------|\n`;
      field.programs.forEach(prog => {
        markdown += `| ${prog.programName} | ${prog.lineNumber} | ${(prog.businessReason || '').replace(/\|/g, '\\|')} | ${(prog.businessValue || '').replace(/\|/g, '\\|')} | ${prog.isAlias ? 'Yes' : 'No'} |\n`;
      });
      markdown += `\n---\n\n`;
    });

    // Download as file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Field_Analysis_${focusedFile}_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export to Interactive HTML
  const exportToHTML = () => {
    // Get field summary data (same as Excel export)
    const fieldSummaryData = (() => {
      for (const program of filteredPrograms) {
        const fileAnalyses = program.analyses || program.file_analyses || [];
        const fileAnalysis = fileAnalyses.find(f => f.file_name === focusedFile);
        if (fileAnalysis?.field_summary?.field_summaries) {
          return fileAnalysis.field_summary;
        }
      }
      return null;
    })();
    
    // Collect unique fields (same logic as Excel/Markdown)
    const fieldsMap = new Map<string, { 
      fieldNumber: string; 
      fieldName: string; 
      businessLabel?: string;
      description: string; 
      businessRules?: string[];
      programMeaning?: string;
      totalAccesses?: number;
      programs: ProgramReference[];
    }>();
    
    filteredPrograms.forEach(program => {
      const fileAnalyses = program.analyses || program.file_analyses || [];
      const fileAnalysis = fileAnalyses.find(f => f.file_name === focusedFile);
      if (fileAnalysis) {
        // Filter fields based on selectedFields and aliasFilter (matching Excel/Markdown)
        let fieldsToExport = fileAnalysis.fields_accessed;
        
        // Apply selectedFields filter
        if (selectedFields.size > 0) {
          fieldsToExport = fieldsToExport.filter(field => selectedFields.has(field.field_number));
        }
        
        // Apply alias filter
        if (aliasFilter === 'alias-only') {
          fieldsToExport = fieldsToExport.filter(field => field.is_alias === true);
        } else if (aliasFilter === 'non-alias') {
          fieldsToExport = fieldsToExport.filter(field => field.is_alias !== true);
        }
          
        fieldsToExport.forEach(field => {
          const key = field.field_number;
          if (!fieldsMap.has(key)) {
            const fieldSummary = fieldSummaryData?.field_summaries.find(fs => fs.field_number === field.field_number);
            
            fieldsMap.set(key, {
              fieldNumber: field.field_number,
              fieldName: field.field_name || 'unnamed',
              businessLabel: fieldSummary?.business_label,
              description: fieldSummary?.field_description || field.description || '',
              businessRules: fieldSummary?.business_rules,
              programMeaning: fieldSummary?.program_meaning,
              totalAccesses: fieldSummary?.total_accesses,
              programs: []
            });
          }
          const contextObj = typeof field.context === 'object' && field.context !== null ? field.context : {};
          
          fieldsMap.get(key)!.programs.push({
            programName: program.source_file_name,
            programTitle: program.node_title || '',
            businessReason: field.business_reason || '',
            businessValue: field.business_value || '',
            businessLogic: contextObj.business_logic_summary || '',
            isAlias: field.is_alias || false,
            lineNumber: field.line_number
          });
        });
      }
    });

    const sortedFields = Array.from(fieldsMap.values()).sort((a, b) => 
      parseInt(a.fieldNumber) - parseInt(b.fieldNumber)
    );
    
    const stats = {
      programs: filteredPrograms.length,
      fields: sortedFields.length,
      accesses: sortedFields.reduce((sum, f) => sum + f.programs.length, 0),
    };
    
    const escapeHtml = (text: string) => {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };
    

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Field Analysis - ${focusedFile}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      color: #1f2937;
      line-height: 1.6;
      min-height: 100vh;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .header {
      background: white;
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 24px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }
    
    .header h1 {
      font-size: 2rem;
      color: #1f2937;
      margin-bottom: 8px;
    }
    
    .header .subtitle {
      font-size: 1.125rem;
      color: #6b7280;
      margin-bottom: 16px;
    }
    
    .header .meta {
      display: flex;
      gap: 24px;
      font-size: 0.875rem;
      color: #9ca3af;
      flex-wrap: wrap;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s;
    }
    
    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }
    
    .stat-card .value {
      font-size: 2.5rem;
      font-weight: 700;
      color: #fb851e;
      margin-bottom: 4px;
    }
    
    .stat-card .label {
      font-size: 0.875rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .filters-applied {
      background: white;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .filters-applied h3 {
      font-size: 1rem;
      color: #1f2937;
      margin-bottom: 12px;
    }
    
    .filters-applied ul {
      list-style: none;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    
    .filters-applied li {
      font-size: 0.875rem;
      color: #6b7280;
      background: #f3f4f6;
      padding: 6px 12px;
      border-radius: 6px;
    }
    
    .fields-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .field-card-section {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .field-card-header {
      padding: 20px 24px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: start;
      gap: 16px;
      transition: background 0.2s;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .field-card-header:hover {
      background: #f3e8ff;
    }
    
    .field-info {
      flex: 1;
    }
    
    .field-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    
    .field-badge {
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      font-weight: 700;
      color: #8b5cf6;
      background: #f3e8ff;
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid #e9d5ff;
    }
    
    .field-name-title {
      font-family: 'Courier New', monospace;
      font-size: 1.125rem;
      font-weight: 700;
      color: #1f2937;
    }
    
    .access-badge {
      font-size: 0.75rem;
      font-weight: 600;
      color: #8b5cf6;
      background: white;
      padding: 4px 10px;
      border-radius: 12px;
      border: 1px solid #e9d5ff;
      margin-left: auto;
    }
    
    .field-business-label {
      font-size: 0.875rem;
      color: #8b5cf6;
      font-weight: 600;
      font-style: italic;
      margin-bottom: 6px;
    }
    
    .field-description-preview {
      font-size: 0.875rem;
      color: #6b7280;
      line-height: 1.5;
    }
    
    .expand-icon {
      color: #8b5cf6;
      transition: transform 0.3s;
      font-size: 1.5rem;
      line-height: 1;
    }
    
    .expand-icon.expanded {
      transform: rotate(180deg);
    }
    
    .field-card-content {
      padding: 0 24px 24px 24px;
      display: none;
    }
    
    .field-card-content.expanded {
      display: block;
      animation: slideDown 0.3s ease-out;
    }
    
    .detail-section {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    
    .detail-section:first-child {
      margin-top: 0;
      padding-top: 0;
      border-top: none;
    }
    
    .detail-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .detail-text {
      font-size: 0.875rem;
      color: #4b5563;
      line-height: 1.7;
      margin: 0;
    }
    
    .business-rules-list {
      list-style: none;
      padding: 0;
    }
    
    .business-rules-list li {
      position: relative;
      padding-left: 20px;
      margin-bottom: 8px;
      font-size: 0.8125rem;
      color: #6b7280;
      line-height: 1.6;
    }
    
    .business-rules-list li::before {
      content: '•';
      position: absolute;
      left: 0;
      color: #8b5cf6;
      font-weight: bold;
    }
    
    .programs-table {
      margin-top: 12px;
      overflow-x: auto;
    }
    
    .programs-table table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }
    
    .programs-table thead {
      background: #f9fafb;
    }
    
    .programs-table th {
      text-align: left;
      padding: 10px 12px;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .programs-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #f3f4f6;
      color: #6b7280;
    }
    
    .programs-table tbody tr:hover {
      background: #f9fafb;
    }
    
    .program-cell {
      font-family: 'Courier New', monospace;
      font-weight: 600;
      color: #1f2937;
    }
    
    .line-cell {
      font-family: 'Courier New', monospace;
      color: #9ca3af;
      font-size: 0.75rem;
    }
    
    .reason-cell {
      max-width: 300px;
    }
    
    .alias-cell {
      color: #8b5cf6;
      font-weight: 600;
    }
    
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .section {
      margin-top: 24px;
    }
    
    .section-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: #1f2937;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .section-icon {
      color: #fb851e;
    }
    
    .operation-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: 'Courier New', monospace;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 12px;
      margin-right: 8px;
      margin-bottom: 8px;
    }
    
    .operation-item {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-left: 3px solid #fb851e;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 12px;
    }
    
    .operation-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    
    .line-number {
      font-family: 'Courier New', monospace;
      font-size: 0.75rem;
      color: #9ca3af;
    }
    
    .operation-context {
      font-size: 0.875rem;
      color: #6b7280;
      line-height: 1.5;
    }
    
    .fields-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 12px;
    }
    
    .field-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
    }
    
    .field-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    
    .field-number {
      font-family: 'Courier New', monospace;
      font-size: 0.75rem;
      font-weight: 700;
      color: #fb851e;
      background: #fff7ed;
      padding: 2px 8px;
      border-radius: 4px;
    }
    
    .field-name {
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      font-weight: 600;
      color: #1f2937;
    }
    
    .field-context {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 8px;
    }
    
    .business-function-card {
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
    }
    
    .business-function-name {
      font-size: 1rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 8px;
    }
    
    .business-function-description {
      font-size: 0.875rem;
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 12px;
    }
    
    .business-rules {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #fed7aa;
    }
    
    .business-rules ul {
      list-style: none;
      padding-left: 0;
    }
    
    .business-rules li {
      position: relative;
      padding-left: 20px;
      margin-bottom: 6px;
      font-size: 0.875rem;
      color: #6b7280;
    }
    
    .business-rules li::before {
      content: '•';
      position: absolute;
      left: 0;
      color: #fb851e;
      font-weight: bold;
    }
    
    .tag {
      display: inline-block;
      font-size: 0.75rem;
      padding: 4px 10px;
      border-radius: 6px;
      margin-right: 8px;
      margin-bottom: 8px;
    }
    
    .tag.dependency {
      background: #f3e8ff;
      color: #8b5cf6;
      border: 1px solid #e9d5ff;
    }
    
    /* Tabs Styles */
    .tabs-container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    .tabs-header {
      display: flex;
      gap: 0;
      background: #f9fafb;
      border-bottom: 2px solid #e5e7eb;
      padding: 0;
    }
    
    .tab-button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 16px 24px;
      background: transparent;
      border: none;
      color: #6b7280;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border-bottom: 3px solid transparent;
      position: relative;
    }
    
    .tab-button:hover {
      background: #f3f4f6;
      color: #1f2937;
    }
    
    .tab-button.active {
      color: #fb851e;
      background: white;
      border-bottom-color: #fb851e;
    }
    
    .tab-button svg {
      width: 18px;
      height: 18px;
    }
    
    .tab-badge {
      background: #fb851e;
      color: white;
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 12px;
      margin-left: 4px;
    }
    
    .tabs-content {
      padding: 32px;
      min-height: 400px;
    }
    
    /* Operation Distribution */
    .bars-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .bar-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .bar-label {
      width: 120px;
      flex-shrink: 0;
    }
    
    .operation-badge-inline {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: 'Courier New', monospace;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 12px;
    }
    
    .bar-track {
      flex: 1;
      height: 32px;
      background: #f3f4f6;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
    }
    
    .bar-fill {
      height: 100%;
      border-radius: 8px;
      display: flex;
      align-items: center;
      padding-left: 12px;
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
      transition: width 0.8s ease-out;
    }
    
    .bar-value {
      width: 100px;
      flex-shrink: 0;
      text-align: right;
      font-family: 'Courier New', monospace;
    }
    
    .bar-value .count {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1f2937;
    }
    
    .bar-value .percentage {
      font-size: 0.75rem;
      color: #9ca3af;
      margin-left: 4px;
    }
    
    /* Field Usage Matrix */
    .matrix-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 12px;
    }
    
    .field-usage-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      transition: all 0.2s;
    }
    
    .field-usage-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }
    
    .field-usage-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    
    .field-usage-count {
      background: #fb851e;
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 12px;
      margin-left: auto;
    }
    
    .field-programs {
      font-size: 0.75rem;
      color: #6b7280;
      line-height: 1.5;
    }
    
    .controls {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      gap: 12px;
      z-index: 1000;
    }
    
    .btn {
      background: white;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.2s;
    }
    
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    }
    
    .btn-primary {
      background: #fb851e;
      color: white;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .controls {
        display: none;
      }
      .filters-applied {
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Field Analysis Report</h1>
      <div class="subtitle">File: <strong>${focusedFile}</strong></div>
      <div class="meta">
        <span>📅 Generated: ${new Date().toLocaleString()}</span>
        <span>📊 ${stats.fields} Fields • ${stats.programs} Programs • ${stats.accesses} Accesses</span>
      </div>
    </div>
    
    ${selectedFields.size > 0 || selectedOperations.size > 0 || showOnlyWithBusinessFunctions || aliasFilter !== 'all' ? `
    <div class="filters-applied">
      <h3>Filters Applied</h3>
      <ul>
        ${selectedFields.size > 0 ? `<li>Field Filters: ${selectedFields.size} selected</li>` : ''}
        ${selectedOperations.size > 0 ? `<li>Operation Filters: ${selectedOperations.size} selected</li>` : ''}
        ${showOnlyWithBusinessFunctions ? `<li>Business Functions Only: Yes</li>` : ''}
        ${aliasFilter !== 'all' ? `<li>Alias Filter: ${aliasFilter === 'alias-only' ? 'Alias Only' : 'Non-Alias Only'}</li>` : ''}
        ${hideComments ? `<li>Comments Hidden: Yes</li>` : ''}
      </ul>
    </div>
    ` : ''}
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="value">${stats.programs}</div>
        <div class="label">Programs</div>
      </div>
      <div class="stat-card">
        <div class="value">${stats.fields}</div>
        <div class="label">Unique Fields</div>
      </div>
      <div class="stat-card">
        <div class="value">${stats.accesses}</div>
        <div class="label">Total Accesses</div>
      </div>
    </div>
    
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Field Analysis Report</h1>
      <div class="subtitle">File: <strong>${focusedFile}</strong></div>
      <div class="meta">
        <span>📅 Generated: ${new Date().toLocaleString()}</span>
        <span>📊 ${stats.fields} Fields • ${stats.programs} Programs • ${stats.accesses} Accesses</span>
      </div>
    </div>
    
    ${selectedFields.size > 0 || selectedOperations.size > 0 || showOnlyWithBusinessFunctions || aliasFilter !== 'all' ? `
    <div class="filters-applied">
      <h3>🔍 Filters Applied</h3>
      <ul>
        ${selectedFields.size > 0 ? `<li><strong>Field Filters:</strong> ${selectedFields.size} selected</li>` : ''}
        ${selectedOperations.size > 0 ? `<li><strong>Operation Filters:</strong> ${selectedOperations.size} selected</li>` : ''}
        ${showOnlyWithBusinessFunctions ? `<li><strong>Business Functions Only:</strong> Yes</li>` : ''}
        ${aliasFilter !== 'all' ? `<li><strong>Alias Filter:</strong> ${aliasFilter === 'alias-only' ? 'Alias Only' : 'Non-Alias Only'}</li>` : ''}
        ${hideComments ? `<li><strong>Comments Hidden:</strong> Yes</li>` : ''}
      </ul>
    </div>
    ` : ''}
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="value">${stats.programs}</div>
        <div class="label">Programs</div>
      </div>
      <div class="stat-card">
        <div class="value">${stats.fields}</div>
        <div class="label">Unique Fields</div>
      </div>
      <div class="stat-card">
        <div class="value">${stats.accesses}</div>
        <div class="label">Total Accesses</div>
      </div>
    </div>
    
    <!-- Field-Centric Content -->
    <div class="fields-container">
      ${sortedFields.map((field, idx) => `
        <div class="field-card-section">
          <div class="field-card-header" onclick="toggleField(${idx})">
            <div class="field-info">
              <div class="field-title">
                <span class="field-badge">#${escapeHtml(field.fieldNumber)}</span>
                <span class="field-name-title">${escapeHtml(field.fieldName)}</span>
                <span class="access-badge">${field.programs.length} access${field.programs.length !== 1 ? 'es' : ''}</span>
              </div>
              ${field.businessLabel ? `<div class="field-business-label">${escapeHtml(field.businessLabel)}</div>` : ''}
              ${field.description ? `<div class="field-description-preview">${escapeHtml(field.description.substring(0, 150))}${field.description.length > 150 ? '...' : ''}</div>` : ''}
            </div>
            <div class="expand-icon" id="field-icon-${idx}">▼</div>
          </div>
          
          <div class="field-card-content" id="field-content-${idx}">
            ${field.description ? `
              <div class="detail-section">
                <h4 class="detail-title">📝 Field Description</h4>
                <p class="detail-text">${escapeHtml(field.description)}</p>
              </div>
            ` : ''}
            
            ${field.programMeaning ? `
              <div class="detail-section">
                <h4 class="detail-title">💡 Field Summary</h4>
                <p class="detail-text">${escapeHtml(field.programMeaning)}</p>
              </div>
            ` : ''}
            
            ${field.businessRules && field.businessRules.length > 0 ? `
              <div class="detail-section">
                <h4 class="detail-title">📜 Business Rules (${field.businessRules.length})</h4>
                <ul class="business-rules-list">
                  ${field.businessRules.map(rule => `<li>${escapeHtml(rule)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            ${field.totalAccesses !== undefined ? `
              <div class="detail-section">
                <h4 class="detail-title">📊 Total Accesses: ${field.totalAccesses}</h4>
              </div>
            ` : ''}
            
            <div class="detail-section">
              <h4 class="detail-title">🏢 Programs Using This Field (${field.programs.length})</h4>
              <div class="programs-table">
                <table>
                  <thead>
                    <tr>
                      <th>Program</th>
                      <th>Line</th>
                      <th>Business Reason</th>
                      <th>Alias</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${field.programs.map(prog => `
                      <tr>
                        <td class="program-cell">${escapeHtml(prog.programName)}</td>
                        <td class="line-cell">L${prog.lineNumber}</td>
                        <td class="reason-cell">${escapeHtml(prog.businessReason || 'N/A')}</td>
                        <td class="alias-cell">${prog.isAlias ? '✓ Yes' : 'No'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  
  <div class="controls">
    <button class="btn" onclick="expandAll()">Expand All</button>
    <button class="btn" onclick="collapseAll()">Collapse All</button>
    <button class="btn btn-primary" onclick="window.print()">🖨️ Print</button>
  </div>
  
  <script>
    // Field card expand/collapse
    function toggleField(idx) {
      const content = document.getElementById('field-content-' + idx);
      const icon = document.getElementById('field-icon-' + idx);
      
      if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        icon.classList.remove('expanded');
      } else {
        content.classList.add('expanded');
        icon.classList.add('expanded');
      }
    }
    
    function expandAll() {
      document.querySelectorAll('.field-card-content').forEach(el => {
        el.classList.add('expanded');
      });
      document.querySelectorAll('.expand-icon').forEach(el => {
        el.classList.add('expanded');
      });
    }
    
    function collapseAll() {
      document.querySelectorAll('.field-card-content').forEach(el => {
        el.classList.remove('expanded');
      });
      document.querySelectorAll('.expand-icon').forEach(el => {
        el.classList.remove('expanded');
      });
    }
  </script>
</body>
</html>`;

    // Download as file
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Field_Analysis_${focusedFile}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="feature-analysis-container">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <div className="header-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
          </div>
          <div>
            <h1 className="header-title">{title}</h1>
            <p className="header-subtitle">
              Analyzing <span className="file-highlight">{focusedFile}</span> file usage across legacy programs
            </p>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="export-buttons">
            <button className="export-btn excel" onClick={exportToExcel} title="Export to Excel">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
              Export Excel
            </button>
            <button className="export-btn markdown" onClick={exportToMarkdown} title="Export to Markdown">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
              Export Markdown
            </button>
            <button className="export-btn html" onClick={exportToHTML} title="Export to Interactive HTML">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
              Export HTML
            </button>
          </div>
          <button className="action-btn" onClick={expandAll}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,3 21,3 21,9"/>
              <polyline points="9,21 3,21 3,15"/>
              <line x1="21" y1="3" x2="14" y2="10"/>
              <line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
            Expand All
          </button>
          <button className="action-btn" onClick={collapseAll}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4,14 10,14 10,20"/>
              <polyline points="20,10 14,10 14,4"/>
              <line x1="14" y1="10" x2="21" y2="3"/>
              <line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
            Collapse All
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <SummaryStats data={data} focusedFile={focusedFile} />

      {/* Tab Navigation */}
      <div className="tabs-container">
        <div className="tabs-header">
          <button
            className={`tab-button ${activeTab === 'operations' ? 'active' : ''}`}
            onClick={() => setActiveTab('operations')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            Operation Distribution
          </button>
          <button
            className={`tab-button ${activeTab === 'fields' ? 'active' : ''}`}
            onClick={() => setActiveTab('fields')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="3" y1="15" x2="21" y2="15"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
              <line x1="15" y1="3" x2="15" y2="21"/>
            </svg>
            Field Usage Across Programs
          </button>
          <button
            className={`tab-button ${activeTab === 'programs' ? 'active' : ''}`}
            onClick={() => setActiveTab('programs')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
            Program Analysis
            <span className="tab-badge">{filteredPrograms.length}</span>
          </button>
        </div>

        <div className="tabs-content">
          {/* Operation Distribution Tab */}
          {activeTab === 'operations' && (
            <OperationDistribution data={data} focusedFile={focusedFile} />
          )}

          {/* Field Usage Matrix Tab */}
          {activeTab === 'fields' && (
            <FieldUsageMatrix data={data} focusedFile={focusedFile} />
          )}

          {/* Programs List Tab */}
          {activeTab === 'programs' && (
            <div className="programs-section">
              <div className="programs-filter-bar">
                <div className="filter-group">
                  <button
                    className={`filter-toggle ${showOnlyWithBusinessFunctions ? 'active' : ''}`}
                    onClick={() => setShowOnlyWithBusinessFunctions(!showOnlyWithBusinessFunctions)}
                    title="Show only programs with business functions"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <line x1="3" y1="9" x2="21" y2="9"/>
                      <line x1="9" y1="21" x2="9" y2="9"/>
                    </svg>
                    <span>Show only with Business Functions</span>
                    {showOnlyWithBusinessFunctions && (
                      <span className="filter-count">{filteredPrograms.length}</span>
                    )}
                  </button>
                </div>
                
                <div className="filter-group operations-filter">
                  <div className="operations-filter-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                    <span>Filter by Operations:</span>
                  </div>
                  <div className="operations-filter-buttons">
                    {availableOperations.map(operation => (
                      <button
                        key={operation}
                        className={`operation-filter-btn ${selectedOperations.has(operation) ? 'active' : ''}`}
                        onClick={() => toggleOperation(operation)}
                        title={`Filter programs with ${operation} operation`}
                      >
                        <OperationBadge operation={operation} size="sm" />
                      </button>
                    ))}
                    {selectedOperations.size > 0 && (
                      <button
                        className="clear-filters-btn"
                        onClick={clearOperationFilters}
                        title="Clear operation filters"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        Clear ({selectedOperations.size})
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="filter-group operations-filter">
                  <div className="operations-filter-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 7V4h16v3"/>
                      <path d="M9 20h6"/>
                      <path d="M12 4v16"/>
                    </svg>
                    <span>Filter by Fields:</span>
                  </div>
                  <div className="operations-filter-buttons">
                    {availableFields.map(field => (
                      <button
                        key={field.fieldNumber}
                        className={`field-filter-btn ${selectedFields.has(field.fieldNumber) ? 'active' : ''}`}
                        onClick={() => toggleField(field.fieldNumber)}
                        title={`Field ${field.fieldNumber} - ${field.fieldName} (used in ${field.count} program${field.count !== 1 ? 's' : ''})`}
                      >
                        <span className="field-filter-badge">
                          <span className="field-filter-num">#{field.fieldNumber}</span>
                          <span className="field-filter-name">{field.fieldName}</span>
                          <span className="field-filter-count">{field.count}</span>
                        </span>
                      </button>
                    ))}
                    {selectedFields.size > 0 && (
                      <button
                        className="clear-filters-btn"
                        onClick={clearFieldFilters}
                        title="Clear field filters"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        Clear ({selectedFields.size})
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="filter-group">
                  <div className="alias-filter-group">
                    <span className="filter-label">Alias Filter:</span>
                    <button
                      className={`alias-filter-btn ${aliasFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setAliasFilter('all')}
                      title="Show all fields"
                    >
                      All Fields
                    </button>
                    <button
                      className={`alias-filter-btn ${aliasFilter === 'alias-only' ? 'active' : ''}`}
                      onClick={() => setAliasFilter('alias-only')}
                      title="Show only alias fields"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="17 11 19 13 23 9"/>
                      </svg>
                      Alias Only
                    </button>
                    <button
                      className={`alias-filter-btn ${aliasFilter === 'non-alias' ? 'active' : ''}`}
                      onClick={() => setAliasFilter('non-alias')}
                      title="Exclude alias fields"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                      Non-Alias
                    </button>
                  </div>
                  
                  <button
                    className={`filter-toggle ${hideComments ? 'active' : ''}`}
                    onClick={() => setHideComments(!hideComments)}
                    title="Hide comment-only field accesses"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      {hideComments && <line x1="3" y1="3" x2="21" y2="21" strokeWidth="3"/>}
                    </svg>
                    <span>{hideComments ? 'Comments Hidden' : 'Show Comments'}</span>
                  </button>
                </div>
              </div>
              <div className="programs-grid">
                {filteredPrograms.length === 0 ? (
                  <div className="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p className="empty-state-text">
                      {showOnlyWithBusinessFunctions || selectedOperations.size > 0 || selectedFields.size > 0 || aliasFilter !== 'all'
                        ? 'No programs match the selected filters'
                        : 'No programs found'}
                    </p>
                  </div>
                ) : (
                  filteredPrograms.map((program) => (
                  <ProgramCard
                    key={program.source_file_name}
                    program={program}
                    focusedFile={focusedFile}
                    isExpanded={expandedPrograms.has(program.source_file_name)}
                    onToggle={() => toggleProgram(program.source_file_name)}
                    selectedOperations={selectedOperations}
                    selectedFields={selectedFields}
                    aliasFilter={aliasFilter}
                    hideComments={hideComments}
                  />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .feature-analysis-container {
          min-height: 100vh;
          background: #f9fafb;
          padding: 32px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        
        .header-content {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .header-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #fb851e 0%, #e76f00 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(251, 133, 30, 0.3);
        }
        
        .header-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 4px 0;
        }
        
        .header-subtitle {
          font-size: 0.9375rem;
          color: #6b7280;
          margin: 0;
        }
        
        .file-highlight {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          color: #fb851e;
          background: #fff7ed;
          padding: 2px 8px;
          border-radius: 4px;
        }
        
        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .export-buttons {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .export-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 10px 16px;
          color: #6b7280;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .export-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .export-btn.excel {
          background: #dcfce7;
          border-color: #86efac;
          color: #166534;
        }
        
        .export-btn.excel:hover {
          background: #bbf7d0;
          border-color: #4ade80;
        }
        
        .export-btn.markdown {
          background: #f3e8ff;
          border-color: #c4b5fd;
          color: #6b21a8;
        }
        
        .export-btn.markdown:hover {
          background: #e9d5ff;
          border-color: #a78bfa;
        }
        
        .export-btn.html {
          background: #fef3c7;
          border-color: #fcd34d;
          color: #92400e;
        }
        
        .export-btn.html:hover {
          background: #fde68a;
          border-color: #fbbf24;
        }
        
        .export-btn svg {
          flex-shrink: 0;
        }
        
        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 10px 16px;
          color: #9ca3af;
        }
        
        .search-box input {
          background: none;
          border: none;
          outline: none;
          color: #1f2937;
          font-size: 0.875rem;
          width: 180px;
        }
        
        .search-box input::placeholder {
          color: #9ca3af;
        }
        
        .action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 10px 16px;
          color: #6b7280;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .action-btn:hover {
          background: #fff7ed;
          color: #e76f00;
          border-color: #fb851e;
        }
        
        .tabs-container {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .tabs-header {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }
        
        .tab-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px 24px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: #6b7280;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }
        
        .tab-button:hover {
          background: white;
          color: #1f2937;
        }
        
        .tab-button.active {
          background: white;
          color: #fb851e;
          border-bottom-color: #fb851e;
        }
        
        .tab-button svg {
          flex-shrink: 0;
        }
        
        .tab-badge {
          font-size: 0.75rem;
          font-weight: 600;
          color: #9a3412;
          background: #fff7ed;
          padding: 2px 8px;
          border-radius: 12px;
          border: 1px solid #fed7aa;
          margin-left: 8px;
        }
        
        .tabs-content {
          padding: 24px;
        }
        
        .programs-section {
          margin: 0;
        }
        
        .programs-filter-bar {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .filter-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .operations-filter {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }
        
        .operations-filter-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #374151;
        }
        
        .operations-filter-label svg {
          color: #fb851e;
        }
        
        .operations-filter-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }
        
        .operation-filter-btn {
          display: flex;
          align-items: center;
          padding: 4px 8px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .operation-filter-btn:hover {
          border-color: #fb851e;
          background: #fff7ed;
        }
        
        .operation-filter-btn.active {
          border-color: #fb851e;
          background: #fff7ed;
          box-shadow: 0 0 0 2px rgba(251, 133, 30, 0.2);
        }
        
        .clear-filters-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          color: #6b7280;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .clear-filters-btn:hover {
          background: #fef2f2;
          border-color: #ef4444;
          color: #dc2626;
        }
        
        .clear-filters-btn svg {
          width: 14px;
          height: 14px;
        }
        
        .filter-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px 16px;
          color: #6b7280;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .filter-toggle:hover {
          background: #fff7ed;
          border-color: #fed7aa;
          color: #fb851e;
        }
        
        .filter-toggle.active {
          background: #fff7ed;
          border-color: #fb851e;
          color: #fb851e;
        }
        
        .filter-toggle svg {
          flex-shrink: 0;
        }
        
        .filter-count {
          font-size: 0.75rem;
          font-weight: 600;
          background: #fb851e;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          margin-left: 4px;
        }
        
        .programs-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px 32px;
          text-align: center;
          color: #9ca3af;
        }
        
        .empty-state svg {
          margin-bottom: 16px;
          opacity: 0.5;
        }
        
        .empty-state-text {
          font-size: 0.9375rem;
          color: #6b7280;
          margin: 0;
        }
        
        .field-filter-btn {
          display: flex;
          align-items: center;
          padding: 4px 8px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .field-filter-btn:hover {
          border-color: #8b5cf6;
          background: #f3e8ff;
        }
        
        .field-filter-btn.active {
          border-color: #8b5cf6;
          background: #f3e8ff;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
        }
        
        .field-filter-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
        }
        
        .field-filter-num {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          color: #8b5cf6;
          background: #f3e8ff;
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        .field-filter-name {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          color: #6b7280;
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .field-filter-count {
          font-size: 0.7rem;
          font-weight: 600;
          color: #9ca3af;
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 10px;
        }
        
        .alias-filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 6px;
        }
        
        .filter-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #374151;
          margin-right: 8px;
        }
        
        .alias-filter-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .alias-filter-btn:hover {
          border-color: #8b5cf6;
          background: #f3e8ff;
          color: #8b5cf6;
        }
        
        .alias-filter-btn.active {
          border-color: #8b5cf6;
          background: #8b5cf6;
          color: white;
        }
        
        .alias-filter-btn svg {
          width: 14px;
          height: 14px;
        }
        
        @media (max-width: 768px) {
          .feature-analysis-container {
            padding: 16px;
          }
          
          .header {
            flex-direction: column;
          }
          
          .header-actions {
            width: 100%;
          }
          
          .search-box {
            flex: 1;
          }
          
          .search-box input {
            width: 100%;
          }
          
          .tabs-header {
            flex-direction: column;
          }
          
          .tab-button {
            border-bottom: 1px solid #e5e7eb;
            border-right: none;
          }
          
          .tab-button.active {
            border-bottom-color: #fb851e;
          }
          
          .tabs-content {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default FocusedFeatureAnalysis;