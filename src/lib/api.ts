import { DashboardStats, TrackingRequest, TrackingLog, LoginRequest, LoginResponse } from "@/types/api";

const API_BASE_URL = "https://slid.ethra2.com";

// Mock API for development - replace with real API calls
const useMockAPI = true;

// Mock data
const mockDashboardStats: DashboardStats = {
  users: {
    total_users: 10,
    active_location_users: 6,
    inactive_location_users: 4,
    benefited_users: 5,
    not_benefited_users: 5,
  },
  tracking: {
    total_requests: 12,
    requests_by_status: {
      new: 3,
      in_progress: 5,
      done: 3,
      rejected: 1,
    },
  },
  authorities: {
    total_authorities: 4,
  },
};

const mockTrackingRequests: TrackingRequest[] = [
  {
    id: 1,
    beneficiary_id: 101,
    authority_id: 10,
    channel: "API",
    status: "new",
    created_at: "2025-01-15T10:30:00Z",
  },
  {
    id: 2,
    beneficiary_id: 102,
    authority_id: 11,
    channel: "SMS",
    status: "in_progress",
    created_at: "2025-01-14T14:20:00Z",
  },
  {
    id: 3,
    beneficiary_id: 103,
    authority_id: 10,
    channel: "API",
    status: "done",
    created_at: "2025-01-13T09:15:00Z",
  },
  {
    id: 4,
    beneficiary_id: 104,
    authority_id: 12,
    channel: "SMS",
    status: "rejected",
    created_at: "2025-01-12T16:45:00Z",
  },
];

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  if (useMockAPI) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (credentials.mobile === "0588888888" && credentials.password === "password") {
      return {
        token: "mock-token-12345",
        user: {
          mobile: credentials.mobile,
          name: "مستخدم حكومي",
        },
      };
    }
    throw new Error("بيانات تسجيل الدخول غير صحيحة");
  }

  const response = await fetch(`${API_BASE_URL}/api/authority/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error("فشل تسجيل الدخول");
  }

  return response.json();
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (useMockAPI) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockDashboardStats;
  }

  const response = await fetch(`${API_BASE_URL}/api/stats/dashboard`);
  if (!response.ok) {
    throw new Error("فشل جلب الإحصائيات");
  }
  return response.json();
}

export async function getTrackingRequests(): Promise<TrackingRequest[]> {
  if (useMockAPI) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockTrackingRequests;
  }

  const response = await fetch(`${API_BASE_URL}/api/tracking-requests`);
  if (!response.ok) {
    throw new Error("فشل جلب الطلبات");
  }
  return response.json();
}

export async function getTrackingRequestDetails(id: number): Promise<TrackingRequest> {
  if (useMockAPI) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const request = mockTrackingRequests.find(r => r.id === id);
    if (!request) throw new Error("الطلب غير موجود");
    return request;
  }

  const response = await fetch(`${API_BASE_URL}/api/tracking-requests/${id}`);
  if (!response.ok) {
    throw new Error("فشل جلب تفاصيل الطلب");
  }
  return response.json();
}

export async function getTrackingLogs(requestId: number): Promise<TrackingLog[]> {
  if (useMockAPI) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      {
        id: 1,
        request_id: requestId,
        latitude: 24.7136,
        longitude: 46.6753,
        accuracy_m: 5,
        altitude_m: 612,
        captured_at: "2025-01-15T10:30:00Z",
      },
      {
        id: 2,
        request_id: requestId,
        latitude: 24.7145,
        longitude: 46.6760,
        accuracy_m: 8,
        altitude_m: 615,
        captured_at: "2025-01-15T10:35:00Z",
      },
    ];
  }

  const response = await fetch(`${API_BASE_URL}/api/tracking-requests/${requestId}/logs`);
  if (!response.ok) {
    throw new Error("فشل جلب سجلات التتبع");
  }
  return response.json();
}
