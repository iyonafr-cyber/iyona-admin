import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { logout } from "./authSlice";

export type LanguageCode = "en" | "fr";

export interface LanguageState {
  current: LanguageCode;
}

const initialState: LanguageState = {
  current: "en",
};

const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<LanguageCode>) => {
      state.current = action.payload;
    },
    toggleLanguage: (state) => {
      state.current = state.current === "en" ? "fr" : "en";
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, () => initialState);
  },
});

export const { setLanguage, toggleLanguage } = languageSlice.actions;
export default languageSlice.reducer;

