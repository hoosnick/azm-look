/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { jwtDecode } from "jwt-decode";
import { Filter } from "../types";

const PROXY_URL = "https://psycho-serve.vercel.app/?url=";
const API_BASE_URL = "https://app.nufa.ai/api/v1";
const WS_URL = "wss://app-webs.nufa.ai";

// Common Headers
const JSON_HEADERS = {
  accept: "*/*",
  "content-type": "application/json",
};

const MULTIPART_HEADERS = {
  "Content-Type": "multipart/form-data",
  priority: "u=1, i",
};

// Create axios instance with default config
const api = axios.create({
  baseURL: `${PROXY_URL}${API_BASE_URL}`,
  headers: JSON_HEADERS,
});

class ApiService {
  private apiKey: string | null = localStorage.getItem("nufa_api_key");
  private ws: WebSocket | null = null;

  constructor() {
    if (this.apiKey) {
      api.defaults.headers.common["api-auth-key"] = this.apiKey;
    }
  }

  private async ensureAuth(): Promise<string> {
    if (this.apiKey && !this.isTokenExpired(this.apiKey)) {
      return this.apiKey;
    }

    try {
      const { data } = await api.post("/temp-auth", { temp_id: uuidv4() });
      const authToken = data["auth-token"];

      if (!authToken) {
        throw new Error("No auth token received from API");
      }

      this.apiKey = authToken;
      localStorage.setItem("nufa_api_key", authToken);
      api.defaults.headers.common["api-auth-key"] = authToken;

      return authToken;
    } catch (error) {
      this.handleError("Authentication failed", error);
      throw new Error("Failed to authenticate");
    }
  }

  private isTokenExpired(token: string): boolean {
    const decodedToken: any = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    console.log(
      "Token expiry:",
      decodedToken.exp,
      "Expired:",
      decodedToken.exp < currentTime
    );
    return decodedToken.exp < currentTime;
  }

  private handleError(message: string, error: unknown): void {
    console.error(message, error);
  }

  async uploadImage(file: File, blob: Blob): Promise<string> {
    await this.ensureAuth();

    const formData = new FormData();
    formData.append(file.name, blob, "blob");
    formData.append(
      "config",
      JSON.stringify([{ key: file.name, type: "input_image" }])
    );

    try {
      const { data } = await api.post("/photo/register-resource", formData, {
        headers: MULTIPART_HEADERS,
      });
      return data[0].id;
    } catch (error) {
      this.handleError("Upload failed", error);
      throw new Error("Failed to upload image");
    }
  }

  async getFilters(): Promise<Filter[]> {
    await this.ensureAuth();

    try {
      const { data } = await api.get("/configs/home-filters");

      const seenIds = new Set<string>();
      const filters = data
        .filter((cat: any) => cat.type === "category")
        .flatMap((cat: any) =>
          cat.items.map((item: any) => ({
            id: item.id,
            image: item.image_url,
            category: cat.name,
          }))
        )
        .filter(({ id }: { id: string }) =>
          seenIds.has(id) ? false : seenIds.add(id)
        );

      return filters;
    } catch (error) {
      this.handleError("Failed to fetch filters", error);
      throw new Error("Failed to fetch filters");
    }
  }

  async applyFilter(imageId: string, filterId: string): Promise<string> {
    await this.ensureAuth();

    try {
      const { data } = await api.post("/photo/action-sequence", [
        {
          action: "apply-filter",
          config: {
            filter_id: filterId,
            output_count: 1,
            input: [{ id: imageId, type: "input_image" }],
          },
        },
      ]);
      return data[0].action_id;
    } catch (error) {
      this.handleError("Failed to apply filter", error);
      throw new Error("Failed to apply filter");
    }
  }

  listenToProcessing(actionId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.apiKey) {
        return reject(new Error("No API key available"));
      }

      // Close existing WebSocket connection
      if (this.ws) {
        this.ws.close();
      }

      this.ws = new WebSocket(`${WS_URL}/?key=${this.apiKey}`);

      this.ws.addEventListener("open", () => {
        this.ws?.send(
          JSON.stringify({
            name: "processing-connect",
            "api-auth-key": this.apiKey,
            data: { action_id: actionId },
          })
        );
        console.log("Action ID:", actionId);
      });

      this.ws.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.name === "processing-estimate") {
            const { estimated_seconds } = JSON.parse(message.data);
            console.log("Processing estimate:", estimated_seconds, "s");
          }

          if (message.name === "processing-resource-ready") {
            const { url } = JSON.parse(message.data);
            console.log("Resource ready:", url);
            this.ws?.close();
            resolve(url);
          }
        } catch (error) {
          this.handleError("WebSocket message error", error);
          reject(error);
        }
      });

      this.ws.addEventListener("error", (error) => {
        this.handleError("WebSocket error", error);
        reject(error);
      });

      // Cleanup WebSocket listeners when done
      this.ws.addEventListener("close", () => {
        this.ws = null;
      });
    });
  }

  async fetchImage(url: string): Promise<string> {
    try {
      const response = await api.get(PROXY_URL + url, { responseType: "blob" });
      const blob = new Blob([response.data], { type: response.data.type });
      return URL.createObjectURL(blob);
    } catch (error) {
      this.handleError("Failed to fetch image", error);
      throw new Error("Failed to fetch image");
    }
  }
}

export const apiService = new ApiService();
export { api };
