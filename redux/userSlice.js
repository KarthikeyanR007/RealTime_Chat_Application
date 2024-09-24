// userSlice.js
import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: null,
  },
  reducers: {
    setUser(state, action) {
      state.user = action.payload; // Set the user data
    },
    clearUser(state) {
      state.user = null; // Clear the user data
    },
  },
});

// Export actions
export const { setUser, clearUser } = userSlice.actions;

// Export the reducer
export default userSlice.reducer;
