import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

// Tell @monaco-editor/react to use the local npm package
// instead of loading Monaco from CDN. This ensures there
// is only ONE Monaco instance — avoiding worker conflicts
// and initialization errors.
loader.config({ monaco });