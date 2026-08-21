import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface AuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

export interface AuthUser {
  _id: string;
  email: string;
  role: "user" | "admin";
  isVerified: boolean;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
  isSuspended?: boolean;
}

export interface AuthState {
  isLogin: boolean;
  user: AuthUser | null;
  tokens: AuthTokens | null;
}

const initialState: AuthState = {
  isLogin: false,
  user: null,
  tokens: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (
      state,
      action: PayloadAction<{ user: AuthUser; tokens: AuthTokens }>,
    ) => {
      state.isLogin = true;
      state.user = action.payload.user;
      state.tokens = action.payload.tokens;
    },
    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.isLogin = true;
    },
    logout: (state) => {
      state.isLogin = false;
      state.user = null;
      state.tokens = null;
    },
  },
});

export const { setAuth, setUser, logout } = authSlice.actions;
export default authSlice.reducer;
