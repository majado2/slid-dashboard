import {
  DashboardStats,
  TrackingRequest,
  TrackingLog,
  LoginRequest,
  LoginResponse,
  Beneficiary,
  TrackingRequestFull,
  CreateTrackingRequest,
  BeneficiaryOption,
  AuthorityOption,
  TrackingStatus,
} from "@/types/api";

const API_BASE_URL = "https://slid.ethra2.com";

// Mock API for development - replace with real API calls
const useMockAPI = false;

const authHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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
    beneficiary_name: "عبدالله السبيعي",
    beneficiary_national_id: "1010000001",
    authority_name: "وزارة الداخلية",
    channel: "API",
    status: "new",
    created_at: "2025-01-15T10:30:00Z",
  },
  {
    id: 2,
    beneficiary_id: 102,
    authority_id: 11,
    beneficiary_name: "محمد العتيبي",
    beneficiary_national_id: "1010000002",
    authority_name: "وزارة الصحة",
    channel: "SMS",
    status: "in_progress",
    created_at: "2025-01-14T14:20:00Z",
  },
  {
    id: 3,
    beneficiary_id: 103,
    authority_id: 10,
    beneficiary_name: "خالد الحربي",
    beneficiary_national_id: "1010000003",
    authority_name: "وزارة الداخلية",
    channel: "API",
    status: "done",
    created_at: "2025-01-13T09:15:00Z",
  },
  {
    id: 4,
    beneficiary_id: 104,
    authority_id: 12,
    beneficiary_name: "سارة الشهري",
    beneficiary_national_id: "1010000004",
    authority_name: "وزارة التعليم",
    channel: "SMS",
    status: "rejected",
    created_at: "2025-01-12T16:45:00Z",
  },
];

const mockBeneficiaries: Beneficiary[] = [
  {
    id: 1,
    name: "مستفيد تجريبي",
    mobile: "0550000000",
    national_id: "1111111111",
    location_verification: "inactive",
  },
];
const mockBeneficiaryOptions: BeneficiaryOption[] = mockBeneficiaries.map((b) => ({
  id: b.id || 0,
  name: b.name,
  national_id: b.national_id,
}));
const mockAuthorities: AuthorityOption[] = [
  { id: 10, name: "وزارة الداخلية" },
  { id: 11, name: "وزارة الصحة" },
  { id: 12, name: "وزارة التعليم" },
];

const mockLogs: TrackingLog[] = [
  {
    id: 1,
    request_id: 1,
    latitude: 24.7136,
    longitude: 46.6753,
    accuracy_m: 5,
    altitude_m: 612,
    captured_at: "2025-01-15T10:30:00Z",
  },
  {
    id: 2,
    request_id: 1,
    latitude: 24.7145,
    longitude: 46.676,
    accuracy_m: 8,
    altitude_m: 615,
    captured_at: "2025-01-15T10:35:00Z",
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

  const data = await response.json();
  const token = data.token || data.access_token;
  if (!token) {
    throw new Error("رمز الدخول غير موجود في الاستجابة");
  }

  return {
    token,
    user: {
      mobile: credentials.mobile,
      name: data.name || "مستخدم حكومي",
    },
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (useMockAPI) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockDashboardStats;
  }

  const response = await fetch(`${API_BASE_URL}/api/stats/dashboard`, {
    headers: {
      ...authHeaders(),
    },
  });
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

  const response = await fetch(`${API_BASE_URL}/api/tracking-requests`, {
    headers: {
      ...authHeaders(),
    },
  });
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

  const response = await fetch(`${API_BASE_URL}/api/tracking-requests/${id}`, {
    headers: {
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error("فشل جلب تفاصيل الطلب");
  }
  return response.json();
}

export async function getTrackingLogs(requestId: number): Promise<TrackingLog[]> {
  if (useMockAPI) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockLogs.filter((log) => log.request_id === requestId);
  }

  const response = await fetch(`${API_BASE_URL}/api/tracking-requests/${requestId}/logs`, {
    headers: {
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error("فشل جلب سجلات التتبع");
  }
  return response.json();
}

export async function getTrackingRequestFull(id: number): Promise<TrackingRequestFull> {
  if (useMockAPI) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const request = mockTrackingRequests.find((r) => r.id === id);
    if (!request) {
      throw new Error("الطلب غير موجود");
    }
    return {
      request,
      logs: mockLogs.filter((log) => log.request_id === id),
    };
  }

  const response = await fetch(`${API_BASE_URL}/api/tracking-requests/${id}/full`, {
    headers: {
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error("فشل جلب تفاصيل الطلب");
  }
  return response.json();
}

export async function addTrackingLog(requestId: number, payload: Omit<TrackingLog, "id" | "request_id">): Promise<TrackingLog> {
  if (useMockAPI) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const nextId = mockLogs.length + 1;
    const newLog: TrackingLog = { ...payload, id: nextId, request_id: requestId };
    mockLogs.push(newLog);
    return newLog;
  }

  const response = await fetch(`${API_BASE_URL}/api/tracking-requests/${requestId}/logs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("فشل إضافة سجل تتبع");
  }
  return response.json();
}

export async function createTrackingRequest(payload: CreateTrackingRequest): Promise<TrackingRequest> {
  if (useMockAPI) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const nextId = mockTrackingRequests.length + 1;
    const created: TrackingRequest = {
      id: nextId,
      beneficiary_id: payload.beneficiary_id,
      authority_id: payload.authority_id,
      channel: payload.channel,
      status: "new",
      created_at: new Date().toISOString(),
    };
    mockTrackingRequests.push(created);
    return created;
  }

  const response = await fetch(`${API_BASE_URL}/api/tracking-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("فشل إنشاء طلب التتبع");
  }
  return response.json();
}

export async function getBeneficiaryOptions(): Promise<BeneficiaryOption[]> {
  if (useMockAPI) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockBeneficiaryOptions;
  }

  const response = await fetch(`${API_BASE_URL}/api/beneficiaries/options`, {
    headers: {
      ...authHeaders(),
    },
  });
  if (!response.ok) throw new Error("فشل جلب المستفيدين");
  return response.json();
}

export async function getAuthorities(): Promise<AuthorityOption[]> {
  if (useMockAPI) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockAuthorities;
  }

  const response = await fetch(`${API_BASE_URL}/api/authorities`, {
    headers: {
      ...authHeaders(),
    },
  });
  if (!response.ok) throw new Error("فشل جلب الجهات");
  return response.json();
}

export async function getBeneficiaries(): Promise<Beneficiary[]> {
  if (useMockAPI) {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockBeneficiaries;
  }

  const response = await fetch(`${API_BASE_URL}/api/beneficiaries`, {
    headers: {
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error("فشل جلب المستفيدين");
  }
  return response.json();
}

export async function createBeneficiary(payload: Beneficiary): Promise<Beneficiary> {
  if (useMockAPI) {
    await new Promise(resolve => setTimeout(resolve, 400));
    const id = mockBeneficiaries.length + 1;
    const created = { ...payload, id };
    mockBeneficiaries.push(created);
    return created;
  }

  const response = await fetch(`${API_BASE_URL}/api/beneficiaries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("فشل إنشاء المستفيد");
  }
  return response.json();
}

export async function updateBeneficiary(nationalId: string, payload: Partial<Beneficiary>): Promise<Beneficiary> {
  if (useMockAPI) {
    await new Promise(resolve => setTimeout(resolve, 400));
    const idx = mockBeneficiaries.findIndex((b) => b.national_id === nationalId);
    if (idx === -1) throw new Error("المستفيد غير موجود");
    mockBeneficiaries[idx] = { ...mockBeneficiaries[idx], ...payload };
    return mockBeneficiaries[idx];
  }

  const response = await fetch(`${API_BASE_URL}/api/beneficiaries/${nationalId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("فشل تحديث المستفيد");
  }
  return response.json();
}

export async function getBeneficiaryRequests(beneficiaryId: number): Promise<TrackingRequest[]> {
  if (useMockAPI) {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockTrackingRequests.filter((r) => r.beneficiary_id === beneficiaryId);
  }

  const response = await fetch(`${API_BASE_URL}/api/beneficiaries/${beneficiaryId}/tracking-requests`, {
    headers: {
      ...authHeaders(),
    },
  });
  if (!response.ok) {
    throw new Error("فشل جلب طلبات المستفيد");
  }
  return response.json();
}

export async function updateTrackingStatus(id: number, status: TrackingStatus): Promise<TrackingRequest> {
  if (useMockAPI) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const idx = mockTrackingRequests.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("الطلب غير موجود");
    mockTrackingRequests[idx] = { ...mockTrackingRequests[idx], status };
    return mockTrackingRequests[idx];
  }

  const response = await fetch(`${API_BASE_URL}/api/tracking-requests/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error("فشل تحديث حالة الطلب");
  }
  return response.json();
}
