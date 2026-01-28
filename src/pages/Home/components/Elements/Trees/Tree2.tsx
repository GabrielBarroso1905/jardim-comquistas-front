import React from 'react';

interface TreeProps {
  x: number;
  y: number;
  size?: number;
  foliageColor?: string;
  trunkColor?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const Tree2: React.FC<TreeProps> = ({
  x,
  y,
  size = 1,
  foliageColor = '#E29F0F',
  trunkColor = '#65320b',
  onMouseEnter,
  onMouseLeave,
}) => {
  const treeHeight = 95 * size;
  const treeWidth = 90 * size;

  return (
    <svg
      width={treeWidth}
      height={treeHeight}
      viewBox="0 0 1024 1024"
      className="absolute pointer-events-auto"
      style={{
        left: x - treeWidth / 2,
        top: y - treeHeight + 8 ,
        zIndex: 10,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <path
       d="M517.8 48.725c-197.993 0-358.863 146.949-358.863 328.701s160.87 328.7 358.864 328.7 358.864-146.948 358.864-328.7c0-180.979-160.87-328.7-358.864-328.7"
         fill={foliageColor}
      />
      <path
        d="M517.8 60.326c-30.163-1.547-149.268 12.375-240.531 87.396C232.41 184.072 171.31 276.11 168.218 382.84c-4.641 219.65 198.767 283.843 198.767 283.843s-58.006-13.148-119.88-92.81c-54.912-70.38-61.099-237.438 49.5-366.598C401.014 85.849 517.8 60.326 517.8 60.326"
        fill="#E8EB33"
      />
      <path
          d="M622.985 951.3c-16.242 51.818-164.737 41.763-154.683 1.546 24.75-98.224 58.006-208.048 44.858-256-4.64-18.562-46.405-22.43-109.051-26.296-37.898-2.32-104.411-34.03-133.027-88.17-6.961-13.147 42.537 18.563 80.435 41.765 37.897 22.429 80.435 32.483 148.495 34.804 3.867 0-42.538-10.055-85.075-28.617s-67.287-65.74-62.647-84.302c2.32-10.054 18.562 23.976 75.021 64.194 35.577 24.749 103.638 47.178 126.84 38.67 84.302-31.71 105.184-139.988 114.465-118.332 24.75 61.873-62.646 112.145-72.7 119.106-8.508 6.187 37.123 3.867 106.73-28.617 23.976-11.6 105.958-74.247 92.037-51.818-65.74 104.41-194.9 88.169-212.689 121.426-33.257 63.42 46.405 245.172 40.99 260.64"
       fill={trunkColor}
      />
    </svg>


  );
};

export default Tree2;
