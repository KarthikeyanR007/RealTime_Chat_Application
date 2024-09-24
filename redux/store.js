import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice'; // Adjust the path accordingly

const store = configureStore({
  reducer: {
    user: userReducer, // Register the user reducer
  },
});

export default store;
