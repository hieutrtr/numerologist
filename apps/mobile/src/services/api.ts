import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

const DEFAULT_BASE_URL = 'http://localhost:8000/v1';
const rawBaseUrl = process.env.EXPO_PUBLIC_API_URL || DEFAULT_BASE_URL;
const trimmedBaseUrl = rawBaseUrl.replace(/\/+$/, '');
export const API_BASE_URL = trimmedBaseUrl.endsWith('/v1')
  ? trimmedBaseUrl
  : `${trimmedBaseUrl}/v1`;

interface ApiResponse<T> {
  data: T;
  status: number;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          await SecureStore.deleteItemAsync('access_token');
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.client.get<T>(url);
    return { data: response.data, status: response.status };
  }

  async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.client.post<T>(url, data);
    return { data: response.data, status: response.status };
  }

  async put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.client.put<T>(url, data);
    return { data: response.data, status: response.status };
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.client.delete<T>(url);
    return { data: response.data, status: response.status };
  }

  setAuthToken(token: string): void {
    this.client.defaults.headers.Authorization = `Bearer ${token}`;
  }

  clearAuthToken(): void {
    delete this.client.defaults.headers.Authorization;
  }
}

export const apiClient = new ApiClient();
