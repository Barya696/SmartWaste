const API_BASE_URL = "http://localhost:8080/api/users";

const fetchOptions = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
});

export interface User {
  id?: number;
  username: string;
  password?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role: "ADMIN" | "SUPERVISOR" | "COLLECTOR" | "CITIZEN";
  department?: "WASTE_COLLECTION_OPERATIONS" | "RECYCLING_OPERATIONS";
  district?: string;
  bankAccountNumber?: string;
  isBlocked?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export class UserService {
  static async getAllUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE_URL}`, fetchOptions("GET"));
      if (!response.ok) throw new Error("Failed to fetch users");
      return await response.json();
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }

  static async getUserById(id: number): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, fetchOptions("GET"));
      if (!response.ok) throw new Error("Failed to fetch user");
      return await response.json();
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error;
    }
  }

  static async createUser(user: User): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}`, fetchOptions("POST", user));
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create user");
      }
      return await response.json();
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  static async updateUser(id: number, user: Partial<User>): Promise<User> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/${id}`,
        fetchOptions("PUT", user),
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update user");
      }
      return await response.json();
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  static async updateProfile(id: number, profile: Partial<User>): Promise<User> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/${id}/profile`,
        fetchOptions("PUT", profile),
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }
      return await response.json();
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  }

  static async deleteUser(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, fetchOptions("DELETE"));
      if (!response.ok) throw new Error("Failed to delete user");
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  static async blockUser(id: number): Promise<void> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/${id}/block`,
        fetchOptions("PUT"),
      );
      if (!response.ok) throw new Error("Failed to block user");
    } catch (error) {
      console.error("Error blocking user:", error);
      throw error;
    }
  }

  static async unblockUser(id: number): Promise<void> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/${id}/unblock`,
        fetchOptions("PUT"),
      );
      if (!response.ok) throw new Error("Failed to unblock user");
    } catch (error) {
      console.error("Error unblocking user:", error);
      throw error;
    }
  }
}
