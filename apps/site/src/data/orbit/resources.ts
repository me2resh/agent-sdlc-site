import planSchema from './plan.schema.json';
import snapshotSchema from './project-snapshot.schema.json';
import reconciliationSchema from './reconciliation.schema.json';
import sliceSchema from './execution-slice.schema.json';
import planMinimal from './examples/plan-minimal.json';
import planComplete from './examples/plan-sso.json';
import snapshotMinimal from './examples/project-snapshot-minimal.json';
import snapshotComplete from './examples/project-snapshot-2026-09-14.json';
import reconciliationMinimal from './examples/reconciliation-minimal.json';
import reconciliationComplete from './examples/reconciliation-001.json';
import sliceMinimal from './examples/slice-minimal.json';
import sliceComplete from './examples/slice-001.json';

export type JsonObject = Record<string, unknown>;
export type ResourceExample = {
  label: string;
  slug: string;
  record: JsonObject;
  sourcePath: string;
};

export type ResourceDefinition = {
  key: string;
  canonicalName: string;
  displayName: string;
  description: string;
  purpose: string;
  references: string;
  schema: JsonObject;
  schemaPath: string;
  sourcePath: string;
  examples: ResourceExample[];
  relationships: { name: string; reference: string; meaning: string }[];
  invariants: string[];
  related: { label: string; href: string }[];
};

const example = (label: string, slug: string, record: JsonObject, sourcePath: string): ResourceExample => ({ label, slug, record, sourcePath });

export const resources: ResourceDefinition[] = [
  {
    key: 'plan', canonicalName: 'Plan', displayName: 'Plan',
    description: 'Durable planning intent and desired outcomes.',
    purpose: 'A durable declaration of intent, outcomes, acceptance criteria, and the planning context that should survive execution cycles.',
    references: 'Project', schema: planSchema as JsonObject,
    schemaPath: '/schema/plan.schema.json', sourcePath: 'apps/site/src/data/orbit/plan.schema.json',
    examples: [example('Minimal Plan', 'minimal', planMinimal as JsonObject, 'apps/site/src/data/orbit/examples/plan-minimal.json'), example('Complete Plan', 'customer-sso', planComplete as JsonObject, 'apps/site/src/data/orbit/examples/plan-sso.json')],
    relationships: [
      { name: 'Project', reference: 'project.id', meaning: 'Identifies the project whose durable intent this Plan describes.' },
      { name: 'Outcomes', reference: 'outcomes[].id', meaning: 'Groups one or more desired results within the Plan.' },
      { name: 'Acceptance Criteria', reference: 'acceptanceCriteria[].id', meaning: 'Names stable checks that determine whether an Outcome is achieved.' }
    ],
    invariants: ['A Plan revision identifies the version of durable intent assessed by later records.', 'Acceptance Criteria retain stable IDs within the Plan revision that defines them.', 'Each Acceptance Criterion references an Outcome in the same Plan.'],
    related: [{ label: 'Project Snapshot', href: '/schemas/project-snapshot' }, { label: 'Reconciliation', href: '/schemas/reconciliation' }, { label: 'Execution Slice', href: '/schemas/execution-slice' }]
  },
  {
    key: 'project-snapshot', canonicalName: 'ProjectSnapshot', displayName: 'Project Snapshot',
    description: 'Point-in-time observed project and repository state.',
    purpose: 'A factual observation of project and repository state at a specific time.',
    references: 'Project, repositories', schema: snapshotSchema as JsonObject,
    schemaPath: '/schema/project-snapshot.schema.json', sourcePath: 'apps/site/src/data/orbit/project-snapshot.schema.json',
    examples: [example('Minimal Project Snapshot', 'minimal', snapshotMinimal as JsonObject, 'apps/site/src/data/orbit/examples/project-snapshot-minimal.json'), example('Complete Project Snapshot', 'customer-platform', snapshotComplete as JsonObject, 'apps/site/src/data/orbit/examples/project-snapshot-2026-09-14.json')],
    relationships: [
      { name: 'Project', reference: 'project.id', meaning: 'Identifies the project whose state was observed.' },
      { name: 'Repositories', reference: 'repositories[].repositoryId', meaning: 'Names each repository and records its branch and commit.' }
    ],
    invariants: ['observedAt records when the project state was observed.', 'Repository commits identify the state available to a reconciliation.', 'A snapshot may support more than one reconciliation only when it contains the facts relevant to each Plan.'],
    related: [{ label: 'Plan', href: '/schemas/plan' }, { label: 'Reconciliation', href: '/schemas/reconciliation' }]
  },
  {
    key: 'reconciliation', canonicalName: 'Reconciliation', displayName: 'Reconciliation',
    description: 'Structured assessment of a Plan against current evidence.',
    purpose: 'An assessment of a Plan revision against a ProjectSnapshot, with observations, criterion assessments, and planning-relevant discoveries.',
    references: 'Plan revision, ProjectSnapshot, Acceptance Criteria', schema: reconciliationSchema as JsonObject,
    schemaPath: '/schema/reconciliation.schema.json', sourcePath: 'apps/site/src/data/orbit/reconciliation.schema.json',
    examples: [example('Minimal Reconciliation', 'minimal', reconciliationMinimal as JsonObject, 'apps/site/src/data/orbit/examples/reconciliation-minimal.json'), example('Complete Reconciliation', 'partial-verification', reconciliationComplete as JsonObject, 'apps/site/src/data/orbit/examples/reconciliation-001.json')],
    relationships: [
      { name: 'Plan', reference: 'planId + planRevision', meaning: 'Identifies the exact Plan revision being assessed.' },
      { name: 'ProjectSnapshot', reference: 'projectSnapshotId', meaning: 'Identifies the observed project state used for the assessment.' },
      { name: 'Acceptance Criteria', reference: 'criterionAssessments[].criterionId', meaning: 'Links each assessment to a canonical criterion in the Plan revision.' }
    ],
    invariants: ['Criterion assessments refer to canonical Acceptance Criteria by ID.', 'A Reconciliation does not rewrite acceptance-criterion wording.', 'Observations describe factual current state; discoveries describe planning-relevant implications.'],
    related: [{ label: 'Plan', href: '/schemas/plan' }, { label: 'Project Snapshot', href: '/schemas/project-snapshot' }, { label: 'Execution Slice', href: '/schemas/execution-slice' }]
  },
  {
    key: 'execution-slice', canonicalName: 'ExecutionSlice', displayName: 'Execution Slice',
    description: 'The next bounded change justified by current evidence.',
    purpose: 'A bounded, execution-ready change derived from a Reconciliation and tied to the Plan revision and repository state that justified it.',
    references: 'Plan revision, Outcome, Reconciliation, Acceptance Criteria, repository provenance', schema: sliceSchema as JsonObject,
    schemaPath: '/schema/execution-slice.schema.json', sourcePath: 'apps/site/src/data/orbit/execution-slice.schema.json',
    examples: [example('Minimal Execution Slice', 'minimal', sliceMinimal as JsonObject, 'apps/site/src/data/orbit/examples/slice-minimal.json'), example('Complete Execution Slice', 'customer-sso', sliceComplete as JsonObject, 'apps/site/src/data/orbit/examples/slice-001.json')],
    relationships: [
      { name: 'Based on', reference: 'basedOn.planRevision + basedOn.reconciliationId', meaning: 'Identifies the Plan revision and Reconciliation that justified this slice.' },
      { name: 'Advances', reference: 'outcomeId', meaning: 'Links the bounded change to an Outcome in the Plan.' },
      { name: 'Contributes to', reference: 'contributesTo[]', meaning: 'Links the change to Acceptance Criteria it advances.' },
      { name: 'Bound to', reference: 'basedOn.repositories', meaning: 'Preserves relevant repository revisions used to justify the slice.' }
    ],
    invariants: ['basedOn.planRevision identifies the Plan revision used during reconciliation.', 'basedOn.reconciliationId identifies the Reconciliation that justified the slice.', 'contributesTo references Acceptance Criteria in the referenced Plan revision.', 'Repository provenance identifies the state against which the slice was justified.', 'If relevant Plan or repository provenance changes before execution, the slice is stale and must be reconciled again.'],
    related: [{ label: 'Plan', href: '/schemas/plan' }, { label: 'Reconciliation', href: '/schemas/reconciliation' }, { label: 'Execution handoff', href: '/adopter-guide#handoff' }]
  }
];

export function resourceByKey(key: string): ResourceDefinition | undefined { return resources.find(resource => resource.key === key); }

export function resourceExample(resource: ResourceDefinition, slug: string): ResourceExample | undefined { return resource.examples.find(item => item.slug === slug); }

type SchemaNode = { type?: string; const?: unknown; enum?: unknown[]; minimum?: number; minLength?: number; required?: string[]; properties?: Record<string, SchemaNode>; items?: SchemaNode; description?: string };

export type FieldRow = { field: string; type: string; required: string; meaning: string; constraints: string };

const semanticMeaning: Record<string, string> = {
  'specVersion': 'ORBIT specification version.', id: 'Stable resource identifier.', revision: 'Plan revision number.',
  'project': 'Project identity associated with the record.', 'project.id': 'Stable project identifier.', title: 'Human-readable Plan title.', intent: 'Durable planning intent.',
  'outcomes': 'Desired results within the Plan.', 'outcomes[].id': 'Stable Outcome identifier.', 'outcomes[].title': 'Outcome title.', 'outcomes[].intent': 'Outcome intent.',
  'acceptanceCriteria': 'Stable checks for desired Outcomes.', 'acceptanceCriteria[].id': 'Stable Acceptance Criterion identifier.', 'acceptanceCriteria[].outcomeId': 'Outcome assessed by the criterion.', 'acceptanceCriteria[].statement': 'Canonical criterion wording.',
  'observedAt': 'Time at which project state was observed.', repositories: 'Observed repository states.', 'repositories[].repositoryId': 'Stable repository identifier.', 'repositories[].branch': 'Observed branch.', 'repositories[].commit': 'Observed repository revision.',
  'planId': 'Referenced Plan identifier.', 'planRevision': 'Referenced Plan revision.', 'projectSnapshotId': 'Referenced ProjectSnapshot identifier.', 'reconciledAt': 'Time at which the assessment was produced.', observations: 'Factual observations from the snapshot.', 'criterionAssessments': 'Assessments of canonical Acceptance Criteria.', 'criterionAssessments[].criterionId': 'Referenced Acceptance Criterion identifier.', 'criterionAssessments[].status': 'Assessment status.', 'criterionAssessments[].evidence': 'Evidence supporting the assessment.', 'criterionAssessments[].explanation': 'Assessment explanation.', assumptionAssessments: 'Assessments of Plan assumptions.', discoveries: 'Planning-relevant discoveries.',
  outcomeId: 'Referenced Outcome identifier.', basedOn: 'Provenance for the slice.', 'basedOn.planRevision': 'Plan revision used for reconciliation.', 'basedOn.reconciliationId': 'Reconciliation that justified the slice.', 'basedOn.repositories': 'Repository revisions used as evidence.', objective: 'Bounded change objective.', why: 'Reason the change is justified.', contributesTo: 'Acceptance Criteria advanced by the slice.', scope: 'Explicit change boundary.', 'scope.include': 'Included work.', 'scope.exclude': 'Excluded work.'
};

function nodeType(node: SchemaNode): string {
  if (node.const !== undefined) return `const ${JSON.stringify(node.const)}`;
  if (node.type === 'array') return node.items?.type ? `array<${node.items.type}>` : 'array';
  return node.type ?? 'any';
}

function constraintText(node: SchemaNode): string {
  const constraints: string[] = [];
  if (node.const !== undefined) constraints.push(`must equal ${JSON.stringify(node.const)}`);
  if (node.enum) constraints.push(`one of ${node.enum.join(', ')}`);
  if (node.minLength !== undefined) constraints.push(`minLength ${node.minLength}`);
  if (node.minimum !== undefined) constraints.push(`minimum ${node.minimum}`);
  if (node.type === 'array' && node.items?.enum) constraints.push(`items: ${node.items.enum.join(', ')}`);
  return constraints.join('; ');
}

export function fieldRows(schema: JsonObject): FieldRow[] {
  const root = schema as SchemaNode;
  const rows: FieldRow[] = [];
  const visit = (node: SchemaNode, prefix: string, parentRequired: boolean) => {
    for (const [name, child] of Object.entries(node.properties ?? {})) {
      const path = prefix ? `${prefix}.${name}` : name;
      const required = Boolean(node.required?.includes(name));
      const effectiveRequired = parentRequired && required;
      rows.push({ field: path, type: nodeType(child), required: effectiveRequired ? 'yes' : parentRequired ? 'optional' : 'conditional', meaning: child.description ?? semanticMeaning[path] ?? semanticMeaning[name] ?? 'Defined by the canonical schema.', constraints: constraintText(child) });
      if (child.type === 'object') visit(child, path, effectiveRequired);
      if (child.type === 'array' && child.items?.type === 'object') visit(child.items, `${path}[]`, effectiveRequired);
    }
  };
  visit(root, '', true);
  return rows;
}
