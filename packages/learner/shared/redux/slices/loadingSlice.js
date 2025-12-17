import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLoading: false,
};

const slice = createSlice({
  name: 'loading',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setLoading } =  slice.actions;

export const selectIsLoading = state => state.loading.isLoading;

export default slice.reducer;
