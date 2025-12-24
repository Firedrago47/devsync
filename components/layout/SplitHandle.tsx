'use client';

import React from 'react';
import clsx from 'clsx';

type SplitHandleProps = {
  direction: 'vertical' | 'horizontal';
  onMouseDown: () => void;
};

const SplitHandle: React.FC<SplitHandleProps> = ({
  direction,
  onMouseDown,
}) => {
  const isVertical = direction === 'vertical';

  return (
    <div
      onMouseDown={onMouseDown}
      className={clsx(
        'transition-colors',
        isVertical
          ? 'w-1 h-full cursor-col-resize bg-[#2D2D2D] hover:bg-[#3E3E3E]'
          : 'h-1 w-full cursor-row-resize bg-[#2D2D2D] hover:bg-[#3E3E3E]'
      )}
    />
  );
};

export default SplitHandle;
