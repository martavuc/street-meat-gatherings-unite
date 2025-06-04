import axios from 'axios';

const API_URL = '/api';

// Create axios instance with default config
const api = axios.create({
  // keep the proxy-friendly baseURL, but allow an env override when you deploy
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem("token");   
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Types
export interface User {
  id: number;
  name: string;
  email?: string;
  image_url?: string;
  pickup_location: string;
  time_slot?: string;
  is_admin: boolean;
  created_at: string;
  updated_at?: string;
  orders?: Order[];
}

export interface Order {
  id: number;
  user_id: number;
  menu_item_id: number;
  pickup_location: string;
  time_slot: string;
  details?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  menu_item: MenuItem;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: string;
  is_available: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Post {
  id: number;
  content: string;
  location_filter?: string;
  author_id: number;
  created_at: string;
  updated_at?: string;
  author: User;
  likes_count: number;
  comments_count: number;
  comments: Comment[];
  is_liked_by_user?: boolean;
}

export interface Comment {
  id: number;
  content: string;
  author_id: number;
  post_id: number;
  parent_id?: number;
  created_at: string;
  updated_at?: string;
  author: User;
  likes_count: number;
  replies: Comment[];
  is_liked_by_user?: boolean;
}

export interface PickupLocation {
  id: number;
  name: string;
  address: string;
  created_at: string;
}

export interface TimeSlot {
  id: number;
  time: string;
  created_at: string;
}

export interface LikeResponse {
  liked: boolean;
  likes_count: number;
}

// Auth API
export const authAPI = {
  /** POST /api/auth/register  — JSON body */
  register: (u: { name: string; email: string; password: string }) =>
    api.post("/auth/register", u).then(r => r.data),

  /** POST /api/auth/login  — x-www-form-urlencoded */
  login: (email: string, password: string) =>
    api
      .post(
        "/auth/login",
        new URLSearchParams({ username: email, password }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      )
      .then(r => ({ access_token: r.data.access_token })),

  /** GET /api/auth/me  */
  getCurrentUser: () => api.get("/auth/me").then(r => r.data),

  updateUser: async (userData: any) => {
    const response = await api.put('/auth/me', userData);
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/auth/users');
    return response.data;
  },

  getPickupLocations: async () => {
    const response = await api.get('/auth/pickup-locations');
    return response.data;
  },

  getTimeSlots: async () => {
    const response = await api.get('/auth/time-slots');
    return response.data;
  },

  getMyOrders: async () => {
    const response = await api.get('/orders/me');
    return response.data;
  },
};

// Menu API
export const menuAPI = {
  getTodaysMenu: () => api.get('/menu/today').then(res => res.data),
  createOrder: (orderData: { menu_item_id: number; pickup_location: string; time_slot: string; details?: string }) =>
    api.post('/orders', orderData).then(res => res.data),
  getMyOrders: () => api.get('/orders/me').then(res => res.data),
  getOrder: (orderId: number) => api.get(`/orders/${orderId}`).then(res => res.data),
  getPickupLocations: () => api.get('/pickup-locations').then(res => res.data),
  getTimeSlots: () => api.get('/time-slots').then(res => res.data),
};

// Social Feed API
export const socialAPI = {
  getPosts: async (locationFilter?: string, userId?: number) => {
    const response = await api.get('/social/posts', {
      params: {
        location_filter: locationFilter,
        user_id: userId,
      },
    });
    return response.data;
  },

  createPost: async (content: string, locationFilter?: string) => {
    const response = await api.post('/social/posts', { content, location_filter: locationFilter });
    return response.data;
  },

  updatePost: async (postId: number, data: { content: string }, userId: number) => {
    const response = await api.put(`/social/posts/${postId}`, data);
    return response.data;
  },

  deletePost: async (postId: number, userId: number) => {
    const response = await api.delete(`/social/posts/${postId}`);
    return response.data;
  },

  likePost: async (postId: number) => {
    const response = await api.post(`/social/posts/${postId}/like`);
    return response.data;
  },

  createComment: async (postId: number, content: string, parentId?: number) => {
    const response = await api.post(`/social/posts/${postId}/comments`, { content, parent_id: parentId });
    return response.data;
  },

  likeComment: async (postId: number, commentId: number) => {
    const response = await api.post(`/social/posts/${postId}/comments/${commentId}/like`);
    return response.data;
  },

  getUsersByLocation: async (location: string) => {
    const response = await api.get(`/social/users-by-location/${location}`);
    return response.data;
  },

  createUserProfilePost: async (userId: number, location: string) => {
    const response = await api.post(`/social/user-profile-post/${userId}?location=${location}`);
    return response.data;
  },
};

export default api; 