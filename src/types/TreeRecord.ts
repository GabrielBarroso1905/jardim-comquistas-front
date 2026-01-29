export type TreeRecord = {
  id: number;
  x: number;
  y: number; // PÉ REAL da árvore (encostado no chão)
  w: number;
  h: number;
  typeKey: string;
  achievement: any;
  anchorY?: number; // proporção do pé (ex: 0.88)
};
export default TreeRecord;
