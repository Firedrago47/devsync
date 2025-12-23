'use client';

import React, { useEffect } from 'react';

type Props = {
  x: number;
  y: number;
  onClose: () => void;
};

const ContextMenu: React.FC<Props> = ({ x, y, onClose }) => {
  useEffect(() => {
    const handleClickOutside = () => onClose();
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  return (
    <ul
      className="absolute bg-[#252526] border border-gray-700 rounded text-sm shadow-lg z-50"
      style={{ top: y, left: x }}
    >
      <li className="px-4 py-2 hover:bg-gray-600 cursor-pointer">New File</li>
      <li className="px-4 py-2 hover:bg-gray-600 cursor-pointer">New Folder</li>
      <li className="px-4 py-2 hover:bg-gray-600 cursor-pointer">Rename</li>
      <li className="px-4 py-2 hover:bg-gray-600 cursor-pointer">Delete</li>
    </ul>
  );
};

export default ContextMenu;
