import { create } from 'zustand';

interface CursorState {
  text: string;
  isHovering: boolean;
  setCursorState: (text: string, isHovering: boolean) => void;
  resetCursor: () => void;
}

export const useCursorStore = create<CursorState>((set) => ({
  text: '',
  isHovering: false,
  setCursorState: (text, isHovering) => set({ text, isHovering }),
  resetCursor: () => set({ text: '', isHovering: false }),
}));
