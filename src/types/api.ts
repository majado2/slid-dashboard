export interface DashboardStats {
  users: {
    total_users: number;
    active_location_users: number;
    inactive_location_users: number;
    benefited_users: number;
    not_benefited_users: number;
  };
  tracking: {
    total_requests: number;
    requests_by_status: {
      new: number;
      in_progress: number;
      done: number;
      rejected: number;
    };
  };
  authorities: {
    total_authorities: number;
  };
}

export interface TrackingRequest {
  id: number;
  beneficiary_id: number;
  authority_id: number;
  channel: "API" | "SMS";
  status: "new" | "in_progress" | "done" | "rejected";
  created_at: string;
}

export interface TrackingLog {
  id: number;
  request_id: number;
  latitude: number;
  longitude: number;
  accuracy_m: number;
  altitude_m: number;
  captured_at: string;
}

export interface LoginRequest {
  mobile: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    mobile: string;
    name: string;
  };
}
