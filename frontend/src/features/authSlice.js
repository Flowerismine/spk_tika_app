import API_URL from "../api";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
    user: null,
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: ""
};

export const LoginUser = createAsyncThunk("user/LoginUser", async(user, thunkAPI) => {
    try {
        const response = await axios.post(`${API_URL}/login`, {
            username: user.username,
            password: user.password
        });
        
        // Store token in localStorage
        if (response.data && response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    } catch (error) {
        if (error.response){
            const message = error.response.data.msg || "Login Gagal";
            return thunkAPI.rejectWithValue(message);
        }
        return thunkAPI.rejectWithValue("Tidak dapat terhubung ke server backend.");
    }
});

export const getMe = createAsyncThunk("user/getMe", async(_, thunkAPI) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            return thunkAPI.rejectWithValue("No token");
        }
        const response = await axios.get(`${API_URL}/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        if (error.response){
            const message = error.response.data.msg || "Token tidak valid";
            return thunkAPI.rejectWithValue(message);
        }
        return thunkAPI.rejectWithValue("Koneksi terputus");
    }
});

export const LogOut = createAsyncThunk("user/LogOut", async(_, thunkAPI) => {
    try {
        const token = localStorage.getItem('token');
        if (token) {
            await axios.delete(`${API_URL}/logout`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }).catch(() => {});
        }
        localStorage.removeItem('token');
    } catch (error) {
        localStorage.removeItem('token');
        return thunkAPI.rejectWithValue("Logout failed");
    }
});

export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers:{
        reset: (state) => {
            state.isError = false;
            state.isSuccess = false;
            state.isLoading = false;
            state.message = "";
        }
    },
    extraReducers: (builder) => {
        builder.addCase(LoginUser.pending, (state) => {
            state.isLoading = true;
            state.isError = false;
            state.message = "";
        })
        builder.addCase(LoginUser.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isSuccess = true;
            state.user = action.payload;
            state.isError = false;
            state.message = "";
        })
        builder.addCase(LoginUser.rejected, (state, action) => {
            state.isLoading = false;
            state.isError = true;
            state.message = action.payload;
        })

        // Get User Login
        builder.addCase(getMe.pending, (state) => {
            state.isLoading = true;
        })
        builder.addCase(getMe.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isSuccess = true;
            state.user = action.payload;
            state.isError = false;
            state.message = "";
        })
        builder.addCase(getMe.rejected, (state, action) => {
            state.isLoading = false;
            state.isError = true;
            state.message = action.payload;
        })

        builder.addCase(LogOut.fulfilled, (state) => {
            state.user = null;
            state.isSuccess = false;
            state.isLoading = false;
            state.isError = false;
            state.message = "";
        })
    }
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;