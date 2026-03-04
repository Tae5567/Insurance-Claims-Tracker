import { create } from 'zustand';
import { Claim } from '../types';

interface ClaimsState {
  claims: Claim[];
  draftClaim: Partial<Claim> | null;
  isLoading: boolean;
  setClaims: (claims: Claim[]) => void;
  addClaim: (claim: Claim) => void;
  updateClaim: (id: string, updates: Partial<Claim>) => void;
  setDraftClaim: (draft: Partial<Claim> | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useClaimsStore = create<ClaimsState>((set) => ({
  claims: [],
  draftClaim: null,
  isLoading: false,
  setClaims: (claims) => set({ claims }),
  addClaim: (claim) => set((state) => ({ claims: [claim, ...state.claims] })),
  updateClaim: (id, updates) =>
    set((state) => ({
      claims: state.claims.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  setDraftClaim: (draftClaim) => set({ draftClaim }),
  setLoading: (isLoading) => set({ isLoading }),
}));