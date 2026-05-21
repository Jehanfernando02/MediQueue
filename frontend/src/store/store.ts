import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import doctorReducer from "./slices/doctorSlice";
import departmentReducer from "./slices/departmentSlice";
import appointmentReducer from "./slices/appointmentSlice";
import queueReducer from "./slices/queueSlice";
import notificationReducer from "./slices/notificationSlice";
import adminReducer from "./slices/adminSlice";


export const store = configureStore({
  reducer: {
    auth: authReducer,
    doctor: doctorReducer,
    department: departmentReducer,
    appointment: appointmentReducer,
    queue: queueReducer,
    notification: notificationReducer,
    admin: adminReducer,

  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Allow plain thunk functions (our thunks return promises, not actions)
      serializableCheck: {
        ignoredActions: ["auth/setAuthSuccess"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
