# Scorecard overhaul contracts (WS0)

Normative JSON shapes for parallel workstreams **WS1–WS5**. TypeScript mirrors live in `src/lib/schemas.ts`; validators are `validate*` functions in the same module.

| Doc | Workstream consumers | Key types |
|-----|---------------------|-----------|
| [4.1-interview.md](./4.1-interview.md) | WS2 | `InterviewFile`, `InterviewHandoffFile`, `InterviewAnswer` |
| [4.2-naming.md](./4.2-naming.md) | WS1, WS4, WS2 | `ManualFile.projectName`, `manualTitleFromProjectName` |
| [4.3-architecture.md](./4.3-architecture.md) | WS3 | `ArchitectureFile`, `ArchitectureNode`, `ArchitectureGroup` |
| [4.4-font-pack.md](./4.4-font-pack.md) | WS5 | `FontPackManifest`, `ThemeJson.fontPackId` |
| [4.5-font-trace.md](./4.5-font-trace.md) | WS5 | `FontTracePackPaths`, `FONT_PACK_DIR_LAYOUT` |
| [4.6-media-blocks.md](./4.6-media-blocks.md) | WS4 | `LiveBlock`, `ShotBlock`, `MotionBlock`, `DeskBlock` |

Fixtures under `fixtures/` are valid examples for tests and agent RED runs. JSON Schema copies live in `json-schema/`.