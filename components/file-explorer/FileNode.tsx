// 'use client';

// import { useState } from 'react';
// import { ChevronDown, ChevronRight, FileText, Folder } from 'lucide-react';
// import { FileNodeType } from './FileTree';

// type Props = {
//   node: FileNodeType;
//   onFileSelect: (filePath: string, content: string) => void;
//   currentPath: string;
// };

// const FileNode = ({ node, onFileSelect, currentPath }: Props) => {
//   const [expanded, setExpanded] = useState(true);
//   const fullPath = currentPath ? `${currentPath}/${node.name}` : node.name;

//   const handleClick = () => {
//     if (node.type === 'file') {
//       onFileSelect(fullPath, `// Contents of ${node.name}`);
//     } else {
//       setExpanded(!expanded);
//     }
//   };

//   return (
//     <div className="ml-2">
//       <div
//         onClick={handleClick}
//         className="flex items-center gap-1 cursor-pointer hover:bg-zinc-700 px-2 py-1 rounded"
//       >
//         {node.type === 'folder' ? (
//           <>
//             {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
//             <Folder size={14} className="text-yellow-400" />
//           </>
//         ) : (
//           <FileText size={14} className="text-blue-400" />
//         )}
//         <span className="text-sm">{node.name}</span>
//       </div>

//       {expanded &&
//         node.type === 'folder' &&
//         node.children?.map((child) => (
//           <FileNode
//             key={child.id}
//             node={child}
//             onFileSelect={onFileSelect}
//             currentPath={fullPath}
//           />
//         ))}
//     </div>
//   );
// };

// export default FileNode;
