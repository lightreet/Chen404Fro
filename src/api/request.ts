// Axios 请求封装

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { ElMessage } from 'element-plus';

// 创建 axios 实例
const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const { code, message, data } = response.data;

    // 如果后端返回的状态码不是 200，视为错误
    if (code !== 200) {
      ElMessage.error(message || '请求失败');
      return Promise.reject(new Error(message));
    }

    return data;
  },
  (error) => {
    const { response } = error;

    if (response) {
      const { status, data } = response;

      switch (status) {
        case 401:
          ElMessage.error('未授权，请重新登录');
          // 清除 token 并跳转到登录页（保留当前路径便于登录后回跳）
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          const redirect = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = redirect ? `/login?redirect=${redirect}` : '/login';
          break;
        case 403:
          ElMessage.error('拒绝访问');
          break;
        case 404:
          ElMessage.error('请求的资源不存在');
          break;
        case 500:
          ElMessage.error('服务器内部错误');
          break;
        default:
          ElMessage.error(data?.message || '网络错误');
      }
    } else {
      ElMessage.error('网络连接失败');
    }

    return Promise.reject(error);
  }
);

// 封装 GET 请求
export function get<T>(url: string, params?: object): Promise<T> {
  return request.get(url, { params }) as Promise<T>;
}

// 封装 POST 请求
export function post<T>(url: string, data?: object): Promise<T> {
  return request.post(url, data) as Promise<T>;
}

// 封装 PUT 请求
export function put<T>(url: string, data?: object): Promise<T> {
  return request.put(url, data) as Promise<T>;
}

// 封装 DELETE 请求
export function del<T>(url: string): Promise<T> {
  return request.delete(url) as Promise<T>;
}

export default request;
