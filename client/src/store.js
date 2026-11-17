import { configureStore, createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: { token: localStorage.getItem('token'), user: null },
  reducers: {
    setCredentials(state, action) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem('token', action.payload.token);
    },
    setUser(state, action) { state.user = action.payload; },
    signOut(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem('token');
    }
  }
});

const uiSlice = createSlice({
  name: 'ui',
  initialState: { theme: localStorage.getItem('theme') || 'dark' },
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', state.theme);
    }
  }
});

export const { setCredentials, setUser, signOut } = authSlice.actions;
export const { toggleTheme } = uiSlice.actions;
export const store = configureStore({ reducer: { auth: authSlice.reducer, ui: uiSlice.reducer } });
