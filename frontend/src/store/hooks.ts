/**
 * Typed Redux hooks for MediQueue.
 * Always use these instead of plain useDispatch / useSelector
 * to get proper type inference across slices and thunks.
 */
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./store";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T): T =>
  useSelector(selector);
