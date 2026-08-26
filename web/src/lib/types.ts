export type UserRole = "WORKER" | "CLIENT";

export type SentimentTag = string;

export interface TrustBreakdown {
  total: number; // 0-100
  sentiment: number;
  referrals: number;
  verified: number;
}

export interface MutualConnectionSummary {
  userId: string;
  name: string;
}

export interface WorkerSummary {
  id: string;
  name: string;
  trade: string;
  city: string;
  area: string;
  state?: string | null;
  country?: string | null;
  locationLabel: string;
  trust: TrustBreakdown;
  sentimentTags: SentimentTag[];
  pathToYou?: string;
  inYourNetworkSteps?: number;
  mutualConnections?: MutualConnectionSummary[];
  isDirectConnection?: boolean;
}

export interface NetworkStats {
  peopleConnected: number;
  workersVouching: number;
  reviewsWritten: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface ClientProfileStats {
  peopleEmployed: number;
  jobsPosted: number;
  employeeReviews: number;
  peopleConnected: number;
  workersVouching: number;
  reviewsWritten: number;
}

export type ConnectionRequestStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export interface ConnectionProfileSummary {
  requestId: string;
  userId: string;
  status: ConnectionRequestStatus;
  summary: WorkerSummary;
}

export interface ConnectionRequestLists {
  sent: ConnectionProfileSummary[];
  received: ConnectionProfileSummary[];
}

export interface NetworkSearchResult {
  userId: string;
  summary: WorkerSummary;
}

export interface ConnectionNetworkEntry {
  userId: string;
  role: UserRole;
  worker?: WorkerSummary;
  client?: {
    name: string;
    city: string;
    area: string;
    state?: string | null;
    country?: string | null;
    stats: ClientProfileStats;
  };
}


