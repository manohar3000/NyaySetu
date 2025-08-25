import axios from '../utils/axios';

export const documentApi = {
  summarizeText: async (text: string) => {
    const response = await axios.post('/api/documents/summarize-text', { text });
    return response.data;
  },
  
  summarizeFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post('/api/documents/summarize-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  getHistory: async () => {
    const response = await axios.get('/api/documents/history');
    return response.data;
  }
};

export const chatApi = {
  sendMessage: async (message: string) => {
    const response = await axios.post('/api/chat/message', { 
      message
    });
    return response.data;
  }
};

export const caseApi = {
  uploadMaterials: async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    const response = await axios.post('/api/case/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  debateTurn: async (caseId: string, message: string) => {
    const response = await axios.post(`/api/case/${caseId}/debate`, { message });
    return response.data;
  }
};

export const reportApi = {
  generateReport: async (data: any) => {
    const response = await axios.post('/api/reports/generate', data);
    return response.data;
  },
  
  getTemplates: async () => {
    const response = await axios.get('/api/reports/templates');
    return response.data;
  }
};

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await axios.post('/api/auth/login', { email, password });
    return response.data;
  },
  
  register: async (userData: any) => {
    const response = await axios.post('/api/auth/register', userData);
    return response.data;
  },
  
  getProfile: async () => {
    const response = await axios.get('/api/auth/me');
    return response.data;
  }
};

export const appointmentApi = {
  getMyAppointments: async () => {
    const response = await axios.get('/api/appointments/my-appointments');
    return response.data;
  },
  
  suggestSlots: async (data: {
    title: string;
    description: string;
    preferred_date: string;
    preferred_time: string;
    duration_minutes: number;
    timezone: string;
  }) => {
    const response = await axios.post('/api/appointments/suggest-slots', data);
    return response.data;
  },
  
  bookAppointment: async (data: {
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    timezone: string;
  }) => {
    const response = await axios.post('/api/appointments/book', data);
    return response.data;
  },
  
  cancelAppointment: async (appointmentId: string) => {
    const response = await axios.post(`/api/appointments/${appointmentId}/cancel`);
    return response.data;
  }
};
