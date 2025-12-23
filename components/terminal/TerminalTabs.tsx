// 'use client';

// import React, { useState } from 'react';
// import Terminal from './Terminal';
// import { X } from 'lucide-react';

// interface Tab {
//   id: string;
//   label: string;
// }

// const TerminalTabs: React.FC = () => {
//   const [tabs, setTabs] = useState<Tab[]>([{ id: '1', label: 'Terminal 1' }]);
//   const [activeTabId, setActiveTabId] = useState('1');

//   const handleNewTab = () => {
//     const newId = Date.now().toString();
//     setTabs([...tabs, { id: newId, label: `Terminal ${tabs.length + 1}` }]);
//     setActiveTabId(newId);
//   };

//   const handleClose = (e: React.MouseEvent, id: string) => {
//     e.stopPropagation();
//     const remainingTabs = tabs.filter(tab => tab.id !== id);
//     setTabs(remainingTabs);
//     if (activeTabId === id && remainingTabs.length > 0) {
//       setActiveTabId(remainingTabs[0].id);
//     }
//   };

//   return (
//     <div className="flex flex-col h-full bg-[#1e1e1e] text-white border-t border-gray-700">
//       <div className="flex border-b border-gray-700 text-sm">
//         {tabs.map(tab => (
//           <div
//             key={tab.id}
//             onClick={() => setActiveTabId(tab.id)}
//             className={`flex items-center px-3 py-1.5 cursor-pointer border-r border-gray-700 ${
//               tab.id === activeTabId ? 'bg-[#252526]' : 'bg-[#1e1e1e]'
//             }`}
//           >
//             {tab.label}
//             <X
//               size={14}
//               className="ml-2 hover:text-red-400"
//               onClick={e => handleClose(e, tab.id)}
//             />
//           </div>
//         ))}
//         <div
//           className="px-3 py-1.5 cursor-pointer hover:bg-gray-700"
//           onClick={handleNewTab}
//         >
//           +
//         </div>
//       </div>

//       <div className="flex-1">
//         {tabs.map(tab =>
//           tab.id === activeTabId ? (
//             <div key={tab.id} className="h-full">
//               <Terminal />
//             </div>
//           ) : null
//         )}
//       </div>
//     </div>
//   );
// };

// export default TerminalTabs;
