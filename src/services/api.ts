/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { ApiFilter } from "../types";

const PROXY_URL = "https://psycho-serve.vercel.app/?url=";
const API_BASE_URL = "https://app.nufa.ai/api/v1";
const WS_URL = "wss://app-webs.nufa.ai";

// Create axios instance with default config
const api = axios.create({
  baseURL: PROXY_URL + API_BASE_URL,
  headers: {
    accept: "*/*",
    "content-type": "application/json",
  },
});

class ApiService {
  private apiKey: string | null = null;
  private ws: WebSocket | null = null;

  constructor() {
    this.apiKey = localStorage.getItem("nufa_api_key");
    if (this.apiKey) {
      api.defaults.headers.common["api-auth-key"] = this.apiKey;
    }
  }

  private async ensureAuth(): Promise<string> {
    if (this.apiKey) {
      return this.apiKey;
    }

    try {
      const tempId = uuidv4();
      const response = await api.post("/temp-auth", { temp_id: tempId });
      const authToken = response.data["auth-token"];

      this.apiKey = authToken;
      localStorage.setItem("nufa_api_key", authToken);
      api.defaults.headers.common["api-auth-key"] = authToken;

      return authToken;
    } catch (error) {
      console.error("Authentication failed:", error);
      throw new Error("Failed to authenticate");
    }
  }

  async uploadImage(file: File, blob: Blob): Promise<string> {
    await this.ensureAuth();

    const formData = new FormData();
    formData.append(file.name, blob, "blob");
    const config = [{ key: file.name, type: "input_image" }];
    formData.append("config", JSON.stringify(config));

    try {
      const response = await api.post("/photo/register-resource", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          priority: "u=1, i",
        },
      });

      const [result] = response.data;
      return result.id;
    } catch (error) {
      console.error("Upload failed:", error);
      throw new Error("Failed to upload image");
    }
  }

  async getFilters(): Promise<ApiFilter[]> {
    await this.ensureAuth();

    try {
      const response = await api.get("/configs/home-filters");

      const seenIds = new Set<string>(); // Track unique IDs

      return response.data
        .filter((category: any) => category.type === "category")
        .flatMap((category: any) => category.items)
        .map((item: any) => ({
          id: item.id,
          image_url: item.image_url,
        }))
        .filter((item: any) => {
          if (seenIds.has(item.id)) return false; // Skip duplicates
          seenIds.add(item.id);
          return true;
        });
    } catch (error) {
      console.error("Failed to fetch filters:", error);
      throw new Error("Failed to fetch filters");
    }
  }

  async applyFilter(imageId: string, filterId: string): Promise<string> {
    await this.ensureAuth();

    try {
      const response = await api.post("/photo/action-sequence", [
        {
          action: "apply-filter",
          config: {
            filter_id: filterId,
            output_count: 1,
            input: [
              {
                id: imageId,
                type: "input_image",
              },
            ],
          },
        },
      ]);

      const [result] = response.data;
      return result.action_id;
    } catch (error) {
      console.error("Failed to apply filter:", error);
      throw new Error("Failed to apply filter");
    }
  }

  listenToProcessing(actionId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.apiKey) {
        reject(new Error("No API key available"));
        return;
      }

      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      this.ws = new WebSocket(`${WS_URL}/?key=${this.apiKey}`);

      this.ws.onopen = () => {
        this.ws?.send(
          JSON.stringify({
            name: "processing-connect",
            "api-auth-key": this.apiKey,
            data: { action_id: actionId },
          })
        );
        console.log("Action ID:", actionId);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.name === "processing-estimate") {
            const data = JSON.parse(message.data);
            console.log("Processing estimate:", data.estimated_seconds, "s");
          }

          if (message.name === "processing-resource-ready") {
            const data = JSON.parse(message.data);
            console.log("Resource ready:", data.url);
            this.ws?.close();
            resolve(data.url);
          }
        } catch (error) {
          console.error("WebSocket message error:", error);
          reject(error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        reject(error);
      };
    });
  }
}

export const apiService = new ApiService();

export { api };
